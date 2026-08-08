import { db } from '@/lib/db';
import { calculateSeoScore } from '@/lib/seo/score';
import { createNeighborhoodAction } from './actions';

export const dynamic = 'force-dynamic';

type NeighborhoodItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  heroImage: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  _count: {
    projects: number;
  };
};

export default async function NeighborhoodsPage() {
  const neighborhoods = await db.neighborhood.findMany({
    include: {
      _count: {
        select: {
          projects: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  });

  return (
    <>
      <div className="eyebrow">Catálogo territorial</div>
      <h1>Bairros</h1>

      <p>
        Cadastre a entidade territorial uma vez e reutilize-a em empreendimentos, páginas locais e
        conteúdo SEO.
      </p>

      <form action={createNeighborhoodAction} className="panel form-grid">
        <label>
          Nome
          <input name="name" required minLength={2} />
        </label>

        <label>
          Imagem principal (URL)
          <input name="heroImage" type="url" />
        </label>

        <label className="full">
          Descrição
          <textarea name="description" rows={4} />
        </label>

        <label>
          Título SEO
          <input name="seoTitle" maxLength={70} />
        </label>

        <label>
          Descrição SEO
          <textarea name="seoDescription" maxLength={180} rows={3} />
        </label>

        <button className="primary" type="submit">
          Cadastrar bairro
        </button>
      </form>

      <div className="panel">
        <h2>Bairros cadastrados</h2>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Bairro</th>
                <th>Empreendimentos</th>
                <th>SEO Score</th>
              </tr>
            </thead>

            <tbody>
              {neighborhoods.map((item: NeighborhoodItem) => (
                <tr key={item.id}>
                  <td>
                    <b>{item.name}</b>
                    <small>/{item.slug}</small>
                  </td>
                  <td>{item._count.projects}</td>
                  <td>{calculateSeoScore(item).score}/100</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
