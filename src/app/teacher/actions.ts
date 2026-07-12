"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { TEACHER_COOKIE, requireTeacher } from "@/lib/auth";

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (password !== env.TEACHER_PASSWORD) {
    return { ok: false as const, error: "Wrong password" };
  }
  const store = await cookies();
  store.set(TEACHER_COOKIE, password, { httpOnly: true, sameSite: "lax", path: "/" });
  redirect("/teacher");
}

export async function logout() {
  const store = await cookies();
  store.delete(TEACHER_COOKIE);
  redirect("/teacher");
}

export async function createAssignment(formData: FormData) {
  await requireTeacher();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const language = String(formData.get("language") ?? "").trim();
  const criteria = String(formData.get("criteria") ?? "")
    .split("\n").map((s) => s.trim()).filter(Boolean);
  const tests = String(formData.get("tests") ?? "")
    .split("\n---\n")
    .map((block) => {
      const [stdin = "", expectedStdout = ""] = block.split("\n=>\n");
      return { stdin: stdin.trim(), expectedStdout: expectedStdout.trim() };
    })
    .filter((t) => t.expectedStdout.length > 0);

  if (!title || !description || !language) {
    return { ok: false as const, error: "Title, description, language required" };
  }
  await prisma.assignment.create({ data: { title, description, language, criteria, tests } });
  revalidatePath("/teacher");
  return { ok: true as const };
}
