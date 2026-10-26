import { beforeEach, describe, expect, it, vi } from 'vitest';
import ExcelJS from 'exceljs';
const mocks = vi.hoisted(() => ({ auth: vi.fn() }));
vi.mock('@/lib/auth', () => ({ requireApiPermission: mocks.auth }));
import { POST } from './route';
describe('prévia de planilha no CRM', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ ok: true, user: { id: 'admin', role: 'ADMIN' } });
  });
  it('recusa acesso antes de ler qualquer contato', async () => {
    mocks.auth.mockResolvedValue({ ok: false, status: 403, error: 'Sem permissão' });
    const response = await POST(new Request('http://localhost/import', { method: 'POST' }));
    expect(response.status).toBe(403);
    expect(mocks.auth).toHaveBeenCalledWith('crm:manage');
  });
  it('lê XLSX de verdade com a primeira aba e prepara mapeamento editável', async () => {
    const book = new ExcelJS.Workbook();
    const sheet = book.addWorksheet('Leads');
    sheet.addRow(['Nome', 'Telefone', 'Bairro']);
    sheet.addRow(['Cliente de teste', '(21) 99999-1234', 'Ipanema']);
    const form = new FormData();
    form.set('file', new File([await book.xlsx.writeBuffer()], 'leads.xlsx'));
    const response = await POST(
      new Request('http://localhost/import', { method: 'POST', body: form }),
    );
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.rows[0]).toEqual(
      expect.objectContaining({
        name: 'Cliente de teste',
        phone: '5521999991234',
        neighborhood: 'Ipanema',
      }),
    );
    expect(data.errors).toEqual([]);
  });
  it('rejeita extensão desconhecida e planilha acima do limite', async () => {
    for (const file of [
      new File(['dados'], 'leads.xls'),
      new File([new Uint8Array(3000001)], 'leads.csv'),
    ]) {
      const form = new FormData();
      form.set('file', file);
      expect(
        (await POST(new Request('http://localhost/import', { method: 'POST', body: form }))).status,
      ).toBe(400);
    }
  });
});
