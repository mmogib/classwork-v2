// 1. Import utilities from `astro:content`
import { z, defineCollection, reference } from "astro:content";
import { papersSchema, employmentSchema } from "@mytypes/content_types";
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
    _id: z.string(),
    _rev: z.string(),
    _type: z.literal("term"),
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
  schema: papersSchema,
});

const employment = defineCollection({
  type: "data",
  schema: employmentSchema,
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
    _id: z.string(),
    _rev: z.string(),
    _type: z.literal("course"),
    code: z.string(),
    name: z.string(),
    section: z.string(),
    ["teacher._ref"]: reference("teacher"),
    ["term._ref"]: reference("term"),
    url: z.string(),
    url2: z.string().optional(),
    airbase: z.string().optional(),
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
