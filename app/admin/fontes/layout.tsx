import { requirePermission } from '@/lib/auth';

export default async function CatalogAdminSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission('catalog:write');

  return children;
}
