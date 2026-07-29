export const siteConfig = {
  name: "Imóveis de Alto Padrão Rio",
  shortName: "Projeto ALPHA",
  description:
    "Curadoria de imóveis de alto padrão no Rio de Janeiro, com empreendimentos selecionados, busca inteligente e atendimento especializado.",
  locale: "pt_BR",
  language: "pt-BR",
  defaultImage: "/images/vie-01.jpg",
  twitterHandle: process.env.NEXT_PUBLIC_TWITTER_HANDLE?.trim() || undefined,
} as const;
