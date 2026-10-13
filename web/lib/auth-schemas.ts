import { z } from "zod"

export const apiKeyLoginSchema = z.object({
  apiKey: z.string().min(1, "API Key is required"),
})

export type ApiKeyLoginFormData = z.infer<typeof apiKeyLoginSchema>

export const emailPasswordLoginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
})

export type EmailPasswordLoginFormData = z.infer<typeof emailPasswordLoginSchema>

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Nama minimal 2 karakter").max(255),
    email: z.string().email("Email tidak valid"),
    password: z.string().min(8, "Password minimal 8 karakter"),
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Password tidak sama",
    path: ["passwordConfirmation"],
  })

export type RegisterFormData = z.infer<typeof registerSchema>
