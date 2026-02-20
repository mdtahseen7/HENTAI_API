import { load } from "cheerio";

const BASE_URL = "https://www.hentaicity.com";

export interface HentaiCitySearchResult {
  id: string;
  title: string;
  thumbnail: string;
  trailer?: string;
  duration: string;
  views: number;
}

export interface HentaiCityRelated {
  title: string;
  id: string;
}

export interface HentaiCityRecommendation {
  id: string;
  title: string;
  thumbnail: string;
  trailer?: string;
  duration: string;
  views: string;
}

export interface HentaiCityInfo {
  id: string;
  title: string;
  thumbnail: string;
  uploadDate: string;
  author: string;
  description: string;
  altTitle: string;
  related: HentaiCityRelated[];
  recommendations: HentaiCityRecommendation[];
  tags: string[];
}

export interface HentaiCitySource {
  src: string;
  format: string;
  vttThumbnail?: string;
}

export interface HentaiCityWatch {
  id: string;
  title: string;
  thumbnail: string;
  source: HentaiCitySource[];
}

export interface HentaiCityPagination {
  current: number;
  next: number | null;
  last: number;
  pages: number[];
}

export class HentaiCity {
  private baseUrl: string = BASE_URL;

  async getRecent(): Promise<HentaiCitySearchResult[]> {
    const response = await fetch(this.baseUrl);
    const data = await response.text();
    const $ = load(data);
    const results: HentaiCitySearchResult[] = [];

    $('.new-releases .item').each((i, el) => {
      const title = $(el).find('.video-title').text().trim();
      const href = $(el).find('.video-title').attr('href');
      const id = href?.split('/').pop()?.replace('.html', '') || '';
      const image = $(el).find('img').attr('src') || '';
      const duration = $(el).find('.time').text().trim();
      const views = $(el).find('.info span:last-child').text().trim().replace(/,/g, '');
      const trailer = $(el).find('.trailer video').attr('src');

      if (id) {
        results.push({
          id,
          title,
          thumbnail: image,
          trailer,
          duration,
          views: parseInt(views, 10) || 0,
        });
      }
    });

    return results;
  }

  async getPopular(page = 1): Promise<{
    results: HentaiCitySearchResult[];
    pagination: HentaiCityPagination;
  }> {
    const url = `${this.baseUrl}/videos/straight/all-popular${page > 1 ? `-${page}` : ''}.html`;
    const response = await fetch(url);
    const data = await response.text();
    const $ = load(data);
    const results: HentaiCitySearchResult[] = [];

    $('.thumb-list .outer-item').each((i, el) => {
      const title = $(el).find('.video-title').text().trim();
      const href = $(el).find('.video-title').attr('href');
      const id = href?.split('/').pop()?.replace('.html', '') || '';
      const image = $(el).find('img').attr('src') || '';
      const duration = $(el).find('.time').text().trim();
      const views = $(el).find('.info span:last-child').text().trim().replace(/,/g, '');
      const trailer = $(el).find('.trailer video').attr('src');

      if (id) {
        results.push({
          id,
          title,
          thumbnail: image,
          trailer,
          duration,
          views: parseInt(views, 10) || 0,
        });
      }
    });

    // Pagination
    let lastPage = page;
    let nextPage: number | null = null;
    const paginationLinks: number[] = [];

    $('.pagination._767p a').each((i, el) => {
      const href = $(el).attr('href');
      if (href) {
        const pageNum = href.match(/all-popular-(\d+)\.html/);
        if (pageNum) {
          const num = parseInt(pageNum[1], 10);
          paginationLinks.push(num);
          if (num > lastPage) lastPage = num;
        }
      }
      if ($(el).text().toLowerCase().includes('next')) {
        const pageNum = href?.match(/all-popular-(\d+)\.html/);
        if (pageNum) {
          nextPage = parseInt(pageNum[1], 10);
        }
      }
    });

    return {
      results,
      pagination: {
        current: page,
        next: nextPage,
        last: lastPage,
        pages: [...new Set(paginationLinks)].sort((a, b) => a - b)
      }
    };
  }

  async getTop(page = 1): Promise<{
    results: HentaiCitySearchResult[];
    pagination: HentaiCityPagination;
  }> {
    const url = `${this.baseUrl}/videos/straight/all-rate${page > 1 ? `-${page}` : ''}.html`;
    const response = await fetch(url);
    const data = await response.text();
    const $ = load(data);
    const results: HentaiCitySearchResult[] = [];

    $('.thumb-list .outer-item').each((i, el) => {
      const title = $(el).find('.video-title').text().trim();
      const href = $(el).find('.video-title').attr('href');
      const id = href?.split('/').pop()?.replace('.html', '') || '';
      const image = $(el).find('img').attr('src') || '';
      const duration = $(el).find('.time').text().trim();
      const views = $(el).find('.info span:last-child').text().trim().replace(/,/g, '');
      const trailer = $(el).find('.trailer video').attr('src');

      if (id) {
        results.push({
          id,
          title,
          thumbnail: image,
          trailer,
          duration,
          views: parseInt(views, 10) || 0,
        });
      }
    });

    // Pagination
    let lastPage = page;
    let nextPage: number | null = null;
    const paginationLinks: number[] = [];

    $('.pagination._767p a').each((i, el) => {
      const href = $(el).attr('href');
      if (href) {
        const pageNum = href.match(/all-rate-(\d+)\.html/);
        if (pageNum) {
          const num = parseInt(pageNum[1], 10);
          paginationLinks.push(num);
          if (num > lastPage) lastPage = num;
        }
      }
      if ($(el).text().toLowerCase().includes('next')) {
        const pageNum = href?.match(/all-rate-(\d+)\.html/);
        if (pageNum) {
          nextPage = parseInt(pageNum[1], 10);
        }
      }
    });

    return {
      results,
      pagination: {
        current: page,
        next: nextPage,
        last: lastPage,
        pages: [...new Set(paginationLinks)].sort((a, b) => a - b)
      }
    };
  }

  async search(query: string, page = 1): Promise<{
    results: HentaiCitySearchResult[];
    pagination: HentaiCityPagination;
  }> {
    const encodedQuery = encodeURIComponent(query);
    const url = `${this.baseUrl}/search/${page > 1 ? `${page}/` : ''}?q=${encodedQuery}`;
    const response = await fetch(url);
    const data = await response.text();
    const $ = load(data);
    const results: HentaiCitySearchResult[] = [];

    $('.thumb-list .outer-item').each((i, el) => {
      const title = $(el).find('.video-title').text().trim();
      const href = $(el).find('.video-title').attr('href');
      const id = href?.split('/').pop()?.replace('.html', '') || '';
      const image = $(el).find('img').attr('src') || '';
      const duration = $(el).find('.time').text().trim();
      const views = $(el).find('.info span:last-child').text().trim().replace(/,/g, '');
      const trailer = $(el).find('.trailer video').attr('src');

      if (id) {
        results.push({
          id,
          title,
          thumbnail: image,
          trailer,
          duration,
          views: parseInt(views, 10) || 0,
        });
      }
    });

    // Pagination
    let lastPage = page;
    let nextPage: number | null = null;
    const paginationLinks: number[] = [];

    $('.pagination._767p a').each((i, el) => {
      const href = $(el).attr('href');
      if (href) {
        const pageNum = href.match(/search\/(\d+)\//);
        if (pageNum) {
          const num = parseInt(pageNum[1], 10);
          paginationLinks.push(num);
          if (num > lastPage) lastPage = num;
        }
      }
      if ($(el).text().toLowerCase().includes('next')) {
        const pageNum = href?.match(/search\/(\d+)\//);
        if (pageNum) {
          nextPage = parseInt(pageNum[1], 10);
        }
      }
    });

    return {
      results,
      pagination: {
        current: page,
        next: nextPage,
        last: lastPage,
        pages: [...new Set(paginationLinks)].sort((a, b) => a - b)
      }
    };
  }

  async getInfo(id: string): Promise<HentaiCityInfo> {
    const url = `${this.baseUrl}/video/${id}.html`;
    const response = await fetch(url);
    const data = await response.text();
    const $ = load(data);

    const title = $('h1').first().text().trim();
    
    let thumbnail = '';
    let uploadDate = '';
    let author = '';
    
    try {
      const jsonLdText = $('script[type="application/ld+json"]').html();
      if (jsonLdText) {
        const jsonLd = JSON.parse(jsonLdText);
        thumbnail = jsonLd.thumbnailUrl?.length ? jsonLd.thumbnailUrl[0] : '';
        uploadDate = jsonLd.uploadDate || '';
        author = jsonLd.author || '';
      }
    } catch (e) {
      // JSON parsing failed
    }

    let altTitle = '';
    let description = '';
    const infoDivs = $('.ubox-text').children('div');
    if (infoDivs.length > 0) {
      altTitle = $(infoDivs[1]).find('b').text().trim() || '';
    }
    if (infoDivs.length > 1) {
      description = $(infoDivs[2]).text().trim() || '';
    }

    const tags: string[] = [];
    $('#taglink a').each((i, el) => {
      const href = $(el).attr('href');
      if (href && !href.includes('/profile/')) {
        tags.push($(el).text().trim());
      }
    });

    const related: HentaiCityRelated[] = [];
    let foundEpisodeList = false;
    $('.ubox-text').children().each((i, el) => {
      if ($(el).is('b') && $(el).text().toLowerCase().includes('episode list')) {
        foundEpisodeList = true;
      } else if (foundEpisodeList && $(el).is('a')) {
        const relTitle = $(el).text().trim();
        const href = $(el).attr('href');
        const relId = href ? href.split('/').pop()?.replace('.html', '') || '' : '';
        if (relTitle.length > 0 && relId.length > 0 && relTitle !== "Login" && relTitle !== "Sign Up") {
          related.push({ title: relTitle, id: relId });
        }
      }
    });

    const recommendations = await this.fetchRecommendations(id);

    return {
      id,
      title,
      thumbnail,
      uploadDate,
      author,
      description,
      altTitle,
      related,
      recommendations,
      tags
    };
  }

  async getWatch(id: string): Promise<HentaiCityWatch> {
    const url = `${this.baseUrl}/video/${id}.html`;
    const response = await fetch(url);
    const data = await response.text();
    const $ = load(data);
    
    const vidid = id.split('-').pop() || '';
    const title = $('h1').first().text().trim();
    
    let thumbnail = '';
    try {
      const jsonLdText = $('script[type="application/ld+json"]').html();
      if (jsonLdText) {
        const jsonLd = JSON.parse(jsonLdText);
        thumbnail = jsonLd.thumbnailUrl?.length ? jsonLd.thumbnailUrl[0] : '';
      }
    } catch (e) {
      // JSON parsing failed
    }

    const m3u8Url = $('video source').attr('src') || '';
    const vttThumbnail = `https://www.hentaicity.com/stp/vtt.php?v=${vidid}`;

    return {
      id,
      title,
      thumbnail,
      source: [
        {
          src: m3u8Url,
          format: 'hls',
          vttThumbnail
        }
      ]
    };
  }

  private async fetchRecommendations(id: string): Promise<HentaiCityRecommendation[]> {
    try {
      const ajaxUrl = `${this.baseUrl}/stp/ajax.php`;
      const xjxr = Date.now();
      const vidid = id.split('-').pop() || '';

      const params = new URLSearchParams();
      params.append('xjxfun', 'related_videos');
      params.append('xjxr', xjxr.toString());
      params.append('xjxargs[]', `S${vidid}`);
      params.append('xjxargs[]', 'N1');
      params.append('xjxargs[]', 'N12');

      const response = await fetch(ajaxUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: params.toString()
      });

      const xmlResponse = await response.text();
      const cdataStart = xmlResponse.indexOf('<![CDATA[') + 9;
      const cdataEnd = xmlResponse.indexOf(']]>');
      const htmlContent = xmlResponse.slice(cdataStart, cdataEnd);

      const $ = load(htmlContent);
      const recommendations: HentaiCityRecommendation[] = [];

      $('.outer-item').each((i, el) => {
        const $el = $(el);
        const a = $el.find('.thumb-img');
        const img = a.find('img').attr('src') || '';
        const href = a.attr('href') || '';
        const recTitle = $el.find('.video-title').text().trim() || '';
        const recId = href.split('/').pop()?.replace('.html', '') || '';
        const duration = $el.find('.time').text().trim() || '';
        const views = $el.find('.info span:last-child').text().trim() || '';
        const trailer = $el.find('.trailer video').attr('src') || '';

        if (recId && recTitle) {
          recommendations.push({
            id: recId,
            title: recTitle,
            thumbnail: img,
            trailer: trailer || undefined,
            duration,
            views
          });
        }
      });

      return recommendations;
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      return [];
    }
  }
}
