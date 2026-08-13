import Image from 'next/image';
import Link from 'next/link';
import type { Project } from '@/lib/projects';

export function Card({ p }: { p: Project }) {
  return (
    <article className="card luxury-card">
      <Link
        className="luxury-card-media"
        href={`/empreendimentos/${p.slug}`}
        aria-label={`Conhecer ${p.name}`}
      >
        <Image
          src={p.image}
          alt={`${p.name}, ${p.neighborhood}`}
          width={900}
          height={620}
          sizes="(max-width: 620px) 100vw, (max-width: 900px) 50vw, 33vw"
        />

        <div className="luxury-card-location">
          {p.neighborhood}
        </div>
      </Link>

      <div className="copy luxury-card-copy">
        <div className="luxury-card-topline">
          <span>{p.status}</span>
        </div>

        <h3>{p.name}</h3>

        <p>{p.description}</p>

        {p.highlights.length > 0 && (
          <div className="luxury-card-features">
            {p.highlights.slice(0, 3).map((highlight) => (
              <span key={highlight}>{highlight}</span>
            ))}
          </div>
        )}

        <Link
          className="luxury-card-link"
          href={`/empreendimentos/${p.slug}`}
        >
          Conhecer empreendimento
        </Link>
      </div>
    </article>
  );
}
