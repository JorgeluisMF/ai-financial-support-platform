import { z } from 'zod'

/** Backend AddUrlRequest */
export const knowledgeUrlFormSchema = z.object({
  title: z.string().min(3).max(255),
  url: z.string().min(8).max(2000).url('Invalid URL'),
})

export type KnowledgeUrlFormValues = z.infer<typeof knowledgeUrlFormSchema>

/** Backend AddTextRequest */
export const knowledgeTextFormSchema = z.object({
  title: z.string().min(3).max(255),
  content: z.string().min(20).max(500_000),
})

export type KnowledgeTextFormValues = z.infer<typeof knowledgeTextFormSchema>
