// 1. Import utilities from `astro:content`
import { z, defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
import {
  papersSchema,
  employmentSchema,
  educationSchema,
  projectSchema,
} from "@mytypes/content_types";
// 2. Define your collection(s)

const author = defineCollection({
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/author" }),
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
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/teacher" }),
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
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/term" }),
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
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/education" }),
  schema: educationSchema,
});
const papers = defineCollection({
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/papers" }),
  schema: papersSchema,
});

const employment = defineCollection({
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/employment" }),
  schema: employmentSchema,
});

const project = defineCollection({
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/project" }),
  schema: projectSchema,
});

const course = defineCollection({
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/course" }),
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
