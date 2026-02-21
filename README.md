---
title: Hentai API
emoji: 🎬
colorFrom: purple
colorTo: pink
sdk: docker
pinned: false
app_port: 7860
tags:
  - not-for-all-audiences
---

# Hentai API

A centralized API service for aggregating and streaming adult anime content from multiple sources. Built with Bun and Hono.

## Features

- **Unified Interface**: Access content from multiple providers through a single API endpoint structure.
- **Provider Support**:
  - Hanime
  - HentaiHaven
  - HentaiCity
  - HentaiTV
  - Oppai
- **Stream Extraction**: Direct video stream URL resolution for supported platforms.
- **High Performance**: Built on the Bun runtime for fast execution.
- **Search Capabilities**: Integrated search across supported providers.
- **Documentation**: Self-hosted HTML documentation interface available at the root path.

## Prerequisites

- [Bun](https://bun.sh) (v1.0 or later)
- Redis (Optional, for caching)
- MongoDB (Optional, for metrics/logging)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/mdtahseen7/hentai_api.git
   cd hentai_api
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Configure environment variables (optional):
   Create a `.env` file in the root directory:
   ```env
   PORT=3000
   REDIS_HOST=your_redis_host
   REDIS_PASSWORD=your_redis_password
   MONGODB_URL=your_mongodb_connection_string
   ```

## Development

Start the development server with hot reloading:

```bash
bun run dev
```

The server will start on `http://localhost:3000` (or your configured PORT).

## Production

To run the application in production mode:

```bash
bun run src/index.ts
```

## API Documentation

When the server is running, navigate to `http://localhost:3000/` to view the interactive documentation. The interface allows you to explore endpoints, view response schemas, and test API calls directly.

### Main Endpoints

- `GET /` - Interactive Documentation
- `GET /api/[provider]/search/:query` - Search for videos
- `GET /api/[provider]/watch/:id` - Get video stream details
- `GET /api/[provider]/streams/:id` - (Hanime specific) Get stream data

## Built With

- **Runtime**: Bun
- **Framework**: Hono
- **Scraping**: Cheerio
- **Validation**: Zod
- **Database**: MongoDB (Optional)
- **Caching**: Redis (Optional)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This API is intended for educational purposes and personal use. It scrapes content from third-party websites. The developers of this API are not affiliated with any of the content providers. Please direct all copyright claims to the respective content hosts.
