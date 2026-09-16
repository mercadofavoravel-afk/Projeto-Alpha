const messageMarker = 'Mensagem sugerida (não enviada automaticamente):';

export function getFollowUpMessage(
  note: string | null | undefined,
  name: string,
  neighborhood: string | null | undefined,
) {
  const suggestedMessage = note?.split(messageMarker)[1]?.trim();

  if (suggestedMessage) {
    return suggestedMessage;
  }

  return `Olá, ${name}. Vimos seu interesse em conteúdo sobre ${neighborhood || 'Rio de Janeiro'}. A equipe da Imóveis de Alto Padrão Rio separou informações alinhadas ao seu perfil. Podemos ajudar?`;
}

export function createWhatsAppHref(phone: string, message: string) {
  const digits = phone.replace(/\D/g, '');
  const destination = digits.startsWith('55') ? digits : `55${digits}`;

  return `https://wa.me/${destination}?text=${encodeURIComponent(message)}`;
}
