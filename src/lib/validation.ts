import { z } from "zod";

const MAX_URL_LENGTH = 2048;

export const urlSchema = z
  .string()
  .trim()
  .min(4, { message: "Enter a URL" })
  .max(MAX_URL_LENGTH, { message: "URL is too long" })
  .transform((value) => (/^https?:\/\//i.test(value) ? value : `https://${value}`))
  .refine((value) => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
      return false;
    }
  }, { message: "Enter a valid http(s) URL" });

export const scanRequestSchema = z.object({
  url: urlSchema,
  savedWebsiteId: z.string().uuid().nullable().optional(),
});

export const phishingRequestSchema = z.object({
  url: urlSchema,
});

export const savedWebsiteSchema = z.object({
  name: z.string().trim().min(1, { message: "Name is required" }).max(80),
  url: urlSchema,
  monitoringEnabled: z.boolean().default(false),
});

export const profileSchema = z.object({
  fullName: z.string().trim().max(80).nullable(),
  avatarUrl: z.string().trim().url().max(500).nullable().or(z.literal("")),
});

export const credentialsSchema = z.object({
  email: z.string().trim().email({ message: "Enter a valid email" }).max(255),
  password: z.string().min(8, { message: "Use at least 8 characters" }).max(128),
});

export const registerSchema = credentialsSchema.extend({
  fullName: z.string().trim().min(1, { message: "Enter your name" }).max(80),
});

export const emailSchema = z.object({
  email: z.string().trim().email({ message: "Enter a valid email" }).max(255),
});

export const newPasswordSchema = z.object({
  password: z.string().min(8, { message: "Use at least 8 characters" }).max(128),
});

export function toDomain(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

/** Strip control characters from free-form text before persisting or rendering. */
export function sanitizeText(value: string, maxLength = 4000): string {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, maxLength);
}
