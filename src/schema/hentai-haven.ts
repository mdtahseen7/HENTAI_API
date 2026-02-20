import { z } from "zod";

const GenreSchema = z.object({
  id: z.string(),
  url: z.string(),
  name: z.string(),
});

const HentaiEpisodeSchema = z.object({
  id: z.string(),
  title: z.string(),
  thumbnail: z.string().nullable(),
  number: z.number(),
  releasedUTC: z.any(), // DateTime object from luxon
  releasedRelative: z.string(),
});

const HentaiInfoSchema = z.object({
  id: z.string(),
  title: z.string(),
  cover: z.string(),
  summary: z.string(),
  views: z.number().optional().default(0),
  ratingCount: z.number().optional().default(0),
  released: z.number().nullable().optional(),
  genres: z.array(GenreSchema).optional().default([]),
  totalEpisodes: z.number().optional().default(0),
  episodes: z.array(HentaiEpisodeSchema).optional().default([]),
});

const HentaiSourceSchema = z.any(); // Very flexible - provider returns various formats

const HentaiSearchResultSchema = z.array(z.object({
    id: z.string(),
    title: z.string(),
    cover: z.string(),
    rating: z.any().optional(), // can be number or NaN
    released: z.any().optional(), // can be number, null, or NaN
    genres: z.array(GenreSchema).optional().default([]),
    totalEpisodes: z.number().optional().default(0),
    date: z.object({
      unparsed: z.string().optional().default(''),
      parsed: z.any(), // DateTime object from luxon
    }).optional(),
    alternative: z.string().optional().default(''),
    author: z.string().optional().default(''),
  }));

export { GenreSchema, HentaiEpisodeSchema, HentaiInfoSchema, HentaiSourceSchema, HentaiSearchResultSchema };