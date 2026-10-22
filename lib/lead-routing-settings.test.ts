import { describe, expect, it } from 'vitest';
import { leadRoutingSettingsSchema } from './lead-routing-settings';

describe('configuração da fila do corretor', () => {
  it('salva fila geral sem conservar filtros regionais antigos', () => {
    expect(leadRoutingSettingsSchema.parse({ scope: 'ALL', regions: 'Leblon' })).toEqual([]);
  });
  it('exige bairros na fila regional, inclusive no servidor', () => {
    for (const regions of ['', ' , , ', 'A']) {
      expect(leadRoutingSettingsSchema.safeParse({ scope: 'REGIONAL', regions }).success).toBe(
        false,
      );
    }
    expect(leadRoutingSettingsSchema.safeParse({ scope: 'OTHER', regions: 'Leblon' }).success).toBe(
      false,
    );
  });
  it('limpa espaços e deduplica bairros sem diferenciar acento ou maiúscula', () => {
    expect(
      leadRoutingSettingsSchema.parse({
        scope: 'REGIONAL',
        regions: ' Gávea, gavea, Leblon, LEBLON, ',
      }),
    ).toEqual(['Gávea', 'Leblon']);
  });
  it('recusa bairros acima do limite aceito pelo cadastro', () => {
    expect(
      leadRoutingSettingsSchema.safeParse({ scope: 'REGIONAL', regions: 'x'.repeat(81) }).success,
    ).toBe(false);
    expect(
      leadRoutingSettingsSchema.safeParse({
        scope: 'REGIONAL',
        regions: Array.from({ length: 31 }, (_, i) => `Bairro ${i}`).join(','),
      }).success,
    ).toBe(false);
  });
});
