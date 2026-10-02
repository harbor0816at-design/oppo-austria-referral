import { z } from "zod";
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128).optional(),
  passwordConfirm: z.string().min(8).max(128).optional(),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(40).optional(),
  country: z.string().trim().length(2).default("AT"),
  language: z.enum(["de", "en", "zh"]).default("de"),
  mode: z.enum(["password", "magic_link"]).default("magic_link"),
  termsAccepted: z.literal(true),
  ownerVerificationReference: z.string().trim().max(120).optional()
}).superRefine((v, ctx) => {
  if (v.mode === "password" && !v.password) ctx.addIssue({ code: "custom", path: ["password"], message: "Password is required." });
  if (v.mode === "password" && !v.passwordConfirm) ctx.addIssue({ code: "custom", path: ["passwordConfirm"], message: "Password confirmation is required." });
  if (v.mode === "password" && v.password && v.passwordConfirm && v.password !== v.passwordConfirm) ctx.addIssue({ code: "custom", path: ["passwordConfirm"], message: "Passwords do not match." });
});
export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8).max(128) });
