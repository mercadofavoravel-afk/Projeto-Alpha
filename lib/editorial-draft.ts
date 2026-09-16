import { SITE_CONFIG } from './site-config';

export const EDITORIAL_DRAFT_MARKER = '[RASCUNHO EDITORIAL — REVISÃO OBRIGATÓRIA]';

export function createEditorialDraft(title: string) {
  return `${EDITORIAL_DRAFT_MARKER}

Tema: ${title}

Introdução
Apresente a dúvida ou o objetivo de quem pesquisa este tema. Produza um texto original, claro e útil, sem reproduzir o material de fontes externas.

O que avaliar
Explique os critérios relevantes para a decisão. Use apenas dados verificáveis e dê contexto para a realidade do Rio de Janeiro quando isso for pertinente.

Análise prática
Desenvolva a resposta com exemplos próprios, vantagens, limites e próximos passos para o leitor. Fontes externas podem apoiar a pesquisa, mas não devem ser copiadas nem receber links públicos.

Perguntas frequentes
1. Qual é o principal ponto a considerar?
2. Como comparar as opções disponíveis?
3. Quando vale conversar com um especialista?

Próximo passo
Convide o leitor a falar com a ${SITE_CONFIG.name}. Todo CTA público deve apontar apenas para os canais da empresa: ${SITE_CONFIG.url}, ${SITE_CONFIG.whatsappUrl} ou ${SITE_CONFIG.email}.

Antes de publicar
Revise o texto, remova este aviso de rascunho, confirme os dados e mantenha o status em revisão até a aprovação editorial.`;
}

export function isEditorialDraft(content: string) {
  return content.includes(EDITORIAL_DRAFT_MARKER);
}
