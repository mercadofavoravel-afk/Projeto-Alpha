export function typologyFromMessage(message: string | null | undefined) {
  return message?.match(/^Tipologia desejada: ([^\n]+)/)?.[1] || null;
}
