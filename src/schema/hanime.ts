import { z } from "zod";

const BrandSchema = z.object({
  name: z.string(),
  id: z.union([z.number(), z.string()]),
});

const EpisodeSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  views: z.number().nullable().optional().default(0),
  interests: z.number().nullable().optional().default(0),
  thumbnailUrl: z.string().optional().default(''),
  coverUrl: z.string().optional().default(''),
  isHardSubtitled: z.boolean().optional().default(false),
  brand: BrandSchema.optional(),
  durationMs: z.number().nullable().optional().default(0),
  isCensored: z.boolean().optional().default(false),
  likes: z.number().nullable().optional().default(0),
  rating: z.number().nullable().optional().default(0),
  dislikes: z.number().nullable().optional().default(0),
  downloads: z.number().nullable().optional().default(0),
  rankMonthly: z.number().nullable().optional().default(0),
  brandId: z.string().optional().default(''),
  isBannedIn: z.string().optional().default(''),
  previewUrl: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  createdAt: z.number().optional().default(0),
  releasedAt: z.number().optional().default(0),
});

const VideoSchema = z.object({
  title: z.string().optional().default(''),
  slug: z.string().optional().default(''),
  id: z.number().optional(),
  description: z.string().optional().default(''),
  views: z.number().optional().default(0),
  interests: z.number().optional().default(0),
  posterUrl: z.string().optional().default(''),
  coverUrl: z.string().optional().default(''),
  brand: BrandSchema.optional(),
  durationMs: z.number().optional().default(0),
  isCensored: z.boolean().optional().default(false),
  likes: z.number().optional().default(0),
  rating: z.number().optional().default(0),
  dislikes: z.number().optional().default(0),
  downloads: z.number().optional().default(0),
  rankMonthly: z.number().optional().default(0),
  tags: z.array(z.any()).optional().default([]),
  createdAt: z.union([z.string(), z.number()]).optional(),
  releasedAt: z.union([z.string(), z.number()]).optional(),
  episodes: z.object({
    next: EpisodeSchema.nullable().optional(),
    all: z.array(EpisodeSchema).optional().default([]),
    random: EpisodeSchema.nullable().optional(),
  }).optional(),
}).passthrough();

const SearchResultSchema = z.object({
  id: z.number().optional(),
  name: z.string().optional().default(''),
  titles: z.array(z.string()).optional().default([]),
  slug: z.string().optional().default(''),
  description: z.string().optional().default(''),
  views: z.number().optional().default(0),
  interests: z.number().optional().default(0),
  bannerImage: z.string().optional().default(''),
  coverImage: z.string().optional().default(''),
  brand: BrandSchema.optional(),
  durationMs: z.number().optional().default(0),
  isCensored: z.boolean().optional().default(false),
  likes: z.number().optional().default(0),
  rating: z.number().optional().default(0),
  dislikes: z.number().optional().default(0),
  downloads: z.number().optional().default(0),
  rankMonthly: z.number().optional().default(0),
  tags: z.array(z.any()).optional().default([]),
  createdAt: z.number().optional().default(0),
  releasedAt: z.number().optional().default(0),
}).passthrough();

export { BrandSchema, EpisodeSchema, VideoSchema, SearchResultSchema };
