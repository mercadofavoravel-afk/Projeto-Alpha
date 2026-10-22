import { describe, expect, it } from 'vitest';
import {
  currentShift,
  DEFAULT_SHIFTS,
  matchingQueue,
  nextInRotation,
  registrationShift,
  shiftsSchema,
  shuffled,
} from './roulette-rules';
const at = (time: string) => new Date(`2026-10-22T${time}:00-03:00`);
describe('plantões imobiliários', () => {
  it('respeita início, intervalo, madrugada e fim exclusivo no horário de Brasília', () => {
    expect(currentShift(at('09:00'), DEFAULT_SHIFTS)?.name).toBe('Manhã');
    expect(currentShift(at('13:59'), DEFAULT_SHIFTS)?.name).toBe('Manhã');
    expect(currentShift(at('14:00'), DEFAULT_SHIFTS)).toBeNull();
    expect(currentShift(at('14:44'), DEFAULT_SHIFTS)).toBeNull();
    expect(currentShift(at('14:45'), DEFAULT_SHIFTS)?.endsAt.toISOString()).toBe(
      '2026-10-23T12:00:00.000Z',
    );
    expect(currentShift(at('00:01'), DEFAULT_SHIFTS)?.startsAt.toISOString()).toBe(
      '2026-10-21T17:45:00.000Z',
    );
    expect(currentShift(at('08:59'), DEFAULT_SHIFTS)?.name).toBe('Tarde e noite');
  });
  it('abre inscrição antecipada sem substituir o plantão em andamento', () => {
    expect(registrationShift(at('08:29'), DEFAULT_SHIFTS)?.name).toBe('Tarde e noite');
    expect(registrationShift(at('08:30'), DEFAULT_SHIFTS)?.name).toBe('Manhã');
    expect(currentShift(at('08:30'), DEFAULT_SHIFTS)?.name).toBe('Tarde e noite');
    expect(registrationShift(at('14:14'), DEFAULT_SHIFTS)).toBeNull();
    expect(registrationShift(at('14:15'), DEFAULT_SHIFTS)?.name).toBe('Tarde e noite');
  });
  it('recusa sobreposição inclusive na madrugada e aceita plantão único de 24 horas', () => {
    expect(shiftsSchema.safeParse(DEFAULT_SHIFTS).success).toBe(true);
    expect(shiftsSchema.safeParse([{ name: 'Integral', start: 540, end: 540 }]).success).toBe(true);
    expect(
      shiftsSchema.safeParse([
        { name: 'Noite', start: 1200, end: 600 },
        { name: 'Manhã', start: 540, end: 840 },
      ]).success,
    ).toBe(false);
    expect(
      shiftsSchema.safeParse([{ name: 'Integral', start: 540, end: 540 }, DEFAULT_SHIFTS[0]])
        .success,
    ).toBe(false);
  });
  it('prioriza fila regional e mantém fila pausada como destino sem desvio', () => {
    const queues = [
      { id: 'general', regions: [], enabled: true },
      { id: 'regional', regions: ['Península'], enabled: false },
    ];
    expect(matchingQueue(queues, 'peninsula')?.id).toBe('regional');
    expect(matchingQueue(queues, null)?.id).toBe('general');
    expect(matchingQueue([queues[1]], null)).toBeNull();
  });
  it('percorre a ordem sorteada, pula indisponíveis e retorna ao início', () => {
    const entries = [
      { position: 0, online: true },
      { position: 1, online: false },
      { position: 2, online: true },
      { position: null, online: true },
    ];
    expect(nextInRotation(entries, 1, (e) => e.online)?.position).toBe(2);
    expect(nextInRotation(entries, 3, (e) => e.online)?.position).toBe(0);
    expect(nextInRotation(entries, 0, () => false)).toBeNull();
  });
  it('sorteia sem perder participantes ou modificar as inscrições', () => {
    const source = ['A', 'B', 'C', 'D'];
    expect(shuffled(source, () => 0)).toEqual(['B', 'C', 'D', 'A']);
    expect(source).toEqual(['A', 'B', 'C', 'D']);
  });
});
