import { PrismaClient, PublishStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import data from '../data/projects.json';

const prisma = new PrismaClient();

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail) {
    throw new Error('ADMIN_EMAIL não está configurado.');
  }

  if (!adminPassword) {
    throw new Error('ADMIN_PASSWORD não está configurado.');
  }

  if (adminPassword.length < 8) {
    throw new Error(
      'ADMIN_PASSWORD deve ter pelo menos 8 caracteres.',
    );
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: {
      email: adminEmail,
    },
    update: {
      name: 'Administrador ALPHA',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      email: adminEmail,
      name: 'Administrador ALPHA',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  for (const projectData of data) {
    const neighborhood = await prisma.neighborhood.upsert({
      where: {
        slug: slugify(projectData.neighborhood),
      },
      update: {
        name: projectData.neighborhood,
      },
      create: {
        slug: slugify(projectData.neighborhood),
        name: projectData.neighborhood,
      },
    });

    const project = await prisma.project.upsert({
      where: {
        slug: projectData.slug,
      },
      update: {
        name: projectData.name,
        description: projectData.description,
        heroImage: projectData.image,
        statusLabel: projectData.status,
        neighborhoodId: neighborhood.id,
        publishStatus: PublishStatus.PUBLISHED,
      },
      create: {
        slug: projectData.slug,
        name: projectData.name,
        description: projectData.description,
        heroImage: projectData.image,
        statusLabel: projectData.status,
        neighborhoodId: neighborhood.id,
        publishStatus: PublishStatus.PUBLISHED,
      },
    });

    for (const collectionName of projectData.collections) {
      const collection = await prisma.collection.upsert({
        where: {
          slug: slugify(collectionName),
        },
        update: {
          name: collectionName,
        },
        create: {
          slug: slugify(collectionName),
          name: collectionName,
        },
      });

      await prisma.projectCollection.upsert({
        where: {
          projectId_collectionId: {
            projectId: project.id,
            collectionId: collection.id,
          },
        },
        update: {},
        create: {
          projectId: project.id,
          collectionId: collection.id,
        },
      });
    }

    for (const typologyName of projectData.types) {
      const existingTypology = await prisma.typology.findFirst({
        where: {
          projectId: project.id,
          name: typologyName,
        },
      });

      if (!existingTypology) {
        await prisma.typology.create({
          data: {
            name: typologyName,
            projectId: project.id,
          },
        });
      }
    }
  }
}

main()
  .then(() => console.log('Seed concluído.'))
  .catch((error) => {
    console.error('Erro ao executar seed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
