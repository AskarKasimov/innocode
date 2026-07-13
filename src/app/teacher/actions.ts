"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { TEACHER_COOKIE, requireTeacher } from "@/lib/auth";
import { parseCriteria, parseTests } from "@/lib/assignment/parse";

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
  const criteria = parseCriteria(String(formData.get("criteria") ?? ""));
  const tests = parseTests(String(formData.get("tests") ?? ""));

  if (!title || !description || !language) {
    return { ok: false as const, error: "Title, description, language required" };
  }
  await prisma.assignment.create({
    data: {
      title,
      description,
      language,
      criteria: criteria as Prisma.InputJsonValue,
      tests: tests as unknown as Prisma.InputJsonValue,
    },
  });
  revalidatePath("/teacher");
  return { ok: true as const };
}
