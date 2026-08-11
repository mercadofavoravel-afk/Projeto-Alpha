import Image from 'next/image';
import Link from 'next/link';
import type { Project } from '@/lib/projects';

export function Card({ p }: { p: Project }) {
  return (
    <article className="card">
      <Image
        src={p.image}
        alt={p.name}
        width={900}
        height={560}
        sizes="(max-width: 620px) 100vw, (max-width: 900px) 50vw, 33vw"
      />

      <div className="copy">
        <div className="eyebrow">{p.neighborhood}</div>
        <h3>{p.name}</h3>
        <p>{p.description}</p>

        <div className="tags">
          {p.highlights.slice(0, 3).map((t) => (
            <span className="tag" key={t}>
              {t}
            </span>
          ))}
        </div>

        <Link className="btn" href={`/empreendimentos/${p.slug}`}>
          Conhecer
        </Link>
      </div>
    </article>
  );
}
