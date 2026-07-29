"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { createSlug } from "@/lib/slug";

export async function createDeveloperAction(formData: FormData) {
  await requirePermission("catalog:write");
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) redirect("/admin/incorporadoras?erro=nome");
  const description = String(formData.get("description") ?? "").trim() || null;
  const website = String(formData.get("website") ?? "").trim() || null;
  await db.developer.create({ data: { name, slug: createSlug(name), description, website } });
  revalidatePath("/admin/incorporadoras");
  redirect("/admin/incorporadoras?criado=1");
}
