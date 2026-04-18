import { z } from "zod"

export const apiKeyLoginSchema = z.object({
  apiKey: z.string().min(1, "API Key is required"),
})

export type ApiKeyLoginFormData = z.infer<typeof apiKeyLoginSchema>
