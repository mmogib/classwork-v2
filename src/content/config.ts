// 1. Import utilities from `astro:content`
import { z, defineCollection } from "astro:content";
// 2. Define your collection(s)
const paperCollection = defineCollection({
  type: "data", // v2.5.0 and later
  schema: z.object({
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
  }),
});
// 3. Export a single `collections` object to register your collection(s)
//    This key should match your collection directory name in "src/content"
export const collections = {
  papers: paperCollection,
};
