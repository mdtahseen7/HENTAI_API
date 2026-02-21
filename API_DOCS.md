Hentai API Documentation

This document outlines the available endpoints for the Hentai API, including descriptions, example usage, and response schemas.

Base URLs:
- Cloudflare Workers: https://hentai-api.mdtahseen7378.workers.dev
- HuggingFace Spaces: https://mdtahseen7-hentai-api.hf.space


Oppai Provider

Search

Endpoint: GET /api/oppai/search/:query

Description: Search for videos on Oppai.stream by title.

Path Parameters:

query (string, required): The search term.

Query Parameters:

page (number, optional): Page number. Default: 1.

Example: /api/oppai/search/overflow?page=1

Response Schema:

{
  "page": "number",
  "results": [
    {
      "id": "string",
      "title": "string",
      "slug": "string",
      "cover_url": "string",
      "views": "number",
      "rating": "number",
      "is_censored": "boolean"
    }
  ],
  "hasNextPage": "boolean"
}


Watch

Endpoint: GET /api/oppai/watch/:id

Description: Get streaming sources for a specific video. Returns multiple quality options with required headers.

Path Parameters:

id (string, required): The video slug/id from search results.

Example: /api/oppai/watch/overflow-episode-1

Response Schema:

{
  "title": "string",
  "description": "string",
  "streams": [
    {
      "url": "string",
      "quality": "string",
      "height": "number",
      "width": "number",
      "isM3U8": "boolean",
      "headers": {
        "Referer": "string",
        "User-Agent": "string"
      }
    }
  ],
  "subtitles": [
    {
      "language": "string",
      "url": "string"
    }
  ],
  "referer": "string"
}


HentaiHaven Provider

Search

Endpoint: GET /api/hh/search/:query

Description: Search for hentai series on HentaiHaven.

Path Parameters:

query (string, required): The search term.

Example: /api/hh/search/overflow

Response Schema:

{
  "data": [
    {
      "id": "string",
      "title": "string",
      "cover": "string",
      "rating": "number",
      "released": "number",
      "genres": [
        {
          "id": "string",
          "url": "string",
          "name": "string"
        }
      ],
      "totalEpisodes": "number",
      "date": {
        "unparsed": "string",
        "parsed": "DateTime"
      },
      "alternative": "string",
      "author": "string"
    }
  ]
}


Info

Endpoint: GET /api/hh/:id

Description: Get detailed information about a specific hentai series.

Path Parameters:

id (string, required): The series ID from search results.

Example: /api/hh/overflow

Response Schema:

{
  "id": "string",
  "title": "string",
  "cover": "string",
  "summary": "string",
  "views": "number",
  "ratingCount": "number",
  "released": "number",
  "genres": [
    {
      "id": "string",
      "url": "string",
      "name": "string"
    }
  ],
  "totalEpisodes": "number",
  "episodes": [
    {
      "id": "string",
      "title": "string",
      "thumbnail": "string",
      "number": "number",
      "releasedUTC": "DateTime",
      "releasedRelative": "string"
    }
  ]
}


Sources

Endpoint: GET /api/hh/sources/:id

Description: Get video sources for a specific episode. Episode ID must be base64 encoded.

Path Parameters:

id (string, required): Base64 encoded episode ID.

Example: /api/hh/sources/b3ZlcmZsb3cvZXBpc29kZS0x

Response Schema:

{
  "sources": [
    {
      "label": "string",
      "src": "string",
      "type": "string"
    }
  ],
  "thumbnail": "string"
}


Hanime Provider

Search

Endpoint: GET /api/hanime/search/:query

Description: Search for videos on Hanime.tv.

Path Parameters:

query (string, required): The search term.

Query Parameters:

page (number, optional): Page number. Default: 1.
perPage (number, optional): Results per page. Default: 10.

Example: /api/hanime/search/overflow?page=1

Response Schema:

{
  "pages": "number",
  "total": "number",
  "previous": "number",
  "next": "number",
  "hasNextPage": "boolean",
  "page": "number",
  "results": [
    {
      "id": "number",
      "name": "string",
      "titles": ["string"],
      "slug": "string",
      "description": "string",
      "views": "number",
      "interests": "number",
      "bannerImage": "string",
      "coverImage": "string",
      "brand": {
        "name": "string",
        "id": "string"
      },
      "durationMs": "number",
      "isCensored": "boolean",
      "likes": "number",
      "rating": "number",
      "dislikes": "number",
      "downloads": "number",
      "rankMonthly": "number",
      "tags": ["object"],
      "createdAt": "string",
      "releasedAt": "string"
    }
  ]
}


Info

Endpoint: GET /api/hanime/:id

Description: Get detailed information about a specific video.

Path Parameters:

id (string, required): The video ID or slug.

Example: /api/hanime/overflow-episode-1

Response Schema:

{
  "title": "string",
  "slug": "string",
  "id": "number",
  "description": "string",
  "views": "number",
  "interests": "number",
  "posterUrl": "string",
  "coverUrl": "string",
  "brand": {
    "name": "string",
    "id": "string"
  },
  "durationMs": "number",
  "isCensored": "boolean",
  "likes": "number",
  "rating": "number",
  "dislikes": "number",
  "downloads": "number",
  "rankMonthly": "number",
  "tags": ["object"],
  "createdAt": "string",
  "releasedAt": "string",
  "episodes": {
    "next": "object | null",
    "all": ["object"],
    "random": "object | null"
  }
}


Streams

Endpoint: GET /api/hanime/streams/:id

Description: Get video streaming sources.

Path Parameters:

id (string, required): The video ID or slug.

Example: /api/hanime/streams/overflow-episode-1

Response Schema:

{
  "streams": [
    {
      "id": "number",
      "serverId": "number",
      "kind": "string",
      "extension": "string",
      "mimeType": "string",
      "width": "number",
      "height": "number",
      "durationInMs": "number",
      "filesizeMbs": "number",
      "filename": "string",
      "url": "string"
    }
  ],
  "iframeSupport": {
    "supported": "boolean",
    "reason": "string"
  }
}


HentaiTV Provider

Recent

Endpoint: GET /api/hentaitv/recent

Description: Get recently uploaded videos.

Example: /api/hentaitv/recent

Response Schema:

{
  "data": [
    {
      "id": "string",
      "title": "string",
      "image": "string",
      "views": "number"
    }
  ]
}


Trending

Endpoint: GET /api/hentaitv/trending

Description: Get trending videos.

Example: /api/hentaitv/trending

Response Schema:

{
  "data": [
    {
      "id": "string",
      "title": "string",
      "image": "string",
      "views": "number"
    }
  ]
}


Search

Endpoint: GET /api/hentaitv/search/:query

Description: Search for videos on HentaiTV.

Path Parameters:

query (string, required): The search term.

Query Parameters:

page (number, optional): Page number. Default: 1.

Example: /api/hentaitv/search/overflow?page=1

Response Schema:

{
  "results": [
    {
      "id": "string",
      "title": "string",
      "image": "string",
      "views": "number"
    }
  ],
  "totalPages": "number",
  "currentPage": "number",
  "hasNextPage": "boolean"
}


Info

Endpoint: GET /api/hentaitv/info/:id

Description: Get detailed information about a specific video.

Path Parameters:

id (string, required): The video ID from search results.

Example: /api/hentaitv/info/overflow-episode-1

Response Schema:

{
  "id": "string",
  "name": "string",
  "poster": "string",
  "views": "string",
  "description": "string",
  "releaseDate": "string",
  "uploadDate": "string",
  "altTitle": "string",
  "brandName": "string",
  "type": "string",
  "genre": ["string"],
  "related": [
    {
      "title": "string",
      "id": "string",
      "image": "string",
      "views": "string"
    }
  ]
}


Watch

Endpoint: GET /api/hentaitv/watch/:id

Description: Get video streaming sources.

Path Parameters:

id (string, required): The video ID.

Example: /api/hentaitv/watch/overflow-episode-1

Response Schema:

{
  "id": "string",
  "name": "string",
  "poster": "string",
  "sources": [
    {
      "src": "string",
      "format": "string",
      "note": "string"
    }
  ]
}


HentaiCity Provider

Recent

Endpoint: GET /api/hentaicity/recent

Description: Get recently uploaded videos.

Example: /api/hentaicity/recent

Response Schema:

{
  "data": [
    {
      "id": "string",
      "title": "string",
      "image": "string",
      "duration": "string",
      "views": "number"
    }
  ]
}


Popular

Endpoint: GET /api/hentaicity/popular

Description: Get popular videos.

Query Parameters:

page (number, optional): Page number. Default: 1.

Example: /api/hentaicity/popular?page=1

Response Schema:

{
  "results": [
    {
      "id": "string",
      "title": "string",
      "image": "string",
      "duration": "string",
      "views": "number"
    }
  ],
  "currentPage": "number",
  "lastPage": "number",
  "hasNextPage": "boolean"
}


Top

Endpoint: GET /api/hentaicity/top

Description: Get top rated videos.

Query Parameters:

page (number, optional): Page number. Default: 1.

Example: /api/hentaicity/top?page=1

Response Schema:

{
  "results": [
    {
      "id": "string",
      "title": "string",
      "image": "string",
      "duration": "string",
      "views": "number"
    }
  ],
  "currentPage": "number",
  "lastPage": "number",
  "hasNextPage": "boolean"
}


Info

Endpoint: GET /api/hentaicity/info/:id

Description: Get detailed information about a specific video.

Path Parameters:

id (string, required): The video ID.

Example: /api/hentaicity/info/12345

Response Schema:

{
  "id": "string",
  "title": "string",
  "altTitle": "string",
  "description": "string",
  "thumbnail": "string",
  "uploadDate": "string",
  "author": "string",
  "tags": ["string"],
  "related": [
    {
      "id": "string",
      "title": "string",
      "image": "string",
      "duration": "string",
      "views": "number"
    }
  ]
}


Watch

Endpoint: GET /api/hentaicity/watch/:id

Description: Get HLS streaming source for a video.

Path Parameters:

id (string, required): The video ID.

Example: /api/hentaicity/watch/12345

Response Schema:

{
  "id": "string",
  "title": "string",
  "thumbnail": "string",
  "source": [
    {
      "src": "string",
      "format": "hls",
      "vttThumbnail": "string"
    }
  ]
}


Error Responses

All endpoints return errors in the following format:

{
  "error": "string"
}

Common HTTP status codes:

400 - Bad Request (invalid parameters)
404 - Not Found
422 - Validation Error
429 - Rate Limit Exceeded
500 - Internal Server Error


Rate Limiting

Without API key: 15 requests per minute per IP
With API key: 1500 requests per minute

Include API key in requests via:
- Header: x-api-key: YOUR_KEY
- Query: ?apiKey=YOUR_KEY
