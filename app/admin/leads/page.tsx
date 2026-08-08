import Link from 'next/link';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

type LeadItem = {
  id: string;
  name: string;
  phone: string;
  objective: string;
  status: string;
  activities: Array<{
    id: string;
  }>;
};

export default async function LeadsPage() {
  const leads = await db.lead.findMany({
    include: {
      activities: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 100,
  });

  return (
    <>
      <div className="eyebrow">CRM</div>
      <h1>Leads</h1>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Telefone</th>
              <th>Objetivo</th>
              <th>Status</th>
              <th>Atividades</th>
            </tr>
          </thead>

          <tbody>
            {leads.map((lead: LeadItem) => (
              <tr key={lead.id}>
                <td>
                  <Link href={`/admin/leads/${lead.id}`}>{lead.name}</Link>
                </td>
                <td>{lead.phone}</td>
                <td>{lead.objective}</td>
                <td>{lead.status}</td>
                <td>{lead.activities.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
