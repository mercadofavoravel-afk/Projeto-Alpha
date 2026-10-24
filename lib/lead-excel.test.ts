import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';

import { leadExcelBuffer } from './lead-excel';

describe('lead Excel export', () => {
  it('round-trips accented names, phone leading zeroes and formula-like input as literal strings', async () => {
    const rows = [
      ['Nome', 'Telefone', 'Origem'],
      ['João — TESTE', '021999999999', '=HYPERLINK("https://example.invalid")'],
      ['+Pessoa', '+5521999999999', 'Orgânico | artigo: studios'],
    ];
    const bytes = await leadExcelBuffer(rows);
    expect(Array.from(bytes.slice(0, 2))).toEqual([80, 75]);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(bytes.buffer as ArrayBuffer);
    const sheet = workbook.getWorksheet('Leads')!;
    expect(sheet.rowCount).toBe(3);
    rows.forEach((row, rowIndex) =>
      row.forEach((value, columnIndex) => {
        const cell = sheet.getCell(rowIndex + 1, columnIndex + 1);
        expect(cell.value).toBe(value);
        expect(cell.type).toBe(ExcelJS.ValueType.String);
      }),
    );
    expect(sheet.views[0].state).toBe('frozen');
  });
});
