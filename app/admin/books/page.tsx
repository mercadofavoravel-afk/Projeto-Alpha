import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type BookItem = {
  id: string;
  fileName: string;
  status: string;
  progress: number;
  project: {
    name: string;
  } | null;
};

export default async function BooksPage() {
  const books = await db.bookIngestion.findMany({
    include: {
      project: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <>
      <div className="eyebrow">Ingestão documental</div>
      <h1>Books</h1>

      <div className="notice">
        A V11 registra e acompanha o workflow. O envio ao armazenamento e a
        extração automática dependem da infraestrutura escolhida.
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Arquivo</th>
              <th>Empreendimento</th>
              <th>Status</th>
              <th>Progresso</th>
            </tr>
          </thead>

          <tbody>
            {books.map((book: BookItem) => (
              <tr key={book.id}>
                <td>{book.fileName}</td>
                <td>{book.project?.name ?? "Não associado"}</td>
                <td>{book.status}</td>
                <td>{book.progress}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
