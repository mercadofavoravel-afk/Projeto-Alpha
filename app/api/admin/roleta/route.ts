import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { checkInRoulette, processRouletteQueues, routingTransaction } from '@/lib/lead-routing';
import {
  currentShift,
  normalizeRegion,
  PRESENCE_TTL_MS,
  queueSchema,
  registrationShift,
  shiftsSchema,
} from '@/lib/roulette-rules';
import { isPublicSiteUrl } from '@/lib/public-destination';

export const dynamic = 'force-dynamic';
const roles = ['ADMIN', 'DIRECTOR', 'MANAGER', 'CONSULTANT'];
const managers = ['ADMIN', 'DIRECTOR'];
const operationSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('save'), id: z.string().cuid().optional(), queue: queueSchema }),
  z.object({ action: z.literal('checkin'), id: z.string().cuid() }),
  z.object({ action: z.literal('checkout'), id: z.string().cuid() }),
  z.object({ action: z.literal('pulse') }),
]);

export async function GET() {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  if (!roles.includes(user.role))
    return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });
  const now = new Date();
  const queues = await db.leadRouletteQueue.findMany({
    orderBy: { createdAt: 'asc' },
    take: 30,
    include: {
      sessions: {
        orderBy: { startsAt: 'desc' },
        take: 3,
        include: {
          entries: {
            orderBy: { position: 'asc' },
            include: {
              user: { select: { name: true, isActive: true, acceptsLeads: true, managerId: true } },
            },
          },
        },
      },
    },
  });
  return NextResponse.json(
    {
      canManage: managers.includes(user.role),
      canReceive: user.isActive && user.acceptsLeads,
      queues: await Promise.all(
        queues.map(async (queue) => {
          const schedule = shiftsSchema.safeParse(queue.shifts);
          return {
            id: queue.id,
            name: queue.name,
            enabled: queue.enabled,
            regions: queue.regions,
            shifts: queue.shifts,
            current: schedule.success ? currentShift(now, schedule.data) : null,
            registration: schedule.success ? registrationShift(now, schedule.data) : null,
            pending: managers.includes(user.role)
              ? await db.lead.count({
                  where: {
                    routingQueueId: queue.id,
                    assignedToId: null,
                    status: { notIn: ['WON', 'LOST'] },
                  },
                })
              : null,
            sessions: queue.sessions.map((shift) => ({
              id: shift.id,
              name: shift.name,
              startsAt: shift.startsAt,
              endsAt: shift.endsAt,
              drawnAt: shift.drawnAt,
              nextPosition: shift.nextPosition,
              entries: shift.entries
                .filter(
                  (entry) =>
                    managers.includes(user.role) ||
                    entry.userId === user.id ||
                    (user.role === 'MANAGER' && entry.user.managerId === user.id),
                )
                .map((entry) => ({
                  id: entry.id,
                  mine: entry.userId === user.id,
                  name: entry.user.name || 'Corretor',
                  position: entry.position,
                  checkedOut: !!entry.checkedOutAt,
                  online:
                    !entry.checkedOutAt &&
                    entry.lastSeenAt.getTime() >= now.getTime() - PRESENCE_TTL_MS &&
                    entry.user.isActive &&
                    entry.user.acceptsLeads,
                })),
            })),
          };
        }),
      ),
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}

export async function POST(request: Request) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  if (!roles.includes(user.role))
    return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 });
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin && !isPublicSiteUrl(origin))
    return NextResponse.json({ error: 'Origem inválida.' }, { status: 403 });
  const raw = await request.text();
  if (raw.length > 16_000)
    return NextResponse.json({ error: 'Dados muito grandes.' }, { status: 413 });
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }
  const parsed = operationSchema.safeParse(payload);
  if (!parsed.success)
    return NextResponse.json(
      { error: 'Confira nome, regiões e horários. Os turnos não podem se sobrepor.' },
      { status: 400 },
    );
  const operation = parsed.data;
  if (operation.action === 'save' && !managers.includes(user.role))
    return NextResponse.json(
      { error: 'Somente direção e administração configuram filas.' },
      { status: 403 },
    );
  if (operation.action === 'checkin' && !user.acceptsLeads)
    return NextResponse.json(
      { error: 'A gestão precisa habilitar seu recebimento de leads.' },
      { status: 409 },
    );
  try {
    await routingTransaction(async (tx) => {
      const now = new Date();
      if (operation.action === 'save') {
        const regions = [
          ...new Map(operation.queue.regions.map((r) => [normalizeRegion(r), r])).values(),
        ];
        const existing = await tx.leadRouletteQueue.findMany();
        if (!operation.id && existing.length >= 30) throw new Error('Limite de 30 filas atingido.');
        if (operation.id && !existing.some((q) => q.id === operation.id))
          throw new Error('Fila não encontrada.');
        if (
          existing.some(
            (q) =>
              q.id !== operation.id &&
              (regions.length === 0
                ? q.regions.length === 0
                : q.regions.some((r) =>
                    regions.some((item) => normalizeRegion(item) === normalizeRegion(r)),
                  )),
          )
        )
          throw new Error('Já existe fila para uma dessas regiões. Edite a fila existente.');
        if (operation.id) {
          const previous = existing.find((q) => q.id === operation.id)!;
          const inProgress = await tx.leadRouletteShift.findFirst({
            where: { queueId: operation.id, endsAt: { gt: now } },
            select: { id: true },
          });
          if (
            inProgress &&
            (JSON.stringify(shiftsSchema.parse(previous.shifts)) !==
              JSON.stringify(operation.queue.shifts) ||
              JSON.stringify(previous.regions) !== JSON.stringify(regions))
          )
            throw new Error(
              'Há plantão aberto ou inscrições. Pause a fila; altere horários e regiões após o encerramento.',
            );
        }
        const data = { ...operation.queue, regions };
        const queue = operation.id
          ? await tx.leadRouletteQueue.update({ where: { id: operation.id }, data })
          : await tx.leadRouletteQueue.create({ data });
        await tx.auditLog.create({
          data: {
            action: 'roulette.configured',
            entityType: 'LeadRouletteQueue',
            entityId: queue.id,
            userId: user.id,
            metadata: data,
          },
        });
      } else if (operation.action === 'pulse') {
        await tx.leadRouletteEntry.updateMany({
          where: { userId: user.id, checkedOutAt: null, shift: { endsAt: { gt: now } } },
          data: { lastSeenAt: now },
        });
      } else {
        const queue = await tx.leadRouletteQueue.findUnique({ where: { id: operation.id } });
        if (!queue) throw new Error('Fila não encontrada.');
        if (operation.action === 'checkin') await checkInRoulette(tx, queue, user.id, now);
        else {
          await tx.leadRouletteEntry.updateMany({
            where: {
              userId: user.id,
              checkedOutAt: null,
              shift: { queueId: queue.id, endsAt: { gt: now } },
            },
            data: { checkedOutAt: now },
          });
          await tx.auditLog.create({
            data: {
              action: 'roulette.checkout',
              entityType: 'LeadRouletteQueue',
              entityId: queue.id,
              userId: user.id,
            },
          });
        }
      }
    });
    try {
      await processRouletteQueues();
    } catch {
      return NextResponse.json({
        ok: true,
        warning: 'Alteração salva. A distribuição será retomada na próxima verificação.',
      });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error && !('code' in error)
        ? error.message
        : 'Falha temporária. Atualize e tente novamente.';
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
