// 1. Import utilities from `astro:content`
import { z, defineCollection, reference } from "astro:content";
// 2. Define your collection(s)

const author = defineCollection({
  type: "data",
  schema: z.object({
    _createdAt: z.string(),
    _id: z.string(),
    _rev: z.string(),
    _type: z.literal("author"),
    _updatedAt: z.string(),
    name: z.string(),
  }),
});
const teacher = defineCollection({
  type: "data",
  schema: z.object({
    _createdAt: z.string(),
    _id: z.string(),
    _rev: z.string(),
    _type: z.literal("teacher"),
    _updatedAt: z.string(),
    email: z.string(),
    mobile: z.string(),
    teacher_name: z.string(),
    title: z.string(),
  }),
});
const term = defineCollection({
  type: "data",
  schema: z.object({
    _createdAt: z.string(),
    _id: z.string(),
    _rev: z.string(),
    _type: z.literal("term"),
    _updatedAt: z.string(),
    isActive: z.boolean(),
    name: z.string(),
    term_num: z.number(),
  }),
});
const education = defineCollection({
  type: "data",
  schema: z.object({
    _createdAt: z.string(),
    _id: z.string(),
    _rev: z.string(),
    _type: z.literal("education"),
    _updatedAt: z.string(),
    content: z.string(),
    institution: z.string(),
    year: z.string(),
  }),
});
const papers = defineCollection({
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

const employment = defineCollection({
  type: "data",
  schema: z.object({
    _createdAt: z.string(),
    _id: z.string(),
    _rev: z.string(),
    _type: z.literal("employment"),
    _updatedAt: z.string(),
    address: z.string(),
    endYear: z.string(),
    position: z.string(),
    startYear: z.string(),
  }),
});

const project = defineCollection({
  type: "data",
  schema: z.object({
    _createdAt: z.string(),
    _id: z.string(),
    _rev: z.string(),
    _type: z.literal("project"),
    _updatedAt: z.string(),
    order: z.number(),
    status: z.enum(["proposed", "in-progress", "completed"]),
    title: z.string(),
  }),
});

const course = defineCollection({
  type: "data",
  schema: z.object({
    _createdAt: z.string(),
    _id: z.string(),
    _rev: z.string(),
    _type: z.literal("course"),
    _updatedAt: z.string(),
    code: z.string(),
    name: z.string(),
    section: z.string(),
    ["teacher._ref"]: reference("teacher"),
    ["term._ref"]: reference("term"),
    url: z.string(),
  }),
});
export const collections = {
  papers,
  author,
  teacher,
  term,
  education,
  employment,
  project,
  course,
};
