import { PublicAnalytics } from '@/components/PublicAnalytics';

export default function ArticlesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicAnalytics />
      {children}
    </>
  );
}
