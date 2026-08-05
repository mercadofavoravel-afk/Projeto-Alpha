import { db } from "@/lib/db";
import { createDeveloperAction } from "./actions";

export const dynamic = "force-dynamic";

type DeveloperItem = {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  _count: {
    projects: number;
  };
};

export default async function DevelopersPage() {
  const developers = await db.developer.findMany({
    include: {
      _count: {
        select: {
          projects: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <>
      <div className="eyebrow">Catálogo institucional</div>
      <h1>Incorporadoras</h1>

      <form action={createDeveloperAction} className="panel form-grid">
        <label>
          Nome
          <input name="name" required minLength={2} />
        </label>

        <label>
          Website
          <input name="website" type="url" />
        </label>

        <label className="full">
          Descrição
          <textarea name="description" rows={4} />
        </label>

        <button className="primary" type="submit">
          Cadastrar incorporadora
        </button>
      </form>

      <div className="panel">
        <h2>Incorporadoras cadastradas</h2>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Website</th>
                <th>Empreendimentos</th>
              </tr>
            </thead>

            <tbody>
              {developers.map((item: DeveloperItem) => (
                <tr key={item.id}>
                  <td>
                    <b>{item.name}</b>
                    <small>/{item.slug}</small>
                  </td>

                  <td>
                    {item.website ? (
                      <a
                        href={item.website}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Abrir site
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td>{item._count.projects}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
