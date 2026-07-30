import {db} from "@/lib/db";export const dynamic="force-dynamic";export default async function Page(){const [projects,leads,books]=await Promise.all([db.project.count(),db.lead.count(),db.bookIngestion.count()]);return <><div className="eyebrow">Painel operacional</div><h1>Visão geral</h1><div className="kpis"><div className="kpi"><b>{projects}</b>Empreendimentos</div><div className="kpi"><b>{leads}</b>Leads</div><div className="kpi"><b>{books}</b>Books</div><div className="kpi"><b>Protegido</b>Sessão</div></div></>}
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function formatDate(date: Date | null) {
  if (!date) return "Não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatMoney(value: unknown) {
  if (value === null || value === undefined) {
    return "Não informado";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return "Não informado";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(number);
}

export default async function LeadDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const lead = await db.lead.findUnique({
    where: { id },
    include: {
      activities: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!lead) {
    notFound();
  }

  return (
    <>
      <div className="eyebrow">CRM</div>

      <p>
        <Link href="/admin/leads">← Voltar para leads</Link>
      </p>

      <h1>{lead.name}</h1>

      <div className="notice">
        Lead cadastrado em {formatDate(lead.createdAt)}
      </div>

      <div className="editor-grid">
        <label>
          Nome
          <input value={lead.name} readOnly />
        </label>

        <label>
          Telefone
          <input value={lead.phone} readOnly />
        </label>

        <label>
          E-mail
          <input value={lead.email ?? ""} readOnly />
        </label>

        <label>
          Status
          <input value={lead.status} readOnly />
        </label>

        <label>
          Objetivo
          <input value={lead.objective} readOnly />
        </label>

        <label>
          Bairro de interesse
          <input value={lead.neighborhood ?? ""} readOnly />
        </label>

        <label>
          Orçamento mínimo
          <input value={formatMoney(lead.budgetMin)} readOnly />
        </label>

        <label>
          Orçamento máximo
          <input value={formatMoney(lead.budgetMax)} readOnly />
        </label>

        <label>
          Origem
          <input value={lead.source ?? ""} readOnly />
        </label>

        <label>
          Campanha
          <input value={lead.utmCampaign ?? ""} readOnly />
        </label>

        <label>
          UTM Source
          <input value={lead.utmSource ?? ""} readOnly />
        </label>

        <label>
          UTM Medium
          <input value={lead.utmMedium ?? ""} readOnly />
        </label>

        <label className="editor-wide">
          Mensagem
          <textarea
            rows={6}
            value={lead.message ?? ""}
            readOnly
          />
        </label>
      </div>

      <h2>Histórico de atividades</h2>

      {lead.activities.length === 0 ? (
        <div className="notice">
          Nenhuma atividade registrada para este lead.
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Tipo</th>
              <th>Observação</th>
              <th>Vencimento</th>
              <th>Concluída</th>
            </tr>
          </thead>

          <tbody>
            {lead.activities.map((activity) => (
              <tr key={activity.id}>
                <td>{formatDate(activity.createdAt)}</td>
                <td>{activity.type}</td>
                <td>{activity.note ?? "—"}</td>
                <td>{formatDate(activity.dueAt)}</td>
                <td>
                  {activity.completedAt
                    ? formatDate(activity.completedAt)
                    : "Pendente"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
