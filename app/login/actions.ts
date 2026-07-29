"use server";
import { redirect } from "next/navigation";
import { login, logout } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const result = await login(email, password);
  if (!result.ok) redirect(`/login?error=${result.reason}`);
  redirect("/admin");
}

export async function logoutAction() {
  await logout();
  redirect("/login");
}
