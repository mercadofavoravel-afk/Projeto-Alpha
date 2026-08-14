import { PrismaClient, PublishStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import data from '../data/projects.json';

const prisma = new PrismaClient();

const slugify = (v: string) =>
  v
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

async function main() {
  const email = process.env.ADMIN_EMAIL ?? 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD ?? 'change-me';

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: {
      name: 'Administrador ALPHA',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      email,
      name: 'Administrador ALPHA',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  for (const s of data) {
    const n = await prisma.neighborhood.upsert({
      where: { slug: slugify(s.neighborhood) },
      update: { name: s.neighborhood },
      create: {
        slug: slugify(s.neighborhood),
        name: s.neighborhood,
      },
    });

    const p = await prisma.project.upsert({
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

    for (const cName of s.collections) {
      const c = await prisma.collection.upsert({
        where: { slug: slugify(cName) },
        update: { name: cName },
        create: {
          slug: slugify(cName),
          name: cName,
        },
      });

      await prisma.projectCollection.upsert({
        where: {
          projectId_collectionId: {
            projectId: p.id,
            collectionId: c.id,
          },
        },
        update: {},
        create: {
          projectId: p.id,
          collectionId: c.id,
        },
      });
    }

    for (const t of s.types) {
      const exists = await prisma.typology.findFirst({
        where: {
          projectId: p.id,
          name: t,
        },
      });

      if (!exists) {
        await prisma.typology.create({
          data: {
            name: t,
            projectId: p.id,
          },
        });
      }
    }
  }
}

main()
  .then(() => console.log('Seed concluído.'))
  .finally(() => prisma.$disconnect());
