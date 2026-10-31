import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  // Comma-separated origins, e.g. "https://sojibrd.github.io,http://localhost:3000"
  ALLOWED_ORIGIN: z.string().min(1),
  // Pooled URL for app_user (host ends in -pooler)
  DATABASE_URL: z.string().startsWith("postgres"),
  GOOGLE_CLIENT_ID: z.string().endsWith(".apps.googleusercontent.com"),
  // Sign-in tokens are only as strong as this key
  JWT_SECRET: z.string().min(32),
  // Empty until the owner signs in once and copies their id from GET /me
  OWNER_GOOGLE_SUB: z
    .string()
    .optional()
    .transform((value) => value || undefined),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    // Name the broken variables only; never print their values
    const names = parsed.error.issues.map((issue) => issue.path.map(String).join(".")).join(", ");
    throw new Error(`Invalid environment variables: ${names}`);
  }
  return parsed.data;
}
