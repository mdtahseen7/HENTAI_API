import * as cheerio from 'cheerio';
import type { SearchResult } from "../types/hanime";

interface OppaiVideoSource {
    url: string;
    quality: string;
    width: number;
    height: number;
    isM3U8: boolean;
}

interface OppaiSubtitle {
    language: string;
    url: string;
}

export class OppaiStream {
    private readonly BASE_URL = "https://oppai.stream";
    private readonly SEARCH_API = "https://oppai.stream/actions/search.php";


    private async fetch(url: string) {
        return fetch(url, {
            headers: {
                'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                'Referer': this.BASE_URL,
                'X-Requested-With': 'XMLHttpRequest',
            },
        });
    }

    public async search(query: string, page = 1) {
        const params = new URLSearchParams({
            text: query,
            order: 'recent',
            page: page.toString(),
            limit: '12',
            genres: '',
            blacklist: '',
            studio: '',
            ibt: '0',
            swa: '1'
        });

        const response = await this.fetch(`${this.SEARCH_API}?${params.toString()}`);
        const html = await response.text();
        const $ = cheerio.load(html);

        const results: any[] = [];
        
        $('.in-grid.episode-shown').each((_, el) => {
            const $el = $(el);
            const title = $el.attr('name') || '';
            const episode = $el.attr('ep') || '1';
            
            const href = $el.find('a').attr('href');
            let slug = '';
            if (href) {
                try {
                    const urlObj = new URL(href, this.BASE_URL);
                    slug = urlObj.searchParams.get('e') || '';
                } catch (e) {}
            }
            
            if (!slug) {
                slug = $el.attr('idgt') + '-' + episode; 
            }

            const coverSrc = $el.find('.cover-img-in').attr('src');
            const coverUrl = coverSrc ? (coverSrc.startsWith('http') ? coverSrc : `${this.BASE_URL}${coverSrc}`) : '';

            results.push({
                id: slug,
                title: `${title} Episode ${episode}`,
                slug: slug,
                cover_url: coverUrl,
                views: 0,
                rating: 0,
                is_censored: false
            });
        });

        return {
            page,
            results,
            hasNextPage: results.length >= 12
        };
    }

    public async getStream(slug: string) {
        const url = `${this.BASE_URL}/watch?e=${encodeURIComponent(slug)}`;
        const response = await this.fetch(url);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch video page. Status: ${response.status}`);
        }
        
        const html = await response.text();
        
        const match = html.match(/var\s+availableres\s*=\s*({[^}]+})/);
        
        if (!match) {
            throw new Error("Video sources not found");
        }

        try {
            const sources = JSON.parse(match[1]);
            const streams: OppaiVideoSource[] = [];

            for (const [res, link] of Object.entries(sources)) {
                if (typeof link === 'string' && link.startsWith('http')) {
                    let height = parseInt(res, 10);
                    if (res.toLowerCase() === '4k') height = 2160;
                    
                    const width = height > 0 ? Math.round(height * (16 / 9)) : 0;

                    streams.push({
                        url: link,
                        quality: res === '4k' ? '4k' : res + 'p',
                        height,
                        width,
                        isM3U8: link.includes('.m3u8')
                    });
                }
            }
            
            const $ = cheerio.load(html);
            const title = $('h1.title-vid').text().trim();
            const description = $('.desc-vid').text().trim();

            const subtitles: OppaiSubtitle[] = [];
            $('track[kind="subtitles"]').each((_, el) => {
                const $el = $(el);
                const src = $el.attr('src');
                if (src) {
                    subtitles.push({
                        language: $el.attr('label') || 'Unknown',
                        url: src
                    });
                }
            });

            return {
                title: title || slug,
                description,
                streams: streams.sort((a, b) => b.height - a.height),
                subtitles,
                referer: this.BASE_URL
            };
        } catch (e) {
            throw new Error("Failed to parse video source JSON");
        }
    }
}

