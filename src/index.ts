import { Hono } from "hono";
import { HentaiHaven } from "./providers/hentai-haven";
import { prettyJSON } from "hono/pretty-json";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import Redis from "ioredis";
import { MongoClient, Db, Collection } from "mongodb";
import type { Context } from "hono";
import { getConnInfo } from "hono/bun";
import { z } from 'zod';
import Hanime from "./providers/hanime";
import { OppaiStream } from "./providers/oppai";
import { VideoSchema } from "./schema/hanime";
import { HentaiInfoSchema, HentaiSearchResultSchema, HentaiSourceSchema } from "./schema/hentai-haven";
import { HentaiTV } from "./providers/hentaitv";
import { HentaiCity } from "./providers/hentaicity";
import { HentaiTVSearchResultsSchema, HentaiTVInfoSchema, HentaiTVWatchSchema, HentaiTVPaginatedSchema } from "./schema/hentaitv";
import { HentaiCitySearchResultsSchema, HentaiCityInfoSchema, HentaiCityWatchSchema, HentaiCityPaginatedSchema } from "./schema/hentaicity";

// Redis is optional - API will work without caching if not configured
let redis: Redis | null = null;
if (process.env.REDIS_HOST && process.env.REDIS_PASSWORD) {
  try {
    // Remove https:// prefix if present (Upstash format)
    const host = process.env.REDIS_HOST.replace(/^https?:\/\//, '');
    redis = new Redis({
      host,
      password: process.env.REDIS_PASSWORD,
      tls: host.includes('upstash') ? {} : undefined,
      lazyConnect: true,
      connectTimeout: 5000,
    });
    redis.on('error', (err) => {
      console.warn('Redis error:', err.message);
      redis = null;
    });
  } catch (e) {
    console.warn('Redis connection failed, running without cache');
  }
}

const mongoClient = process.env.MONGODB_URL ? new MongoClient(process.env.MONGODB_URL) : undefined;
let db: Db | undefined;
let apiKeyCollection: Collection | undefined;

const connectToDb = async () => {
  if(mongoClient) {
    await mongoClient.connect();
    db = mongoClient.db();
    apiKeyCollection = db.collection("apiKeys");
  }
};

const app = new Hono();

app.use(cors());
app.use(prettyJSON());
app.use(logger());

app.get("/", (c) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hentai API</title>
  <style>
    :root {
      --bg-color: #000000;
      --sidebar-bg: #000000;
      --text-color: #ededed;
      --secondary-text: #a1a1aa;
      --accent-color: #3b82f6;
      --border-color: #27272a;
      --code-bg: #111;
      --hover-bg: #1e1e1e;
      --active-text: #fff;
      --active-indicator: #3b82f6;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg-color);
      color: var(--text-color);
      display: flex;
      height: 100vh;
      overflow: hidden;
    }
    
    /* Icons */
    .icon { width: 18px; height: 18px; fill: currentColor; opacity: 0.7; }

    /* Sidebar */
    .sidebar {
      width: 280px;
      background-color: var(--sidebar-bg);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      padding: 24px;
      flex-shrink: 0;
      overflow-y: auto;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 24px;
      font-size: 1.2rem;
      font-weight: 700;
    }
    .brand svg { width: 24px; height: 24px; }
    
    .search-box {
      background: #1c1c1c;
      border: 1px solid #333;
      border-radius: 6px;
      padding: 8px 12px;
      color: #888;
      font-size: 0.9rem;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .nav-section { margin-bottom: 24px; }
    .nav-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--secondary-text);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
      margin-left: 8px;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      color: var(--secondary-text);
      text-decoration: none;
      border-radius: 6px;
      transition: all 0.2s;
      font-size: 0.95rem;
      cursor: pointer;
    }
    .nav-item:hover { color: var(--text-color); background: var(--hover-bg); }
    .nav-item.active {
      color: var(--active-text);
      background: rgba(255,255,255,0.08);
      position: relative;
    }
    .nav-item.active::before {
      content: '';
      position: absolute;
      left: 0;
      top: 6px;
      bottom: 6px;
      width: 3px;
      background: var(--active-indicator);
      border-radius: 0 4px 4px 0;
    }

    .bottom-nav { margin-top: auto; }
    .home-btn {
      width: 100%;
      padding: 10px;
      background: #1c1c1c;
      border: 1px solid #333;
      color: #fff;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      text-align: center;
      transition: background 0.2s;
    }
    .home-btn:hover { background: #252525; }

    /* Main Content */
    .main {
      flex: 1;
      padding: 60px 80px;
      overflow-y: auto;
    }
    
    .breadcrumbs {
      color: var(--secondary-text);
      font-size: 0.9rem;
      margin-bottom: 30px;
    }
    .breadcrumbs span { color: var(--text-color); font-weight: 500; }

    h1 { font-size: 2.5rem; font-weight: 700; margin-bottom: 20px; letter-spacing: -0.02em; }
    p { line-height: 1.6; color: var(--secondary-text); margin-bottom: 30px; font-size: 1.1rem; }

    h2 { font-size: 1.5rem; font-weight: 600; margin: 40px 0 20px; display: flex; align-items: center; gap: 10px; }
    
    .code-block {
      background: var(--code-bg);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 20px;
      font-family: 'Semibold Mono', 'SF Mono', 'Consolas', monospace;
      color: #eee;
      margin-bottom: 30px;
      font-size: 0.9rem;
      overflow-x: auto;
    }

    .endpoint-card {
      background: #0a0a0a;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      margin-bottom: 30px;
      overflow: hidden;
    }
    .endpoint-header {
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      cursor: pointer;
      background: rgba(255,255,255,0.02);
    }
    .endpoint-body {
      padding: 20px;
      display: block;
    }
    .endpoint-card.collapsed .endpoint-body {
      display: none;
    }
    .endpoint-header:hover {
      background: rgba(255,255,255,0.04);
    }
    .schema-title {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--secondary-text);
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .schema-block {
      background: #000;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 15px;
      font-family: 'Semibold Mono', 'SF Mono', 'Consolas', monospace;
      font-size: 0.85rem;
      color: #a1a1aa;
      white-space: pre;
      overflow-x: auto;
    }
    .string { color: #a5d6ff; }
    .number { color: #79c0ff; }
    .boolean { color: #ff7b72; }
    .key { color: #d2a8ff; }
    
    .method {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 4px 8px;
      border-radius: 4px;
      min-width: 50px;
      text-align: center;
    }
    .method.get { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    .url { font-family: monospace; color: #e4e4e7; font-size: 0.9rem; }
    .desc-text { margin-left: auto; color: #71717a; font-size: 0.85rem; }
    .expand-icon { transition: transform 0.2s; transform: rotate(180deg); }
    .endpoint-card.collapsed .expand-icon { transform: rotate(0deg); }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #444; }

    .content-section { display: none; }
    .content-section.active { display: block; }

    /* Navigation Buttons */
    .page-nav {
      display: flex;
      justify-content: space-between;
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid var(--border-color);
    }
    .nav-btn {
      display: flex;
      flex-direction: column;
      text-decoration: none;
      background: var(--code-bg);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 16px;
      min-width: 200px;
      transition: all 0.2s;
    }
    .nav-btn:hover {
      border-color: var(--accent-color);
    }
    .nav-btn .label {
      font-size: 0.75rem;
      color: var(--secondary-text);
      margin-bottom: 6px;
    }
    .nav-btn .title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-color);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .nav-btn.prev { margin-right: auto; }
    .nav-btn.next { margin-left: auto; text-align: right; }
    .nav-btn.next .title { justify-content: flex-end; }
  </style>
  <script>
    function showSection(id) {
      document.querySelectorAll('.content-section').forEach(el => el.classList.remove('active'));
      document.getElementById(id).classList.add('active');
      
      document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
      const activeBtn = document.querySelector(\`[data-target="\${id}"]\`);
      if(activeBtn) activeBtn.classList.add('active');
      
      window.scrollTo(0,0);
    }
    
    function toggleEndpoint(el) {
      el.parentElement.classList.toggle('collapsed');
    }
  </script>
</head>
<body>
  <div class="sidebar">
    <div class="brand">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Hentai API
    </div>
    
    <div class="search-box">
      <svg class="icon" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" stroke-width="2" fill="none"/></svg>
      Jump to...
    </div>

    <div class="nav-section">
      <div class="nav-label">Foundations</div>
      <a class="nav-item active" onclick="showSection('intro')" data-target="intro">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #3b82f6;"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
        Introduction
      </a>
    </div>

    <div class="nav-section">
      <div class="nav-label">Endpoints</div>
      <a class="nav-item" onclick="showSection('oppai')" data-target="oppai">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #ff4757;"><path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        Oppai
      </a>
      <a class="nav-item" onclick="showSection('hh')" data-target="hh">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #ffa502;"><path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>
        HentaiHaven
      </a>
      <a class="nav-item" onclick="showSection('hanime')" data-target="hanime">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #5352ed;"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
        Hanime
      </a>
      <a class="nav-item" onclick="showSection('hentaitv')" data-target="hentaitv">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #2ed573;"><path d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
        HentaiTV
      </a>
      <a class="nav-item" onclick="showSection('hentaicity')" data-target="hentaicity">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #1e90ff;"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
        HentaiCity
      </a>
    </div>

    <div class="bottom-nav">
      <button class="home-btn" onclick="showSection('intro')">Home Page</button>
    </div>
  </div>

  <div class="main">
    
    <!-- Introduction Section -->
    <div id="intro" class="content-section active">
      <div class="breadcrumbs">Docs > <span>Introduction</span></div>
      <h1>Introduction</h1>
      <p>Welcome to the <strong>Hentai API</strong> documentation. This API provides a unified interface for accessing anime and hentai content from various sources including Oppai, HentaiHaven, Hanime, and more.</p>

      <h2>🚀 Base URL</h2>
      <div class="code-block">http://localhost:${port}/api</div>

      <h2>📡 Response Format</h2>
      <p>All responses follow a standard JSON structure. Errors are returned with appropriate HTTP status codes.</p>
      <div class="code-block">{
  "results": [ ... ],
  "meta": { ... }
}</div>

      <div class="page-nav">
        <a href="#" onclick="showSection('oppai')" class="nav-btn next">
          <span class="label">NEXT</span>
          <span class="title">Oppai &rarr;</span>
        </a>
      </div>
    </div>

    <!-- Oppai Section -->
    <div id="oppai" class="content-section">
      <div class="breadcrumbs">Endpoints > <span>Oppai</span></div>
      <h1>Oppai</h1>
      <p>Source for high quality streams directly from oppai.stream.</p>

      <div class="endpoint-card">
        <div class="endpoint-header" onclick="toggleEndpoint(this)">
          <span class="method get">GET</span>
          <span class="url">/api/oppai/search/:query</span>
          <span class="desc-text">Search videos</span>
          <svg class="expand-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 9l6 6 6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="endpoint-body">
          <div class="schema-title">Response Schema</div>
          <div class="schema-block">[
  {
    <span class="key">"title"</span>: <span class="string">"Video Title"</span>,
    <span class="key">"cover"</span>: <span class="string">"https://example.com/cover.jpg"</span>,
    <span class="key">"id"</span>: <span class="string">"video-id-123"</span>,
    <span class="key">"type"</span>: <span class="string">"video"</span>
  }
]</div>
        </div>
      </div>
      <div class="endpoint-card">
        <div class="endpoint-header" onclick="toggleEndpoint(this)">
          <span class="method get">GET</span>
          <span class="url">/api/oppai/watch/:id</span>
          <span class="desc-text">Get stream URL & subtitles</span>
          <svg class="expand-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 9l6 6 6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="endpoint-body">
          <div class="schema-title">Response Schema</div>
          <div class="schema-block">{
  <span class="key">"stream"</span>: <span class="string">"https://example.com/stream.m3u8"</span>,
  <span class="key">"subtitles"</span>: [
    {
       <span class="key">"label"</span>: <span class="string">"English"</span>,
       <span class="key">"file"</span>: <span class="string">"https://example.com/eng.vtt"</span>
    }
  ]
}</div>
        </div>
      </div>

      <div class="page-nav">
        <a href="#" onclick="showSection('intro')" class="nav-btn prev">
          <span class="label">PREVIOUS</span>
          <span class="title">&larr; Introduction</span>
        </a>
        <a href="#" onclick="showSection('hh')" class="nav-btn next">
          <span class="label">NEXT</span>
          <span class="title">HentaiHaven &rarr;</span>
        </a>
      </div>
    </div>

    <!-- HentaiHaven Section -->
    <div id="hh" class="content-section">
      <div class="breadcrumbs">Endpoints > <span>HentaiHaven</span></div>
      <h1>HentaiHaven</h1>
      <p>Classic HentaiHaven provider.</p>
      
      <div class="endpoint-card">
        <div class="endpoint-header" onclick="toggleEndpoint(this)">
          <span class="method get">GET</span>
          <span class="url">/api/hh/search/:query</span>
          <span class="desc-text">Search videos</span>
          <svg class="expand-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 9l6 6 6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="endpoint-body">
          <div class="schema-title">Response Schema</div>
          <div class="schema-block">[
  {
    <span class="key">"id"</span>: <span class="string">"video-slug"</span>,
    <span class="key">"title"</span>: <span class="string">"Episode 1"</span>,
    <span class="key">"cover"</span>: <span class="string">"https://..."</span>,
    <span class="key">"released"</span>: <span class="string">"2023-01-01"</span>
  }
]</div>
        </div>
      </div>
      <div class="endpoint-card">
        <div class="endpoint-header" onclick="toggleEndpoint(this)">
          <span class="method get">GET</span>
          <span class="url">/api/hh/:id</span>
          <span class="desc-text">Get info</span>
          <svg class="expand-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 9l6 6 6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="endpoint-body">
          <div class="schema-title">Response Schema</div>
          <div class="schema-block">{
  <span class="key">"id"</span>: <span class="string">"slug"</span>,
  <span class="key">"title"</span>: <span class="string">"Show Title"</span>,
  <span class="key">"description"</span>: <span class="string">"..."</span>,
  <span class="key">"views"</span>: <span class="number">12345</span>,
  <span class="key">"episodes"</span>: [
    { <span class="key">"number"</span>: <span class="number">1</span>, <span class="key">"id"</span>: <span class="string">"ep-1"</span> }
  ]
}</div>
        </div>
      </div>
       <div class="endpoint-card">
        <div class="endpoint-header" onclick="toggleEndpoint(this)">
          <span class="method get">GET</span>
          <span class="url">/api/hh/sources/:id</span>
          <span class="desc-text">Get sources</span>
          <svg class="expand-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 9l6 6 6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="endpoint-body">
          <div class="schema-title">Response Schema</div>
          <div class="schema-block">[
  {
    <span class="key">"src"</span>: <span class="string">"https://..."</span>,
    <span class="key">"type"</span>: <span class="string">"video/mp4"</span>,
    <span class="key">"label"</span>: <span class="string">"1080p"</span>
  }
]</div>
        </div>
      </div>

      <div class="page-nav">
        <a href="#" onclick="showSection('oppai')" class="nav-btn prev">
          <span class="label">PREVIOUS</span>
          <span class="title">&larr; Oppai</span>
        </a>
        <a href="#" onclick="showSection('hanime')" class="nav-btn next">
          <span class="label">NEXT</span>
          <span class="title">Hanime &rarr;</span>
        </a>
      </div>
    </div>

    <!-- Hanime Section -->
    <div id="hanime" class="content-section">
      <div class="breadcrumbs">Endpoints > <span>Hanime</span></div>
      <h1>Hanime</h1>
      
      <div class="endpoint-card">
        <div class="endpoint-header" onclick="toggleEndpoint(this)">
          <span class="method get">GET</span>
          <span class="url">/api/hanime/search/:query</span>
          <span class="desc-text">Search videos</span>
          <svg class="expand-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 9l6 6 6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="endpoint-body">
          <div class="schema-title">Response Schema</div>
          <div class="schema-block">[
  {
    <span class="key">"id"</span>: <span class="number">12321</span>,
    <span class="key">"name"</span>: <span class="string">"Video Name"</span>,
    <span class="key">"slug"</span>: <span class="string">"video-slug-1"</span>,
    <span class="key">"cover_url"</span>: <span class="string">"https://..."</span>,
    <span class="key">"views"</span>: <span class="number">50000</span>
  }
]</div>
        </div>
      </div>
      <div class="endpoint-card">
        <div class="endpoint-header" onclick="toggleEndpoint(this)">
          <span class="method get">GET</span>
          <span class="url">/api/hanime/:id</span>
          <span class="desc-text">Get info</span>
          <svg class="expand-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 9l6 6 6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="endpoint-body">
           <div class="schema-title">Response Schema</div>
           <div class="schema-block">{
  <span class="key">"hentai_video"</span>: {
     <span class="key">"id"</span>: <span class="number">123</span>,
     <span class="key">"name"</span>: <span class="string">"Title"</span>,
     <span class="key">"description"</span>: <span class="string">"..."</span>,
     <span class="key">"poster_url"</span>: <span class="string">"..."</span>
  },
  <span class="key">"videos_manifest"</span>: { ... }
}</div>
        </div>
      </div>
      <div class="endpoint-card">
        <div class="endpoint-header" onclick="toggleEndpoint(this)">
          <span class="method get">GET</span>
          <span class="url">/api/hanime/streams/:id</span>
          <span class="desc-text">Get video streams</span>
          <svg class="expand-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 9l6 6 6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="endpoint-body">
           <div class="schema-title">Response Schema</div>
           <div class="schema-block">[
  {
    <span class="key">"url"</span>: <span class="string">"https://...m3u8"</span>,
    <span class="key">"width"</span>: <span class="number">1920</span>,
    <span class="key">"height"</span>: <span class="number">1080</span>,
    <span class="key">"bitrate"</span>: <span class="number">4000</span>
  }
]</div>
        </div>
      </div>

      <div class="page-nav">
        <a href="#" onclick="showSection('hh')" class="nav-btn prev">
          <span class="label">PREVIOUS</span>
          <span class="title">&larr; HentaiHaven</span>
        </a>
        <a href="#" onclick="showSection('hentaitv')" class="nav-btn next">
          <span class="label">NEXT</span>
          <span class="title">HentaiTV &rarr;</span>
        </a>
      </div>
    </div>

    <!-- HentaiTV Section -->
    <div id="hentaitv" class="content-section">
      <div class="breadcrumbs">Endpoints > <span>HentaiTV</span></div>
      <h1>HentaiTV</h1>
      <div class="endpoint-card">
        <div class="endpoint-header" onclick="toggleEndpoint(this)">
          <span class="method get">GET</span>
          <span class="url">/api/hentaitv/recent</span>
          <span class="desc-text">Get recent</span>
          <svg class="expand-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 9l6 6 6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
         <div class="endpoint-body">
           <div class="schema-title">Response Schema</div>
           <div class="schema-block">[
  {
    <span class="key">"title"</span>: <span class="string">"Video Title"</span>,
    <span class="key">"id"</span>: <span class="string">"video-slug"</span>,
    <span class="key">"cover"</span>: <span class="string">"https://..."</span>
  }
]</div>
        </div>
      </div>
      <div class="endpoint-card">
        <div class="endpoint-header" onclick="toggleEndpoint(this)">
          <span class="method get">GET</span>
          <span class="url">/api/hentaitv/search/:query</span>
          <span class="desc-text">Search</span>
          <svg class="expand-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 9l6 6 6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="endpoint-body">
           <div class="schema-title">Response Schema</div>
           <div class="schema-block">[
  {
    <span class="key">"title"</span>: <span class="string">"SearchResult"</span>,
    <span class="key">"id"</span>: <span class="string">"slug"</span>,
    <span class="key">"cover"</span>: <span class="string">"..."</span>
  }
]</div>
        </div>
      </div>

      <div class="page-nav">
        <a href="#" onclick="showSection('hanime')" class="nav-btn prev">
          <span class="label">PREVIOUS</span>
          <span class="title">&larr; Hanime</span>
        </a>
        <a href="#" onclick="showSection('hentaicity')" class="nav-btn next">
          <span class="label">NEXT</span>
          <span class="title">HentaiCity &rarr;</span>
        </a>
      </div>
    </div>

    <!-- HentaiCity Section -->
    <div id="hentaicity" class="content-section">
      <div class="breadcrumbs">Endpoints > <span>HentaiCity</span></div>
      <h1>HentaiCity</h1>
      <div class="endpoint-card">
        <div class="endpoint-header" onclick="toggleEndpoint(this)">
          <span class="method get">GET</span>
          <span class="url">/api/hentaicity/popular</span>
          <span class="desc-text">Get popular</span>
          <svg class="expand-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 9l6 6 6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="endpoint-body">
           <div class="schema-title">Response Schema</div>
           <div class="schema-block">[
  {
    <span class="key">"title"</span>: <span class="string">"Popular Title"</span>,
    <span class="key">"id"</span>: <span class="string">"slug"</span>,
    <span class="key">"cover"</span>: <span class="string">"..."</span>
  }
]</div>
        </div>
      </div>
      <div class="endpoint-card">
        <div class="endpoint-header" onclick="toggleEndpoint(this)">
          <span class="method get">GET</span>
          <span class="url">/api/hentaicity/watch/:id</span>
          <span class="desc-text">Get stream (m3u8)</span>
          <svg class="expand-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 9l6 6 6-6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="endpoint-body">
           <div class="schema-title">Response Schema</div>
           <div class="schema-block">{
  <span class="key">"stream"</span>: <span class="string">"https://...m3u8"</span>,
  <span class="key">"format"</span>: <span class="string">"hls"</span>
}</div>
        </div>
      </div>

      <div class="page-nav">
        <a href="#" onclick="showSection('hentaitv')" class="nav-btn prev">
          <span class="label">PREVIOUS</span>
          <span class="title">&larr; HentaiTV</span>
        </a>
      </div>
    </div>

  </div>
</body>
</html>`;
  return c.html(html);
});

const rateLimit = async (c: Context, key: string, limit: number, ttl: number): Promise<Response | void> => {
  if (!redis) return; // Skip rate limiting if Redis not available
  try {
    const count = await redis.incr(key);
    if (count > limit) {
      return c.json({ error: "Rate limit exceeded" }, 429);
    }
    await redis.expire(key, ttl);
  } catch (e) {
    // Redis error, skip rate limiting
  }
};

const cache = async <T extends object>(c: Context, key: string, fetcher: () => Promise<T>): Promise<Response> => {
  // If no Redis, just fetch directly
  if (!redis) {
    const data = await fetcher();
    return c.json(data);
  }
  
  try {
    const cached = await redis.get(key);
    if (cached) {
      try {
        const data = JSON.parse(cached) as T;
        if (data === null || data === undefined || Object.keys(data).length === 0 || (Array.isArray(data) && data.length === 0) || (typeof data === 'string' && (data as string).trim() === '')) {
          await redis.del(key);
          const freshData = await fetcher();
          await redis.set(key, JSON.stringify(freshData), 'EX', 3600);
          return c.json(freshData);
        }
        return c.json(data);
      } catch (error) {
        await redis.del(key);
        const freshData = await fetcher();
        await redis.set(key, JSON.stringify(freshData), 'EX', 3600);
        return c.json(freshData);
      }
    }
    const data = await fetcher();
    if (data === null || data === undefined || Object.keys(data).length === 0 || (Array.isArray(data) && data.length === 0) || (typeof data === 'string' && (data as string).trim() === '')) {
      return c.json(data);
    }
    await redis.set(key, JSON.stringify(data), 'EX', 3600);
    return c.json(data);
  } catch (e) {
    // Redis error, fetch directly
    const data = await fetcher();
    return c.json(data);
  }
};

const apiKeyAuth = async (c: Context): Promise<Response | void> => {
  const apiKey = c.req.header("x-api-key")||c.req.query("apiKey");
  if (!apiKey) {
    return undefined;
  }
  const key = await apiKeyCollection?.findOne({ key: apiKey });
  if (!key) {
    return c.json({ error: "Invalid API key" }, 401);
  }
  return undefined;
};

const handleRequest = async <T>(c: Context, provider: any, method: string, schema: z.ZodSchema<any>, ...args: any[]): Promise<Response> => {
  try {
    const apiKeyResult = await apiKeyAuth(c);
    const conninfo = await getConnInfo(c);
    const limit = apiKeyResult ? 1500 : 15;
    const ttl = 60;
    const rateLimitKey = `${provider.name}-${method}-${conninfo.remote.address}-${conninfo.remote.port}`;
    const rateLimited = await rateLimit(c, rateLimitKey, limit, ttl);
    if (rateLimited) return rateLimited;

    const key = `${provider.name}-${method}-${JSON.stringify(args)}`;
    return await cache(c, key, async () => {
      const instance = new provider();
      const result = await instance[method](...args);
      return schema.parse(result);
    });
  } catch (error) {
    console.error("Error handling request:", error);
    if (error instanceof z.ZodError) {
      return c.json({ error: error.issues }, 422);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
};

const querySchema = z.string().min(1);
const idSchema = z.string().min(1);

app.get("/api/hh/search/:query", async (c) => {
  const query = querySchema.parse(c.req.param("query"));
  return await handleRequest(c, HentaiHaven, "fetchSearchResult", HentaiSearchResultSchema, query);
});

app.get("/api/hh/:id", async (c) => {
  const id = idSchema.parse(c.req.param("id"));
  return await handleRequest(c, HentaiHaven, "fetchInfo", HentaiInfoSchema, id);
});

app.get("/api/hh/sources/:id", async (c) => {
  const id = idSchema.parse(c.req.param("id"));
  return await handleRequest(c, HentaiHaven, "fetchSources", HentaiSourceSchema, id);
});


app.get("/api/oppai/search/:query", async (c) => {
    const query = c.req.param("query");
    const page = c.req.query("page") ? parseInt(c.req.query("page")!) : 1;
    try {
        const provider = new OppaiStream();
        const result = await provider.search(query, page);
        return c.json(result);
    } catch (e) {
        return c.json({ error: e instanceof Error ? e.message : "Search failed" }, 500);
    }
});

app.get("/api/oppai/watch/:id", async (c) => {
    const id = c.req.param("id");
    try {
        const provider = new OppaiStream();
        const result = await provider.getStream(id);
        
        const streamsWithHeaders = result.streams.map(s => ({
            ...s,
            // Explicitly provide the headers needed for the user's external proxy
            headers: {
                "Referer": "https://oppai.stream/",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        }));

        return c.json({ ...result, streams: streamsWithHeaders });
    } catch (e) {
        return c.json({ error: e instanceof Error ? e.message : "Fetch failed" }, 500);
    }
});




app.get("/api/hanime/search/:query", async (c) => {
    const query = querySchema.parse(c.req.param("query"));
    return await handleRequest(c, Hanime, "search", z.any(), query);
});

app.get("/api/hanime/:id", async (c) => {
    const id = idSchema.parse(c.req.param("id"));
    return await handleRequest(c, Hanime, "getInfo", VideoSchema, id);
});

app.get("/api/hanime/streams/:id", async (c) => {
    const id = idSchema.parse(c.req.param("id"));
    try {
      const instance = new Hanime();
      const result = await instance.getEpisode(id);
      const iframeSupport = {
        supported: false,
        reason: "Hanime CSP frame-ancestors blocks embedding outside hanime.tv and related domains.",
      };

      if (Array.isArray(result)) {
        return c.json({ streams: result, iframeSupport });
      }

      return c.json({
        ...result,
        iframeSupport,
      });
    } catch (error) {
      console.error("Error handling request:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
});

app.get("/api/hanime/iframe/:id", async (c) => {
    const id = idSchema.parse(c.req.param("id"));
    return c.json({
      id,
      supported: false,
      reason: "Hanime CSP frame-ancestors blocks embedding outside hanime.tv and related domains.",
      alternative: {
        type: "open-video-page",
        url: `https://hanime.tv/videos/hentai/${encodeURIComponent(id)}`,
      },
    }, 409);
});

app.get("/embed/hanime/:id", async (c) => {
    const id = idSchema.parse(c.req.param("id"));
    return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Hanime Embed Unavailable</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #111; color: #eee; padding: 24px; }
    .card { max-width: 780px; margin: 0 auto; background: #1b1b1b; border: 1px solid #333; border-radius: 12px; padding: 20px; }
    a { color: #48dbfb; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Hanime iframe is blocked by upstream CSP</h2>
    <p>Hanime sets <code>frame-ancestors</code> to allow only Hanime-owned domains, so third-party embedding is blocked by the browser.</p>
    <p>Video ID: <strong>${id}</strong></p>
    <p>Open directly: <a href="https://hanime.tv/videos/hentai/${encodeURIComponent(id)}" target="_blank" rel="noreferrer">https://hanime.tv/videos/hentai/${encodeURIComponent(id)}</a></p>
  </div>
</body>
</html>`, 409);
});

// HentaiTV Routes
app.get("/api/hentaitv/recent", async (c) => {
    return await handleRequest(c, HentaiTV, "getRecent", HentaiTVSearchResultsSchema);
});

app.get("/api/hentaitv/trending", async (c) => {
    return await handleRequest(c, HentaiTV, "getTrending", HentaiTVSearchResultsSchema);
});

app.get("/api/hentaitv/random", async (c) => {
    return await handleRequest(c, HentaiTV, "getRandom", HentaiTVSearchResultsSchema);
});

app.get("/api/hentaitv/search/:query", async (c) => {
    const query = querySchema.parse(c.req.param("query"));
    const page = parseInt(c.req.query("page") || "1", 10);
    return await handleRequest(c, HentaiTV, "search", HentaiTVPaginatedSchema, query, page);
});

app.get("/api/hentaitv/genre/:genre", async (c) => {
    const genre = c.req.param("genre");
    const page = parseInt(c.req.query("page") || "1", 10);
    return await handleRequest(c, HentaiTV, "getByGenre", HentaiTVPaginatedSchema, genre, page);
});

app.get("/api/hentaitv/brand/:brand", async (c) => {
    const brand = c.req.param("brand");
    const page = parseInt(c.req.query("page") || "1", 10);
    return await handleRequest(c, HentaiTV, "getByBrand", HentaiTVPaginatedSchema, brand, page);
});

app.get("/api/hentaitv/info/:id", async (c) => {
    const id = idSchema.parse(c.req.param("id"));
    return await handleRequest(c, HentaiTV, "getInfo", HentaiTVInfoSchema, id);
});

app.get("/api/hentaitv/watch/:id", async (c) => {
    const id = idSchema.parse(c.req.param("id"));
    return await handleRequest(c, HentaiTV, "getWatch", HentaiTVWatchSchema, id);
});

// HentaiCity Routes
app.get("/api/hentaicity/recent", async (c) => {
    return await handleRequest(c, HentaiCity, "getRecent", HentaiCitySearchResultsSchema);
});

app.get("/api/hentaicity/popular", async (c) => {
    const page = parseInt(c.req.query("page") || "1", 10);
    return await handleRequest(c, HentaiCity, "getPopular", HentaiCityPaginatedSchema, page);
});

app.get("/api/hentaicity/top", async (c) => {
    const page = parseInt(c.req.query("page") || "1", 10);
    return await handleRequest(c, HentaiCity, "getTop", HentaiCityPaginatedSchema, page);
});

// Note: HentaiCity search requires JavaScript rendering, not available

app.get("/api/hentaicity/info/:id", async (c) => {
    const id = idSchema.parse(c.req.param("id"));
    return await handleRequest(c, HentaiCity, "getInfo", HentaiCityInfoSchema, id);
});

app.get("/api/hentaicity/watch/:id", async (c) => {
    const id = idSchema.parse(c.req.param("id"));
    return await handleRequest(c, HentaiCity, "getWatch", HentaiCityWatchSchema, id);
});

const port = process.env.PORT || 3000;

export default app;

/* 
// For local development or non-serverless environments
if (import.meta.main) {
  const { serve } = await import('bun');
  serve({
    fetch: app.fetch,
    port: port,
  });
  console.log(`Server is running on port ${port}`);
} 
*/
