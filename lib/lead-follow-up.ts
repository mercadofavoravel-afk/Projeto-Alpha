type FollowUpLead = {
  id: string;
  name: string;
  neighborhood?: string | null;
  source?: string | null;
};

const followUpDays = [3, 5] as const;

function addDays(date: Date, days: number) {
  const dueAt = new Date(date);
  dueAt.setDate(dueAt.getDate() + days);
  return dueAt;
}

function originSummary(lead: FollowUpLead) {
  return lead.source || `Formulário do site | região: ${lead.neighborhood || 'Rio de Janeiro'}`;
}

export function createOrganicFollowUpActivities(lead: FollowUpLead, createdAt = new Date()) {
  const origin = originSummary(lead);
  const region = lead.neighborhood || 'Rio de Janeiro';

  return followUpDays.map((days) => ({
    leadId: lead.id,
    type: 'WHATSAPP',
    dueAt: addDays(createdAt, days),
    note: [
      `Follow-up programado: ${days}º dia.`,
      `Origem: ${origin}.`,
      'Mensagem sugerida (não enviada automaticamente):',
      `Olá, ${lead.name}. Vimos seu interesse em conteúdo sobre ${region}. A equipe da Imóveis de Alto Padrão Rio separou informações alinhadas ao seu perfil. Podemos ajudar?`,
    ].join('\n'),
  }));
}
