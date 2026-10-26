import { requirePermission } from '@/lib/auth';
import IntakePanel from './IntakePanel';

export const dynamic = 'force-dynamic';
export default async function Page() {
  await requirePermission('crm:manage');
  return (
    <>
      <div className="eyebrow">CRM</div>
      <h1>Cadastro, planilhas e repique</h1>
      <p>
        Cadastre contatos ou confira a planilha antes de confirmar. As filas de repique começam
        pausadas.
      </p>
      <IntakePanel />
    </>
  );
}
