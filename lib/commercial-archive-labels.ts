export const archiveKinds = {
  LINK: 'Links e pastas',
  BOOK: 'Books',
  PLAN: 'Plantas e calungas',
  PRICE_LIST: 'Tabelas',
  TECHNICAL: 'Fichas técnicas',
  INVESTOR: 'Material do investidor',
} as const;

export type ArchiveKind = keyof typeof archiveKinds;

export function archiveOrganizationLabel(item: { organization: string | null }) {
  return item.organization?.trim() || 'Incorporadora a confirmar';
}
