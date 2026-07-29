import { db } from "@/lib/db";
import { calculateSeoScore } from "@/lib/seo";
export const dynamic = "force-dynamic";

export default async function SeoMissionControlPage() {
  const [projects, neighborhoods, articles] = await Promise.all([
    db.project.findMany({ select: { id:true, name:true, slug:true, description:true, heroImage:true, seoTitle:true, seoDescription:true, publishStatus:true } }),
    db.neighborhood.findMany(),
    db.article.findMany({ select: { id:true, title:true, slug:true, excerpt:true, heroImage:true, seoTitle:true, seoDescription:true, publishStatus:true } }),
  ]);
  const projectScores = projects.map(item => ({ id:item.id, name:item.name, kind:"Empreendimento", status:item.publishStatus, ...calculateSeoScore(item) }));
  const neighborhoodScores = neighborhoods.map(item => ({ id:item.id, name:item.name, kind:"Bairro", status:"ENTIDADE", ...calculateSeoScore(item) }));
  const articleScores = articles.map(item => ({ id:item.id, name:item.title, kind:"Artigo", status:item.publishStatus, ...calculateSeoScore({ ...item, name:item.title, description:item.excerpt }) }));
  const all = [...projectScores, ...neighborhoodScores, ...articleScores];
  const average = all.length ? Math.round(all.reduce((sum,item)=>sum+item.score,0)/all.length) : 0;
  const critical = all.filter(item=>item.score<60).sort((a,b)=>a.score-b.score);
  return <>
    <div className="eyebrow">SEO Mission Control</div><h1>Saúde orgânica</h1>
    <div className="kpis"><div className="kpi"><b>{average}</b>Score médio</div><div className="kpi"><b>{all.length}</b>Entidades auditadas</div><div className="kpi"><b>{critical.length}</b>Abaixo de 60</div><div className="kpi"><b>{all.filter(x=>x.score>=80).length}</b>Prontas para publicar</div></div>
    <div className="panel"><h2>Prioridades de otimização</h2>{critical.length === 0 ? <p>Nenhuma pendência crítica.</p> : <div className="table-wrap"><table><thead><tr><th>Entidade</th><th>Tipo</th><th>Status</th><th>Score</th><th>Próxima correção</th></tr></thead><tbody>{critical.map(item => <tr key={`${item.kind}-${item.id}`}><td><b>{item.name}</b></td><td>{item.kind}</td><td>{item.status}</td><td>{item.score}/{item.maxScore} ({item.percentage}%)</td><td>{item.checks.find(check=>!check.passed)?.label ?? "Revisão editorial"}</td></tr>)}</tbody></table></div>}</div>
  </>;
}
