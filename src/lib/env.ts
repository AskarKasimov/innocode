function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  PISTON_URL: required("PISTON_URL"),
  OPENAI_BASE_URL: required("OPENAI_BASE_URL"),
  OPENAI_API_KEY: required("OPENAI_API_KEY"),
  OPENAI_MODEL: required("OPENAI_MODEL"),
  TEACHER_PASSWORD: required("TEACHER_PASSWORD"),
};
