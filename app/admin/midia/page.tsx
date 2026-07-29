import Link from "next/link";
import { db } from "@/lib/db";
export const dynamic = "force-dynamic";
export default async function MediaPage(){
 const media=await db.media.findMany({include:{project:{select:{name:true}}},orderBy:[{projectId:"asc"},{position:"asc"}]});
 return <div className="admin"><aside className="side"><div className="brand">ALPHA ADMIN<small>BIBLIOTECA</small></div><Link href="/admin">Visão geral</Link><Link href="/admin/midia">Mídia</Link><Link href="/admin/books">Books</Link></aside><main className="main"><div className="eyebrow">Digital Asset Management</div><h1>Biblioteca de mídia</h1><div className="notice">Nesta versão, os arquivos são cadastrados por URL. Upload direto exige S3/R2 e URLs pré-assinadas.</div><div className="media-grid">{media.map(item=><article className="media-item" key={item.id}>{item.kind==="IMAGE"?<img src={item.url} alt={item.alt??""}/>:<div className="media-placeholder">{item.kind}</div>}<b>{item.project.name}</b><small>{item.caption||item.alt||item.url}</small></article>)}</div></main></div>;
}
