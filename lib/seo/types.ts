export type SeoDocument = {
  name?: string | null;
  description?: string | null;
  heroImage?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  slug?: string | null;
};

export type SeoCheck = {
  id: string;
  label: string;
  points: number;
  passed: boolean;
};

export type SeoScoreResult = {
  score: number;
  maxScore: number;
  percentage: number;
  checks: SeoCheck[];
};

export type SeoRule = {
  id: string;
  label: string;
  points: number;
  validate: (document: SeoDocument) => boolean;
};

export type MetadataOptions = {
  title: string;
  description: string;
  path?: string;
  image?: string | null;
  imageAlt?: string;
  keywords?: string[];
  noIndex?: boolean;
  type?: 'website' | 'article';
};
