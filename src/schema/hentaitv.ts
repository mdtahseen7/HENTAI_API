import { z } from "zod";

export const HentaiTVSearchResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  image: z.string(),
  views: z.number(),
});

export const HentaiTVSearchResultsSchema = z.array(HentaiTVSearchResultSchema);

export const HentaiTVInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  poster: z.string(),
  views: z.string(),
  description: z.string(),
  releaseDate: z.string(),
  uploadDate: z.string(),
  altTitle: z.string(),
  brandName: z.string(),
  type: z.string(),
  genre: z.array(z.string()),
  related: z.array(z.object({
    title: z.string(),
    id: z.string(),
    image: z.string(),
    views: z.string(),
  })),
});

export const HentaiTVSourceSchema = z.object({
  src: z.string(),
  format: z.string(),
  note: z.string().optional(),
});

export const HentaiTVWatchSchema = z.object({
  id: z.string(),
  name: z.string(),
  poster: z.string(),
  sources: z.array(HentaiTVSourceSchema),
});

export const HentaiTVPaginatedSchema = z.object({
  results: HentaiTVSearchResultsSchema,
  totalPages: z.number(),
  currentPage: z.number(),
  hasNextPage: z.boolean(),
});
