type FollowUpLead = {
  id: string;
  name: string;
  neighborhood?: string | null;
  source?: string | null;
};

const followUpDays = [3, 5] as const;
export const firstContactNotePrefix = 'Primeiro atendimento pendente:';

function addDays(date: Date, days: number) {
  const dueAt = new Date(date);
  dueAt.setDate(dueAt.getDate() + days);
  return dueAt;
}

function originSummary(lead: FollowUpLead) {
  return lead.source || `Formulário do site | região: ${lead.neighborhood || 'Rio de Janeiro'}`;
}

function followUpMessage(lead: FollowUpLead, region: string, days: number) {
  if (days === 3) {
    return `Olá, ${lead.name}. A partir do seu interesse em ${region}, preparei uma curadoria objetiva sobre localização, perfil de imóveis e faixas que podem combinar com a sua busca. Posso enviar?`;
  }

  return `Olá, ${lead.name}. Para avançar na sua pesquisa em ${region}, posso preparar uma seleção breve de 2 ou 3 opções alinhadas ao conteúdo que você consultou. Assim você compara alternativas com mais clareza.`;
}

export function createOrganicFollowUpActivities(lead: FollowUpLead, createdAt = new Date()) {
  const origin = originSummary(lead);
  const region = lead.neighborhood || 'Rio de Janeiro';

  return [
    {
      leadId: lead.id,
      type: 'TASK',
      dueAt: createdAt,
      note: `${firstContactNotePrefix} confirmar interesse e registrar o resultado. Origem: ${origin}.`,
    },
    ...followUpDays.map((days) => ({
      leadId: lead.id,
      type: 'WHATSAPP',
      dueAt: addDays(createdAt, days),
      note: [
        `Follow-up programado: ${days}º dia.`,
        `Origem: ${origin}.`,
        'Mensagem sugerida (não enviada automaticamente):',
        followUpMessage(lead, region, days),
      ].join('\n'),
    })),
  ];
}
