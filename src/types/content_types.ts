import { z } from "astro:content";

export const papersSchema = z.object({
  key: z.string(),
  authors: z.array(z.string()),
  title: z.string(),
  journal: z.string().optional(),
  volume: z.union([z.number(), z.string()]).optional(),
  number: z.union([z.number(), z.string()]).optional(),
  pages: z.union([z.string(), z.number()]).optional(),
  year: z.number().optional(),
  article_id: z.string().optional(),
  published: z.boolean().optional(),
  accepted: z.boolean().optional(),
  doi: z.string().optional(),
});

export const employmentSchema = z.object({
  _createdAt: z.string(),
  _id: z.string(),
  _rev: z.string(),
  _type: z.literal("employment"),
  _updatedAt: z.string(),
  address: z.string(),
  endYear: z.string(),
  position: z.string(),
  startYear: z.string(),
});

export type Paper = z.infer<typeof papersSchema>;
export type Employment = z.infer<typeof employmentSchema>;
