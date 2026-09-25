// Negative positions put curated project photos before older, unclassified media.
export const photoPriorityOptions = [
  { value: -50, label: 'Fachada / acesso principal' },
  { value: -40, label: 'Fachada noturna' },
  { value: -30, label: 'Áreas de lazer' },
  { value: -20, label: 'Ambientes internos' },
  { value: -10, label: 'Entorno' },
  { value: 0, label: 'Outras fotos' },
] as const;
