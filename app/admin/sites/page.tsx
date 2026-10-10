import Link from 'next/link';
import { requirePermission } from '@/lib/auth';
import { db } from '@/lib/db';
import { connectWordPressSite, disconnectWordPressSite } from './actions';

export const dynamic = 'force-dynamic';

export default async function SitesPage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string }>;
}) {
  const user = await requirePermission('sites:manage');
  const sites = await db.customerSite.findMany({
    where: { ownerId: user.id },
    select: { id: true, siteUrl: true, wpUsername: true, wpDisplayName: true, verifiedAt: true },
    orderBy: { createdAt: 'desc' },
  });
  const { result } = await searchParams;
  const notices: Record<string, string> = {
    connected: 'Site conectado e acesso editorial verificado.',
    disconnected: 'Conexão removida da sua conta.',
    'has-articles':
      'Este site possui artigos, leads ou uma conta de anúncios vinculada. A desconexão foi interrompida para preservar o histórico.',
    invalid: 'Confira o endereço HTTPS, o usuário e a senha de aplicativo do WordPress.',
    'in-use': 'Este site já pertence a outra conta do Alpha.',
    'matrix-site':
      'O domínio Imóveis de Alto Padrão Rio é operado pela matriz. Seus artigos e leads seguem no painel central.',
    limit: 'Limite de dez sites por conta atingido.',
    verification:
      'O WordPress não confirmou as credenciais ou a permissão de editar posts. Confira a API REST e tente novamente.',
    configuration: 'A criptografia das conexões ainda não foi configurada no servidor.',
  };
  return (
    <>
      <h1>Meus sites</h1>
      <p>
        Cadastre cada WordPress sob sua conta individual. A senha de aplicativo é exclusiva desta
        conexão e pode ser revogada no WordPress. Não informe aqui sua senha principal de acesso.
      </p>
      {result && <p role="status">{notices[result] || 'Não foi possível concluir.'}</p>}
      <form action={connectWordPressSite} className="admin-card form-grid">
        <h2>Conectar WordPress</h2>
        <label>
          Endereço HTTPS do site
          <input type="url" name="siteUrl" placeholder="https://meusite.com.br" required />
        </label>
        <label>
          Usuário WordPress
          <input name="username" autoComplete="username" required />
        </label>
        <label>
          Senha de aplicativo WordPress
          <input type="password" name="appPassword" autoComplete="off" required />
        </label>
        <p>
          A verificação exige permissão de editar posts. A conexão não publica conteúdo
          automaticamente.
        </p>
        <button className="btn" type="submit">
          Verificar e conectar
        </button>
      </form>
      <section className="admin-card">
        <h2>Sites conectados ({sites.length})</h2>
        {sites.length === 0 && <p>Nenhum site conectado.</p>}
        {sites.map((site) => (
          <div className="panel" key={site.id}>
            <h3>{site.siteUrl}</h3>
            <p>
              WordPress: {site.wpDisplayName} ({site.wpUsername}). Acesso editorial verificado em{' '}
              {new Intl.DateTimeFormat('pt-BR', {
                dateStyle: 'short',
                timeZone: 'America/Sao_Paulo',
              }).format(site.verifiedAt)}
              .
            </p>
            <p>
              <Link href={`/admin/sites/${site.id}/artigos`}>Abrir blog deste site</Link>
            </p>
            <p>
              <Link href={`/admin/sites/${site.id}/leads`}>Leads e atendimento deste site</Link>
            </p>
            <form action={disconnectWordPressSite}>
              <input type="hidden" name="siteId" value={site.id} />
              <button type="submit">Desconectar</button>
            </form>
          </div>
        ))}
      </section>
    </>
  );
}
