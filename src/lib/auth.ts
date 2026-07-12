import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";

export const TEACHER_COOKIE = "teacher_auth";

export async function isTeacher(): Promise<boolean> {
  const store = await cookies();
  return store.get(TEACHER_COOKIE)?.value === env.TEACHER_PASSWORD;
}

export async function requireTeacher(): Promise<void> {
  if (!(await isTeacher())) redirect("/teacher");
}
