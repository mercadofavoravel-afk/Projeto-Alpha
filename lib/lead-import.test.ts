import { describe, expect, it } from 'vitest';
import { importedLeadSchema, normalizePhone, parseCsv, previewLeadTable } from './lead-import';

describe('importação de contatos', () => {
  it('lê CSV com BOM, separador brasileiro, aspas e quebras dentro da célula', () => {
    expect(
      parseCsv(
        '\uFEFFNome;Telefone;Observações\r\n"Ana; Silva";"(21) 99999-1111";"Linha 1\nLinha ""2"""',
      ),
    ).toEqual([
      ['Nome', 'Telefone', 'Observações'],
      ['Ana; Silva', '(21) 99999-1111', 'Linha 1\nLinha "2"'],
    ]);
  });
  it('normaliza DDD e preserva o código do país já informado', () => {
    expect(normalizePhone('(21) 99999-1111')).toBe('5521999991111');
    expect(normalizePhone('+55 21 99999-1111')).toBe('5521999991111');
  });
  it('identifica duplicados por telefone e e-mail sem descartar outras linhas válidas', () => {
    const result = previewLeadTable([
      ['Nome', 'Celular', 'E-mail'],
      ['Ana', '21999991111', 'ANA@example.com'],
      ['Bia', '5521999991111', ''],
      ['Cris', '21999992222', 'ana@example.com'],
      ['Dani', '21999993333', ''],
    ]);
    expect(result.rows).toHaveLength(2);
    expect(result.errors.map((x) => x.line)).toEqual([3, 4]);
  });
  it('aceita mapeamento de cabeçalhos próprios e rejeita dados inválidos', () => {
    const result = previewLeadTable(
      [
        ['Pessoa', 'Contato'],
        ['Ana', '21999991111'],
        ['Bia', 'texto'],
      ],
      { name: 'Pessoa', phone: 'Contato' },
    );
    expect(result.rows).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
  });
  it('a prévia pode voltar pelo endpoint sem inventar e-mail ou consentimento', () => {
    expect(
      importedLeadSchema.parse({ name: 'Ana', phone: '21999991111', email: null }).email,
    ).toBeNull();
    expect(importedLeadSchema.safeParse({ name: 'Ana', phone: '12' }).success).toBe(false);
  });
  it('exige cabeçalhos únicos e rejeita CSV incompleto', () => {
    expect(() =>
      previewLeadTable([
        ['Nome', 'Nome'],
        ['Ana', 'Bia'],
      ]),
    ).toThrow();
    expect(() => parseCsv('Nome,Telefone\n"Ana,21999991111')).toThrow();
  });
});
