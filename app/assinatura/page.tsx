import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/auth';
import { subscriptionState } from '@/lib/commercial-subscription';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Acesso e assinatura', robots: { index: false, follow: false } };

export default async function SubscriptionPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.isPlatformOwner) redirect('/admin');
  const subscription = await db.commercialSubscription.findUnique({
    where: { userId: user.id },
    include: { payments: { where: { status: 'PENDING' }, orderBy: { dueAt: 'desc' }, take: 1 } },
  });
  const access = subscriptionState(user.billingMode, subscription);
  if (access.status !== 'BLOCKED') redirect('/admin');
  const pending = subscription?.payments[0];
  const boleto =
    pending?.boletoUrl && /^https:\/\//i.test(pending.boletoUrl) ? pending.boletoUrl : null;
  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="eyebrow">Projeto Alpha · acesso individual</div>
        <h1>Assinatura suspensa</h1>
        <p>O prazo de pagamento, incluindo cinco dias de tolerância, terminou para esta conta.</p>
        <p>Conta: {user.email}</p>
        {access.dueAt && (
          <p>
            Vencimento:{' '}
            {new Intl.DateTimeFormat('pt-BR', {
              dateStyle: 'short',
              timeZone: 'America/Sao_Paulo',
            }).format(access.dueAt)}
          </p>
        )}
        {boleto ? (
          <a className="btn" href={boleto} target="_blank" rel="noopener noreferrer">
            Abrir boleto pendente
          </a>
        ) : (
          <p>
            A cobrança ainda não está disponível aqui. Entre em contato com a administração para
            regularizar o acesso.
          </p>
        )}
        <Link href="/login">Voltar ao acesso</Link>
      </section>
    </main>
  );
}
