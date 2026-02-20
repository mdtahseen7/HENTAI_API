import { z } from "zod";

export const HentaiCitySearchResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  thumbnail: z.string(),
  trailer: z.string().optional(),
  duration: z.string(),
  views: z.number(),
});

export const HentaiCitySearchResultsSchema = z.array(HentaiCitySearchResultSchema);

export const HentaiCityPaginationSchema = z.object({
  current: z.number(),
  next: z.number().nullable(),
  last: z.number(),
  pages: z.array(z.number()),
});

export const HentaiCityInfoSchema = z.object({
  id: z.string(),
  title: z.string(),
  thumbnail: z.string(),
  uploadDate: z.string(),
  author: z.string(),
  description: z.string(),
  altTitle: z.string(),
  related: z.array(z.object({
    title: z.string(),
    id: z.string(),
  })),
  recommendations: z.array(z.object({
    id: z.string(),
    title: z.string(),
    thumbnail: z.string(),
    trailer: z.string().optional(),
    duration: z.string(),
    views: z.string(),
  })),
  tags: z.array(z.string()),
});

export const HentaiCitySourceSchema = z.object({
  src: z.string(),
  format: z.string(),
  vttThumbnail: z.string().optional(),
});

export const HentaiCityWatchSchema = z.object({
  id: z.string(),
  title: z.string(),
  thumbnail: z.string(),
  source: z.array(HentaiCitySourceSchema),
});

export const HentaiCityPaginatedSchema = z.object({
  results: HentaiCitySearchResultsSchema,
  pagination: HentaiCityPaginationSchema,
});
