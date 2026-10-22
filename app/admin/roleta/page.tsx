import { requireRole } from '@/lib/auth';
import { RoulettePanel } from './RoulettePanel';

export default async function RoulettePage() {
  await requireRole(['ADMIN', 'DIRECTOR', 'MANAGER', 'CONSULTANT']);
  return (
    <>
      <header className="page-header">
        <div>
          <div className="eyebrow">CRM · Plantões</div>
          <h1>Roleta de leads</h1>
          <p>Entre no plantão, acompanhe sua posição e receba leads pela ordem sorteada.</p>
        </div>
      </header>
      <RoulettePanel />
    </>
  );
}
