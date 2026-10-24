import ExcelJS from 'exceljs';

// Explicit string cells preserve phone numbers, accents and literal formula-like input.
export async function leadExcelBuffer(rows: string[][]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Projeto Alpha';
  workbook.created = new Date();
  const sheet = workbook.addWorksheet('Leads', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });
  for (const row of rows) sheet.addRow(row.map((value) => String(value ?? '')));
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF18372D' },
  };
  sheet.columns.forEach((column, index) => {
    column.width = index === 1 || index === 3 || index === 7 ? 38 : 24;
    column.numFmt = '@';
  });
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: rows.length, column: rows[0].length },
  };
  return new Uint8Array(await workbook.xlsx.writeBuffer());
}
