import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { selectableMarketingAccounts } from '@/lib/marketing-accounts';
import { oauthConfig, personalGoogleWebhookKey } from '@/lib/marketing-oauth';
import { alphaPath } from '@/lib/public-path';
import { isCommercialCustomer } from '@/lib/commercial-subscription';
import { changeOwnPassword, disconnectMarketingAccount, selectMarketingAccount } from './actions';
import { InstallAlphaApp } from './InstallAlphaApp';

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string; integracao?: string }>;
}) {
  const user = await requireUser();
  const commercial = isCommercialCustomer(user);
  const { result, integracao } = await searchParams;
  const connections = await db.marketingConnection.findMany({
    where: { userId: user.id },
  });
  const sites = commercial
    ? await db.customerSite.findMany({
        where: { ownerId: user.id },
        select: { id: true, siteUrl: true },
        orderBy: { createdAt: 'desc' },
      })
    : [];
  const accountOptions = new Map(
    await Promise.all(
      connections.map(async (connection) => {
        try {
          const accounts = await selectableMarketingAccounts(connection);
          return [
            connection.provider,
            accounts?.map(({ id, name }) => ({ id, name })) || [],
          ] as const;
        } catch {
          return [connection.provider, [] as { id: string; name: string }[]] as const;
        }
      }),
    ),
  );
  const notices: Record<string, string> = {
    conectado:
      'Conta autorizada. A entrega automática de leads exige a ativação da conta de anúncios e dos formulários.',
    desconectado: 'Conexão removida deste usuário no Alpha.',
    configuracao:
      'O aplicativo comercial ainda não está configurado no servidor. O administrador precisa registrar as credenciais oficiais do aplicativo.',
    cancelado: 'A autorização foi cancelada ou recusada na plataforma.',
    expirado: 'O prazo da autorização terminou. Inicie a conexão novamente.',
    falha: 'Não foi possível confirmar a autorização. Tente conectar novamente.',
    sessao: 'Entre novamente no Alpha e retome a conexão.',
    invalido: 'Plataforma inválida.',
    'conta-inacessivel':
      'A conta não está disponível para esse perfil. Atualize a autorização e tente novamente.',
    'conta-em-uso': 'Esta conta ou Página já está vinculada a outro usuário do Alpha.',
    'conta-selecionada':
      'Conta selecionada. Confira a configuração do formulário e o primeiro recebimento real antes de considerar a captação ativa.',
    assinatura:
      'A Meta não aceitou a assinatura de leads da Página. Confira permissões e o aplicativo de webhooks.',
    'site-invalido': 'Selecione um site conectado à sua conta para receber estes leads.',
  };
  return (
    <>
      <h1>Senha e segurança</h1>
      <p>
        {user.name || user.email} · {user.email}
      </p>
      <p>
        Troque a senha quando quiser. Se não lembrar da senha atual, peça um link no seu e-mail.
      </p>
      <form action={changeOwnPassword} className="admin-card form-grid">
        <h2>Trocar senha</h2>
        <label>
          Senha atual
          <input type="password" name="currentPassword" autoComplete="current-password" required />
        </label>
        <label>
          Nova senha
          <input
            type="password"
            name="newPassword"
            minLength={12}
            maxLength={128}
            autoComplete="new-password"
            required
          />
        </label>
        <label>
          Confirmar nova senha
          <input
            type="password"
            name="confirmPassword"
            minLength={12}
            maxLength={128}
            autoComplete="new-password"
            required
          />
        </label>
        <p>Após a troca, entre novamente com a nova senha.</p>
        {result === 'invalid' && (
          <p role="alert">
            A nova senha precisa ter de 12 a 128 caracteres e a confirmação deve ser igual.
          </p>
        )}
        {result === 'current' && <p role="alert">A senha atual está incorreta.</p>}
        <button type="submit" className="btn">
          Salvar nova senha
        </button>
      </form>
      <section className="admin-card">
        <h2>Esqueceu a senha atual?</h2>
        <p>Receba por e-mail um link de uso único para definir outra senha.</p>
        <Link className="btn" href="/recuperar-senha">
          Recuperar senha por e-mail
        </Link>
      </section>
      <InstallAlphaApp />
      <section className="admin-card" id="contas-conectadas">
        <h2>Minhas contas de anúncios</h2>
        <p>
          Conexões opcionais e individuais. Entre com seu e-mail e senha apenas na página oficial do
          Google ou da Meta que será aberta após clicar em conectar. O Alpha guarda somente a
          autorização criptografada; sua senha nunca passa pelo Alpha.
        </p>
        {commercial && (
          <p>
            Selecione o site destinatário antes de ativar os formulários de anúncios. Os contatos
            recebidos ficam no CRM deste site.
          </p>
        )}
        {integracao && notices[integracao] && <p role="status">{notices[integracao]}</p>}
        <div className="form-grid">
          {(
            [
              ['google_ads', 'Google Ads'],
              ['meta', 'Meta Ads e Instagram'],
            ] as const
          ).map(([provider, label]) => {
            const account = connections.find((connection) => connection.provider === provider);
            const ready = Boolean(oauthConfig(provider));
            const expired = account?.expiresAt && account.expiresAt <= new Date();
            return (
              <div className="panel" key={provider}>
                <h3>{label}</h3>
                <p>
                  {account
                    ? `${account.displayName || account.email || 'Conta autorizada'}${account.email && account.displayName ? ` · ${account.email}` : ''}`
                    : 'Nenhuma conta conectada a este usuário.'}
                </p>
                <p>
                  {account
                    ? expired
                      ? 'A autorização venceu; reconecte para voltar a acessar a conta.'
                      : 'Autorização registrada. Recebimento de leads ainda precisa ser ativado e validado.'
                    : ready
                      ? 'Pronta para iniciar a autorização.'
                      : 'Aguardando configuração do aplicativo comercial pelo administrador.'}
                </p>
                {account?.selectedAccountId && (
                  <p>
                    Recurso selecionado: {account.selectedAccountName || account.selectedAccountId}{' '}
                    ({account.selectedAccountId}).
                  </p>
                )}
                {commercial && account?.leadSiteId && (
                  <p>
                    Site destinatário:{' '}
                    {sites.find((site) => site.id === account.leadSiteId)?.siteUrl ||
                      'Conexão indisponível'}
                    .
                  </p>
                )}
                {ready && (
                  <Link className="btn" href={`/api/admin/integrations/${provider}/start`}>
                    {account ? 'Reconectar conta' : `Conectar ${label}`}
                  </Link>
                )}
                {account &&
                  (!commercial || sites.length > 0) &&
                  (accountOptions.get(provider)?.length || 0) > 0 && (
                    <form action={selectMarketingAccount}>
                      <input type="hidden" name="provider" value={provider} />
                      <label>
                        {provider === 'google_ads'
                          ? 'Conta de anúncios acessível'
                          : 'Página que recebe os formulários'}
                        <select
                          name="accountId"
                          defaultValue={account.selectedAccountId || ''}
                          required
                        >
                          <option value="" disabled>
                            Selecione uma conta
                          </option>
                          {accountOptions.get(provider)?.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      {commercial && (
                        <label>
                          Site que receberá os leads
                          <select
                            name="leadSiteId"
                            defaultValue={account.leadSiteId || ''}
                            required
                          >
                            <option value="" disabled>
                              Selecione seu site
                            </option>
                            {sites.map((site) => (
                              <option key={site.id} value={site.id}>
                                {site.siteUrl}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                      <button type="submit">Usar esta conta no Alpha</button>
                    </form>
                  )}
                {provider === 'google_ads' &&
                  account?.selectedAccountId &&
                  (!commercial || account.leadSiteId) && (
                    <div>
                      <p>
                        Para formulários nativos do Google Ads, configure no formulário desta conta:
                      </p>
                      <label>
                        URL do webhook
                        <input
                          readOnly
                          value={`${new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').origin}${alphaPath('/api/integrations/google-ads/leads')}`}
                        />
                      </label>
                      <label>
                        Chave do webhook desta conexão
                        <input readOnly value={personalGoogleWebhookKey(account.id)} />
                      </label>
                      <p>
                        Esta chave é confidencial. Ela identifica a conta selecionada e encaminha
                        seus leads ao usuário conectado.
                      </p>
                    </div>
                  )}
                {account && (
                  <form action={disconnectMarketingAccount}>
                    <input type="hidden" name="provider" value={provider} />
                    <button type="submit">Desconectar minha conta</button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
        <p>
          Autorizar o perfil é o primeiro passo. Selecione a conta de anúncios ou Página, ative o
          formulário correspondente e verifique a entrega com um lead real autorizado. A conexão de
          outro usuário não altera a sua.
        </p>
      </section>
    </>
  );
}
