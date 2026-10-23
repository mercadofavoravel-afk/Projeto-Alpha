import { requireRole } from '@/lib/auth';
import { ArticlePerformancePanel } from './ArticlePerformancePanel';
export const dynamic = 'force-dynamic';
export default async function Page() {
  await requireRole(['ADMIN', 'DIRECTOR']);
  return (
    <>
      <div className="eyebrow">Matriz · desempenho editorial</div>
      <h1>Resultados dos artigos</h1>
      <ArticlePerformancePanel />
    </>
  );
}
