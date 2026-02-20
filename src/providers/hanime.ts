import type { SearchResult, VideosManifest } from "../types/hanime";
import type { RawSearchResult } from "../types/hanime";
import type { PaginatedResult } from "../types/r34";

export default class Hanime {
  private readonly BASE_URL = "https://hanime.tv";
  private readonly SEARCH_URL = "https://search.htv-services.com";

  private async fetchVideoPayload(idOrSlug: string): Promise<any> {
    const apiUrl = `${this.BASE_URL}/api/v8/video?id=${encodeURIComponent(idOrSlug)}`;
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://hanime.tv/',
      },
    });

    return await response.json();
  }

  public async getRecent(page = 1, perPage = 10): Promise<PaginatedResult<SearchResult>> {
    const response = await fetch(this.SEARCH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        blacklist: [],
        brands: [],
        order_by: "created_at_unix",
        page: page - 1,
        tags: [],
        search_text: "",
        tags_mode: "AND",
      }),
    });

    const data = (await response.json()) as {
      page: number;
      nbPages: number;
      nbHits: number;
      hitsPerPage: number;
      hits: string;
    };

    const allResults = (JSON.parse(data.hits) as RawSearchResult[]).map(mapToSearchResult);
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const results = allResults.slice(startIndex, endIndex);


    return {
      pages: Math.ceil(data.nbHits / perPage),
      total: data.nbHits,
      previous: page - 1,
      next: page + 1,
      hasNextPage: page < Math.ceil(data.nbHits / perPage),
     page,
      results: results,
    };
  }

  public async search(query: string, page = 1, perPage = 10): Promise<PaginatedResult<SearchResult>> {
    const response = await fetch(this.SEARCH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        blacklist: [],
        brands: [],
        order_by: "created_at_unix",
        page: page - 1,
        tags: [],
        search_text: query,
        tags_mode: "AND",
      }),
    });
    const data = (await response.json()) as {
      page: number;
      nbPages: number;
      nbHits: number;
      hitsPerPage: number;
      hits: string;
    };

    const allResults = (JSON.parse(data.hits) as RawSearchResult[]).map(mapToSearchResult);
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const results = allResults.slice(startIndex, endIndex);

    return {
      pages: Math.ceil(data.nbHits / perPage),
      total: data.nbHits,
      previous: page - 1,
      next: page + 1,
      hasNextPage: page < Math.ceil(data.nbHits / perPage),
      page,
      results: results,
    };
  }

  public async getInfo(idOrSlug: string) {
    const videoData = await this.fetchVideoPayload(idOrSlug) as any;
    const hentaiVideo = videoData?.hentai_video ?? {};
    const franchise = videoData?.hentai_franchise ?? {};

    return {
      title: franchise.name ?? hentaiVideo.name ?? '',
      slug: franchise.slug ?? hentaiVideo.slug ?? '',
      id: hentaiVideo.id,
      description: hentaiVideo.description ?? '',
      views: hentaiVideo.views ?? 0,
      interests: hentaiVideo.interests ?? 0,
      posterUrl: hentaiVideo.poster_url ?? '',
      coverUrl: hentaiVideo.cover_url ?? '',
      brand: {
        name: hentaiVideo.brand ?? '',
        id: hentaiVideo.brand_id ?? '',
      },
      durationMs: hentaiVideo.duration_in_ms ?? 0,
      isCensored: hentaiVideo.is_censored ?? false,
      likes: hentaiVideo.likes ?? 0,
      rating: hentaiVideo.rating ?? 0,
      dislikes: hentaiVideo.dislikes ?? 0,
      downloads: hentaiVideo.downloads ?? 0,
      rankMonthly: hentaiVideo.monthly_rank ?? 0,
      tags: videoData?.hentai_tags ?? [],
      createdAt: hentaiVideo.created_at ?? '',
      releasedAt: hentaiVideo.released_at ?? '',
      episodes: {
        next: videoData?.next_hentai_video ? mapToEpisode(videoData.next_hentai_video) : null,
        all: Array.isArray(videoData?.hentai_franchise_hentai_videos)
          ? videoData.hentai_franchise_hentai_videos.map(mapToEpisode)
          : [],
        random: videoData?.next_random_hentai_video ? mapToEpisode(videoData.next_random_hentai_video) : null,
      },
    };
  }

  public async getIframeBridgeData(idOrSlug: string) {
    const json = await this.fetchVideoPayload(idOrSlug) as {
      hentai_video?: { id?: number; slug?: string };
      videos_manifest?: VideosManifest;
    };

    const hv = json?.hentai_video ?? {};
    const videosManifest = json?.videos_manifest ?? { servers: [] } as VideosManifest;
    const servers = Array.isArray(videosManifest?.servers) ? videosManifest.servers : [];
    const selectedServer = servers[0] ?? null;
    const selectedVideoStream = selectedServer?.streams?.find((stream) => stream.kind !== 'premium_alert' && !!stream.url) ?? selectedServer?.streams?.[0] ?? null;

    return {
      id: hv.id ?? idOrSlug,
      slug: hv.slug ?? String(idOrSlug),
      videosManifest,
      selectedServer,
      selectedVideoStream,
    };
  }

  public async getEpisode(idOrSlug: string) {
    const json = (await this.fetchVideoPayload(idOrSlug) as { videos_manifest: VideosManifest; hentai_video?: { id?: number; slug?: string } });

    const data = json.videos_manifest;
    const videos = data.servers.map(server => server.streams).flat();

    const streams = videos.map((video) => ({
        id: video.id,
        serverId: video.server_id,
        kind: video.kind,
        extension: video.extension,
        mimeType: video.mime_type,
        width: video.width,
        height: video.height,
        durationInMs: video.duration_in_ms,
        filesizeMbs: video.filesize_mbs,
        filename: video.filename,
        url: video.url,
    })).filter(video => video.url && video.url !== '' && video.kind !== 'premium_alert');

    const hasOnlyPlaceholderUrls = streams.length > 0 && streams.every((stream) => stream.url.includes('streamable.cloud/hls/stream.m3u8'));
    const hv = json.hentai_video;
    const fallback = hv?.id && hv?.slug
      ? {
          warning: 'Hanime currently returns placeholder stream URLs. Direct playback may fail.',
          videoPageUrl: `${this.BASE_URL}/videos/hentai/${hv.slug}`,
          playableEmbedUrl: null,
          embedNote: 'Standalone player.hanime.tv v2 links require parent postMessage context and will show a white screen.',
        }
      : null;

    if (hasOnlyPlaceholderUrls) {
      return {
        streams,
        ...fallback,
      };
    }

    return streams;
}

  private todo(method: string) {
    class TodoError extends Error {
      constructor(message: string) {
        super(message);
        this.name = "TodoError";
      }
    }

    throw new TodoError(`TODO: Implement ${method} in ${this.constructor.name}. The method ${method} is not implemented yet.`);
  }
}

function mapToSearchResult(raw: RawSearchResult): SearchResult {
  return {
    id: raw.id,
    name: raw.name,
    titles: raw.titles,
    slug: raw.slug,
    description: raw.description,
    views: raw.views,
    interests: raw.interests,
    bannerImage: raw.poster_url,
    coverImage: raw.cover_url,
    brand: {
      name: raw.brand,
      id: raw.brand_id,
    },
    durationMs: raw.duration_in_ms,
    isCensored: raw.is_censored,
    likes: raw.likes,
    rating: raw.rating,
    dislikes: raw.dislikes,
    downloads: raw.downloads,
    rankMonthly: raw.monthly_rank,
    tags: raw.tags,
    createdAt: raw.created_at,
    releasedAt: raw.released_at,
  };
}

function mapToEpisode(raw: { id: number; name: string; slug: string; created_at: string; released_at: string; views: number; interests: number; poster_url: string; cover_url: string; is_hard_subtitled: boolean; brand: string; duration_in_ms: number; is_censored: boolean; rating: number; likes: number; dislikes: number; downloads: number; monthly_rank: number; brand_id: string; is_banned_in: string; preview_url: null; primary_color: null; created_at_unix: number; released_at_unix: number;}) {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    views: raw.views,
    interests: raw.interests,
    thumbnailUrl: raw.poster_url,
    coverUrl: raw.cover_url,
    isHardSubtitled: raw.is_hard_subtitled,
    brand: {
      name: raw.brand,
      id: raw.brand_id,
    },
    durationMs: raw.duration_in_ms,
    isCensored: raw.is_censored,
    likes: raw.likes,
    rating: raw.rating,
    dislikes: raw.dislikes,
    downloads: raw.downloads,
    rankMonthly: raw.monthly_rank,
    brandId: raw.brand_id,
    isBannedIn: raw.is_banned_in,
    previewUrl: raw.preview_url,
    color: raw.primary_color,
    createdAt: raw.created_at_unix,
    releasedAt: raw.released_at_unix,
  };
}
