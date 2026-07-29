"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { createSlug } from "@/lib/slug";

export async function createNeighborhoodAction(formData: FormData) {
  await requirePermission("catalog:write");
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) redirect("/admin/bairros?erro=nome");
  await db.neighborhood.create({
    data: {
      name,
      slug: createSlug(name),
      description: optional(formData, "description"),
      heroImage: optional(formData, "heroImage"),
      seoTitle: optional(formData, "seoTitle"),
      seoDescription: optional(formData, "seoDescription"),
    },
  });
  revalidatePath("/admin/bairros");
  redirect("/admin/bairros?criado=1");
}

function optional(data: FormData, key: string) {
  const value = String(data.get(key) ?? "").trim();
  return value || null;
}
