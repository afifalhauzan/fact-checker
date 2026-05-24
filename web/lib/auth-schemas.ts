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

// just for mock login form, not used for actual auth yet. Can expand in the future as needed.