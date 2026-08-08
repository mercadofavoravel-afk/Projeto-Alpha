import Image from 'next/image';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

type MediaItem = {
  id: string;
  kind: string;
  url: string;
  alt: string | null;
  caption: string | null;
  project: {
    name: string;
  };
};

export default async function MediaPage() {
  const media = await db.media.findMany({
    include: {
      project: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [
      {
        projectId: 'asc',
      },
      {
        position: 'asc',
      },
    ],
  });

  return (
    <>
      <div className="eyebrow">Digital Asset Management</div>
      <h1>Biblioteca de mídia</h1>

      <div className="notice">
        Nesta versão, os arquivos são cadastrados por URL. O upload direto será integrado ao
        armazenamento definitivo do Projeto Alpha.
      </div>

      <div className="media-grid">
        {media.map((item: MediaItem) => (
          <article className="media-item" key={item.id}>
            {item.kind === 'IMAGE' ? (
              <Image
                src={item.url}
                alt={item.alt ?? ''}
                width={640}
                height={420}
                sizes="(max-width: 768px) 100vw, 33vw"
                style={{
                  width: '100%',
                  height: 'auto',
                }}
              />
            ) : (
              <div className="media-placeholder">{item.kind}</div>
            )}

            <b>{item.project.name}</b>
            <small>{item.caption || item.alt || item.url}</small>
          </article>
        ))}
      </div>
    </>
  );
}
