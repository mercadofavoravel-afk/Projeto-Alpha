import { z } from 'zod';

export const PRESENCE_TTL_MS = 3 * 60_000;
export const REGISTRATION_MS = 30 * 60_000;
export const DEFAULT_SHIFTS = [
  { name: 'Manhã', start: 540, end: 840 },
  { name: 'Tarde e noite', start: 885, end: 540 },
];

export const shiftsSchema = z
  .array(
    z.object({
      name: z.string().trim().min(1).max(50),
      start: z.number().int().min(0).max(1439),
      end: z.number().int().min(0).max(1439),
    }),
  )
  .min(1)
  .max(2)
  .superRefine((shifts, ctx) => {
    const occupied = new Set<number>();
    for (const shift of shifts) {
      const duration = (shift.end - shift.start + 1440) % 1440 || 1440;
      for (let i = 0; i < duration; i++) {
        const minute = (shift.start + i) % 1440;
        if (occupied.has(minute)) {
          ctx.addIssue({
            code: 'custom',
            message: 'Os horários dos plantões não podem se sobrepor.',
          });
          return;
        }
        occupied.add(minute);
      }
    }
  });

export const queueSchema = z.object({
  name: z.string().trim().min(3).max(80),
  regions: z.array(z.string().trim().min(2).max(80)).max(30),
  enabled: z.boolean(),
  shifts: shiftsSchema,
});

export type ShiftSchedule = z.infer<typeof shiftsSchema>;
export type ShiftWindow = { name: string; startsAt: Date; endsAt: Date };

export function normalizeRegion(value?: string | null) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function matchingQueue<T extends { id: string; regions: string[] }>(
  queues: T[],
  region?: string | null,
) {
  const key = normalizeRegion(region);
  return (
    queues
      .filter(
        (q) => q.regions.length === 0 || (key && q.regions.some((r) => normalizeRegion(r) === key)),
      )
      .sort(
        (a, b) =>
          Number(b.regions.length > 0) - Number(a.regions.length > 0) || a.id.localeCompare(b.id),
      )[0] ?? null
  );
}

// Use the IANA timezone, including historical offset rules, rather than the server's clock zone.
function localTime(day: string, minute: number) {
  const utc = new Date(`${day}T00:00:00Z`).getTime() + minute * 60_000;
  const offset = new Intl.DateTimeFormat('en', {
    timeZone: 'America/Sao_Paulo',
    timeZoneName: 'longOffset',
  })
    .formatToParts(new Date(utc))
    .find((p) => p.type === 'timeZoneName')!.value;
  const match = offset.match(/GMT([+-])(\d{2}):(\d{2})/);
  const minutes = match
    ? (Number(match[2]) * 60 + Number(match[3])) * (match[1] === '+' ? 1 : -1)
    : 0;
  return new Date(utc - minutes * 60_000);
}

export function shiftWindows(now: Date, schedules: ShiftSchedule): ShiftWindow[] {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (name: string) => parts.find((p) => p.type === name)!.value;
  const day = `${part('year')}-${part('month')}-${part('day')}`;
  return [-1, 0, 1]
    .flatMap((offset) => {
      const date = new Date(`${day}T12:00:00Z`);
      date.setUTCDate(date.getUTCDate() + offset);
      const localDay = date.toISOString().slice(0, 10);
      return schedules.map((s) => {
        const startsAt = localTime(localDay, s.start);
        const endDate = new Date(`${localDay}T12:00:00Z`);
        if (s.end <= s.start) endDate.setUTCDate(endDate.getUTCDate() + 1);
        return {
          name: s.name,
          startsAt,
          endsAt: localTime(endDate.toISOString().slice(0, 10), s.end),
        };
      });
    })
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

export function currentShift(now: Date, schedules: ShiftSchedule) {
  return shiftWindows(now, schedules).find((s) => s.startsAt <= now && now < s.endsAt) ?? null;
}

export function registrationShift(now: Date, schedules: ShiftSchedule) {
  // Open the next draw's check-in 30 minutes ahead; it never replaces the current draw.
  return (
    shiftWindows(now, schedules).find(
      (s) => s.startsAt > now && s.startsAt.getTime() - now.getTime() <= REGISTRATION_MS,
    ) ?? currentShift(now, schedules)
  );
}

export function shuffled<T>(items: T[], randomInt: (max: number) => number) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function nextInRotation<T extends { position: number | null }>(
  entries: T[],
  cursor: number,
  eligible: (entry: T) => boolean,
) {
  const ordered = entries
    .filter((e) => e.position !== null)
    .sort((a, b) => a.position! - b.position!);
  return (
    [
      ...ordered.filter((e) => e.position! >= cursor),
      ...ordered.filter((e) => e.position! < cursor),
    ].find(eligible) ?? null
  );
}
