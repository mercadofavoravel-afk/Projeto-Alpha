import { PrismaClient, PublishStatus } from '@prisma/client';
import data from '../data/projects.json';
const prisma = new PrismaClient();
async function main() {
  for (const s of data) {
    const slug = s.neighborhood.toLowerCase().replace(/\s+/g, '-');
    const n = await prisma.neighborhood.upsert({
      where: { slug },
      update: { name: s.neighborhood },
      create: { slug, name: s.neighborhood },
    });
    await prisma.project.upsert({
      where: { slug: s.slug },
      update: {
        name: s.name,
        description: s.description,
        heroImage: s.image,
        statusLabel: s.status,
        neighborhoodId: n.id,
        publishStatus: PublishStatus.REVIEW,
      },
      create: {
        slug: s.slug,
        name: s.name,
        description: s.description,
        heroImage: s.image,
        statusLabel: s.status,
        neighborhoodId: n.id,
        publishStatus: PublishStatus.REVIEW,
      },
    });
  }
}
main()
  .then(() => console.log('Catálogo importado.'))
  .finally(() => prisma.$disconnect());
