import { Hono } from "hono";
import { HentaiHaven } from "./providers/hentai-haven";
import { prettyJSON } from "hono/pretty-json";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { z } from 'zod';
import Hanime from "./providers/hanime";
import { OppaiStream } from "./providers/oppai";
import { HentaiTV } from "./providers/hentaitv";
import { HentaiCity } from "./providers/hentaicity";

const app = new Hono();

app.use(cors());
app.use(prettyJSON());
app.use(logger());

const idSchema = z.string().min(1).max(200);

async function handleRequest(
  c: any,
  ProviderClass: new () => any,
  method: string,
  ...args: any[]
): Promise<Response> {
  try {
    const provider = new ProviderClass();
    const result = await provider[method](...args);
    return c.json(JSON.parse(JSON.stringify(result)));
  } catch (error: any) {
    return c.json({ error: error.message || 'Internal server error' }, 500);
  }
}

app.get("/", (c) => {
  return c.json({
    name: "Hentai API",
    version: "1.0.0",
    runtime: "Cloudflare Workers",
    endpoints: {
      oppai: ["/api/oppai/search/:query", "/api/oppai/watch/:id"],
      hh: ["/api/hh/search/:query", "/api/hh/info/:id", "/api/hh/watch/:id"],
      hanime: ["/api/hanime/search/:query", "/api/hanime/streams/:slug"],
      hentaitv: ["/api/hentaitv/search/:query", "/api/hentaitv/info/:id", "/api/hentaitv/watch/:id", "/api/hentaitv/recent", "/api/hentaitv/top"],
      hentaicity: ["/api/hentaicity/recent", "/api/hentaicity/top", "/api/hentaicity/info/:id", "/api/hentaicity/watch/:id"]
    }
  });
});

app.get("/api/oppai/search/:query", async (c) => {
  const query = idSchema.parse(c.req.param("query"));
  return await handleRequest(c, OppaiStream, "search", query);
});

app.get("/api/oppai/watch/:id", async (c) => {
  const id = idSchema.parse(c.req.param("id"));
  try {
    const provider = new OppaiStream();
    const result = await provider.getStream(id);
    
    const streamsWithHeaders = result.streams.map((s: any) => ({
      ...s,
      headers: {
        "Referer": "https://oppai.stream/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    }));

    return c.json({ ...result, streams: streamsWithHeaders });
  } catch (error: any) {
    return c.json({ error: error.message || 'Fetch failed' }, 500);
  }
});

app.get("/api/hh/search/:query", async (c) => {
  const query = idSchema.parse(c.req.param("query"));
  return await handleRequest(c, HentaiHaven, "fetchSearchResult", query);
});

app.get("/api/hh/info/:id", async (c) => {
  const id = idSchema.parse(c.req.param("id"));
  return await handleRequest(c, HentaiHaven, "fetchInfo", id);
});

app.get("/api/hh/watch/:id", async (c) => {
  const id = idSchema.parse(c.req.param("id"));
  return await handleRequest(c, HentaiHaven, "fetchSource", id);
});

app.get("/api/hanime/search/:query", async (c) => {
  const query = idSchema.parse(c.req.param("query"));
  return await handleRequest(c, Hanime, "search", query);
});

app.get("/api/hanime/streams/:slug", async (c) => {
  const slug = idSchema.parse(c.req.param("slug"));
  return await handleRequest(c, Hanime, "getVideoBySlug", slug);
});

app.get("/api/hentaitv/search/:query", async (c) => {
  const query = idSchema.parse(c.req.param("query"));
  return await handleRequest(c, HentaiTV, "search", query);
});

app.get("/api/hentaitv/info/:id", async (c) => {
  const id = idSchema.parse(c.req.param("id"));
  return await handleRequest(c, HentaiTV, "getInfo", id);
});

app.get("/api/hentaitv/watch/:id", async (c) => {
  const id = idSchema.parse(c.req.param("id"));
  return await handleRequest(c, HentaiTV, "getWatch", id);
});

app.get("/api/hentaitv/recent", async (c) => {
  const page = parseInt(c.req.query("page") || "1", 10);
  return await handleRequest(c, HentaiTV, "getRecent", page);
});

app.get("/api/hentaitv/top", async (c) => {
  const page = parseInt(c.req.query("page") || "1", 10);
  return await handleRequest(c, HentaiTV, "getTop", page);
});

app.get("/api/hentaicity/recent", async (c) => {
  const page = parseInt(c.req.query("page") || "1", 10);
  return await handleRequest(c, HentaiCity, "getRecent", page);
});

app.get("/api/hentaicity/top", async (c) => {
  const page = parseInt(c.req.query("page") || "1", 10);
  return await handleRequest(c, HentaiCity, "getTop", page);
});

app.get("/api/hentaicity/info/:id", async (c) => {
  const id = idSchema.parse(c.req.param("id"));
  return await handleRequest(c, HentaiCity, "getInfo", id);
});

app.get("/api/hentaicity/watch/:id", async (c) => {
  const id = idSchema.parse(c.req.param("id"));
  return await handleRequest(c, HentaiCity, "getWatch", id);
});

export default app;
