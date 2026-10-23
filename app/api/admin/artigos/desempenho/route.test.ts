import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  articles: vi.fn(),
  query: vi.fn(),
  snapshot: vi.fn(),
}));
vi.mock('@/lib/auth', () => ({ requireApiPermission: mocks.auth }));
vi.mock('@/lib/db', () => ({
  db: {
    article: { findMany: mocks.articles },
    $queryRaw: mocks.query,
    auditLog: { findFirst: mocks.snapshot },
  },
}));
import { GET } from './route';
beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ ok: true, user: { role: 'ADMIN' } });
  mocks.articles.mockResolvedValue([]);
  mocks.query.mockResolvedValue([]);
  mocks.snapshot.mockResolvedValue(null);
});
describe('API privada de resultados dos artigos', () => {
  it('denies unauthenticated requests before reading counts', async () => {
    mocks.auth.mockResolvedValue({ ok: false, error: 'Não autenticado', status: 401 });
    expect((await GET()).status).toBe(401);
    expect(mocks.query).not.toHaveBeenCalled();
  });
  it('denies broker and editorial roles even if general authorization is incorrectly granted', async () => {
    for (const role of ['CONSULTANT', 'EDITOR', 'MARKETING', 'MANAGER']) {
      mocks.auth.mockResolvedValue({ ok: true, user: { role } });
      expect((await GET()).status).toBe(403);
    }
    expect(mocks.query).not.toHaveBeenCalled();
  });
  it('returns aggregate numbers without public caching', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(await response.json()).toMatchObject({ rows: [], search: null });
  });
});
