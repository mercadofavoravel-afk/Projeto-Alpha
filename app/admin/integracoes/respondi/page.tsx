import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { defaultRespondiFields, respondiFieldsSchema } from '@/lib/respondi-landing';
import { saveRespondiLanding } from './actions';

export const dynamic = 'force-dynamic';
const labels = {
  name: 'Nome',
  phone: 'Telefone',
  email: 'E-mail',
  message: 'Interesse',
  consent: 'Autorização de contato',
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ result?: string }>;
}) {
  await requireRole(['ADMIN', 'DIRECTOR']);
  const mappings = await db.respondiLandingIntegration.findMany({ orderBy: { name: 'asc' } });
  const { result } = await searchParams;
  const notices: Record<string, string> = {
    saved: 'Associação salva. A entrega ainda precisa ser validada no Respondi e no CRM.',
    invalid:
      'Confira URL, ID e perguntas. Nome e telefone são obrigatórios; cada campo usa uma pergunta diferente.',
    conflict: 'Esse formulário pertence a um artigo. Configure a integração no próprio artigo.',
  };
  return (
    <>
      <h1>Respondi das páginas comerciais</h1>
      <p>
        Associe o ID real do formulário à página e informe os títulos exatos das perguntas. Campos
        opcionais podem ficar vazios. Sem resposta explícita “Sim” na pergunta de autorização, o CRM
        registra uma tarefa para conferir a autorização de contato.
      </p>
      <p>
        Esta associação não configura o webhook no Respondi. Use o endereço privado da integração no
        painel do fornecedor. Nenhuma chave é exibida aqui.
      </p>
      {result && notices[result] && <p role="status">{notices[result]}</p>}
      {[null, ...mappings].map((mapping) => {
        const parsed = mapping ? respondiFieldsSchema.safeParse(mapping.fields) : null;
        const fields = parsed?.success ? parsed.data : defaultRespondiFields;
        return (
          <section className="panel" key={mapping?.id ?? 'new'}>
            <h2>{mapping ? mapping.name : 'Associar formulário'}</h2>
            <form action={saveRespondiLanding} className="form-grid">
              <label>
                ID do formulário Respondi
                <input
                  name="formId"
                  required
                  readOnly={!!mapping}
                  defaultValue={mapping?.formId}
                  maxLength={80}
                />
              </label>
              <label>
                Nome da página ou empreendimento
                <input name="name" required defaultValue={mapping?.name} maxLength={100} />
              </label>
              <label>
                URL pública da página
                <input name="pageUrl" type="url" required defaultValue={mapping?.pageUrl} />
              </label>
              <label>
                Bairro
                <input
                  name="neighborhood"
                  required
                  defaultValue={mapping?.neighborhood}
                  maxLength={80}
                />
              </label>
              {Object.entries(labels).map(([key, label]) => (
                <label key={key}>
                  Pergunta de {label.toLowerCase()}
                  <input
                    name={`field_${key}`}
                    required={key === 'name' || key === 'phone'}
                    defaultValue={fields[key as keyof typeof fields]}
                    maxLength={200}
                  />
                </label>
              ))}
              <label>
                <input
                  type="checkbox"
                  name="enabled"
                  value="true"
                  defaultChecked={mapping?.enabled ?? false}
                />{' '}
                Receber respostas deste formulário
              </label>
              <button className="btn">Salvar associação</button>
            </form>
          </section>
        );
      })}
      <Link href="/admin/integracoes">Voltar ao diagnóstico de integrações</Link>
    </>
  );
}
