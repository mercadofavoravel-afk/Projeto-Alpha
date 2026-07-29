import type { MetadataRoute } from "next";
import { projects } from "@/lib/projects";
import { buildCanonical } from "@/lib/seo";

const staticRoutes = ["/", "/empreendimentos", "/colecoes", "/buscar", "/descubra"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    ...staticRoutes.map((path) => ({
      url: buildCanonical(path),
      lastModified: now,
      changeFrequency: path === "/" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "/" ? 1 : 0.7,
    })),
    ...projects.map((project) => ({
      url: buildCanonical(`/empreendimentos/${project.slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
