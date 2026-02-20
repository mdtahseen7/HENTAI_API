import { load } from "cheerio";
import { extractHentaiTVSources } from "../helpers/video-extractor";

const BASE_URL = "https://hentai.tv";

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Cookie': 'inter=1'
};

export interface HentaiTVSearchResult {
  id: string;
  title: string;
  image: string;
  views: number;
}

export interface HentaiTVInfo {
  id: string;
  name: string;
  poster: string;
  views: string;
  description: string;
  releaseDate: string;
  uploadDate: string;
  altTitle: string;
  brandName: string;
  type: string;
  genre: string[];
  related: { title: string; id: string; image: string; views: string }[];
}

export interface HentaiTVSource {
  src: string;
  format: string;
  note?: string;
}

export interface HentaiTVWatch {
  id: string;
  name: string;
  poster: string;
  sources: HentaiTVSource[];
}

export class HentaiTV {
  private baseUrl: string = BASE_URL;

  async getRecent(): Promise<HentaiTVSearchResult[]> {
    const response = await fetch(this.baseUrl, { headers: DEFAULT_HEADERS });
    const data = await response.text();
    const $ = load(data);
    const results: HentaiTVSearchResult[] = [];

    $('.crsl-slde').each((i, el) => {
      const title = $(el).find('a').text().trim();
      const href = $(el).find('a').attr('href');
      const id = href?.split('/hentai/').pop()?.split('/').shift() || '';
      const image = $(el).find('img').attr('src') || '';
      const views = $(el).find('.opacity-50').text().trim().replace(/,/g, '');

      if (id) {
        results.push({
          id,
          title,
          image,
          views: parseInt(views, 10) || 0,
        });
      }
    });

    return results;
  }

  async getTrending(): Promise<HentaiTVSearchResult[]> {
    return this.getRecent(); // Same endpoint
  }

  async search(query: string, page = 1): Promise<{
    results: HentaiTVSearchResult[];
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
  }> {
    const response = await fetch(`${this.baseUrl}/page/${page}/?s=${encodeURIComponent(query)}`, { headers: DEFAULT_HEADERS });
    const data = await response.text();
    const $ = load(data);
    const results: HentaiTVSearchResult[] = [];

    $('.crsl-slde').each((i, el) => {
      const title = $(el).find('a').text().trim();
      const href = $(el).find('a').attr('href');
      const id = href?.split('/hentai/').pop()?.split('/').shift() || '';
      const image = $(el).find('img').attr('src') || '';
      const views = $(el).find('.opacity-50').text().trim().replace(/,/g, '');

      if (id) {
        results.push({
          id,
          title,
          image,
          views: parseInt(views, 10) || 0,
        });
      }
    });

    // Pagination
    let totalPages = 1;
    const hasPagination = $('.flex[data-nav]').length > 0;
    
    if (hasPagination) {
      $('.flex[data-nav] a').each((i, el) => {
        const href = $(el).attr('href');
        if (href) {
          const pageMatch = href.match(/\/page\/(\d+)/);
          if (pageMatch && pageMatch[1]) {
            const pageNumber = parseInt(pageMatch[1], 10);
            if (pageNumber > totalPages) {
              totalPages = pageNumber;
            }
          }
        }
      });
    }

    return {
      results,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
    };
  }

  async getInfo(id: string): Promise<HentaiTVInfo> {
    const response = await fetch(`${this.baseUrl}/hentai/${id}`, {
      headers: DEFAULT_HEADERS
    });
    const data = await response.text();
    const $ = load(data);

    const genre: string[] = [];
    $('.flex.flex-wrap.pb-3 .btn').each((i, el) => {
      genre.push($(el).text().trim());
    });

    const related: { title: string; id: string; image: string; views: string }[] = [];
    $('article').each((i, el) => {
      const title = $(el).find('h3 a').text().trim();
      const link = $(el).find('h3 a').attr('href');
      const image = $(el).find('img').attr('src') || '';
      const views = $(el).find('.text-silver-200').text().trim();

      if (title && link) {
        related.push({
          title,
          id: link.split('/hentai/')[1]?.replace(/\//, '') || '',
          image,
          views
        });
      }
    });

    return {
      id,
      name: $('h1').text().trim(),
      poster: $('.relative img').attr('src') || '',
      views: $('.text-silver-200').first().text().trim(),
      description: $('.prose p').text().trim(),
      releaseDate: $('span:contains("Release Date")').next().text().trim(),
      uploadDate: $('span:contains("Upload Date")').next().text().trim(),
      altTitle: $('span:contains("Alternate Title")').next().text().trim(),
      brandName: $('p:has(span:contains("Brand")) a').text().trim(),
      type: $('a.btn:contains("uncensored")').text().trim() || 'censored',
      genre,
      related
    };
  }

  async getWatch(id: string): Promise<HentaiTVWatch> {
    const response = await fetch(`${this.baseUrl}/hentai/${id}`, {
      headers: DEFAULT_HEADERS
    });
    const data = await response.text();
    const $ = load(data);

    const result: HentaiTVWatch = {
      id,
      name: $('h1').text().trim(),
      poster: $('.relative img').attr('src') || '',
      sources: []
    };

    const videoIframe = $('.aspect-video iframe');
    if (videoIframe.length) {
      const iframeUrl = videoIframe.attr('src');
      if (iframeUrl) {
        try {
          const extractorRes = await extractHentaiTVSources(iframeUrl);
          if (extractorRes.sources.length > 0) {
            result.sources.push(...extractorRes.sources);
          }
        } catch (e) {
          console.log('Extractor failed:', e);
        }
      }
    }

    return result;
  }

  async getByGenre(genre: string, page = 1): Promise<{
    results: HentaiTVSearchResult[];
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
  }> {
    const response = await fetch(`${this.baseUrl}/page/${page}/?genre=${encodeURIComponent(genre)}`, { headers: DEFAULT_HEADERS });
    const data = await response.text();
    const $ = load(data);
    const results: HentaiTVSearchResult[] = [];

    $('.crsl-slde').each((i, el) => {
      const title = $(el).find('a').text().trim();
      const href = $(el).find('a').attr('href');
      const id = href?.split('/hentai/').pop()?.split('/').shift() || '';
      const image = $(el).find('img').attr('src') || '';
      const views = $(el).find('.opacity-50').text().trim().replace(/,/g, '');

      if (id) {
        results.push({
          id,
          title,
          image,
          views: parseInt(views, 10) || 0,
        });
      }
    });

    let totalPages = 1;
    const hasPagination = $('.flex[data-nav]').length > 0;
    
    if (hasPagination) {
      $('.flex[data-nav] a').each((i, el) => {
        const href = $(el).attr('href');
        if (href) {
          const pageMatch = href.match(/\/page\/(\d+)/);
          if (pageMatch && pageMatch[1]) {
            const pageNumber = parseInt(pageMatch[1], 10);
            if (pageNumber > totalPages) {
              totalPages = pageNumber;
            }
          }
        }
      });
    }

    return {
      results,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
    };
  }

  async getRandom(): Promise<HentaiTVSearchResult[]> {
    const response = await fetch(`${this.baseUrl}/random`, { headers: DEFAULT_HEADERS });
    const data = await response.text();
    const $ = load(data);
    const results: HentaiTVSearchResult[] = [];

    $('.flex.flex-wrap.-mx-4 > div').each((i, el) => {
      const title = $(el).find('a').text().trim();
      const href = $(el).find('a').attr('href');
      const id = href?.split('/hentai/').pop()?.split('/').shift() || '';
      const image = $(el).find('figure.relative img').attr('src') || $(el).find('img').attr('src') || '';
      const views = $(el).find('.opacity-50').last().text().trim().replace(/,/g, '');

      if (id) {
        results.push({
          id,
          title,
          image,
          views: parseInt(views, 10) || 0,
        });
      }
    });

    return results;
  }

  async getByBrand(brand: string, page = 1): Promise<{
    results: HentaiTVSearchResult[];
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
  }> {
    const response = await fetch(`${this.baseUrl}/brand/${brand}/page/${page}/`, { headers: DEFAULT_HEADERS });
    const data = await response.text();
    const $ = load(data);
    const results: HentaiTVSearchResult[] = [];

    $('.crsl-slde').each((i, el) => {
      const title = $(el).find('a').text().trim();
      const href = $(el).find('a').attr('href');
      const id = href?.split('/hentai/').pop()?.split('/').shift() || '';
      const image = $(el).find('img').attr('src') || '';
      const views = $(el).find('.opacity-50').text().trim().replace(/,/g, '');

      if (id) {
        results.push({
          id,
          title,
          image,
          views: parseInt(views, 10) || 0,
        });
      }
    });

    let totalPages = 1;
    const hasPagination = $('.flex[data-nav]').length > 0;
    
    if (hasPagination) {
      $('.flex[data-nav] a').each((i, el) => {
        const href = $(el).attr('href');
        if (href) {
          const pageMatch = href.match(/\/page\/(\d+)/);
          if (pageMatch && pageMatch[1]) {
            const pageNumber = parseInt(pageMatch[1], 10);
            if (pageNumber > totalPages) {
              totalPages = pageNumber;
            }
          }
        }
      });
    }

    return {
      results,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
    };
  }
}
