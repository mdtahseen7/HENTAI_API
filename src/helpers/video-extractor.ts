import { load } from "cheerio";

interface VideoSource {
  src: string;
  format: string;
  note?: string;
}

interface ExtractedSources {
  sources: VideoSource[];
}

function extractPhpPlayer(html: string): { video: string | null; srt: string | null } {
  const $ = load(html);
  let video: string | null = null;
  let srt: string | null = null;

  $('script').each((i, el) => {
    const script = $(el).html();
    if (script && script.includes('jwplayer(')) {
      const fileMatch = script.match(/file:\s*["']([^"']+\.mp4)["']/i) || script.match(/file":\s*"([^"]+\.mp4)"/i);
      if (fileMatch) video = fileMatch[1];
      const srtMatch = script.match(/file":\s*"([^"]+\.srt)"/i);
      if (srtMatch) srt = srtMatch[1];
    }
  });

  return { video, srt };
}

function decodeVideoUrl(url: string): string | null {
  try {
    // Try to extract base64 from various URL patterns
    const vidMatch = url.match(/vid=([^&]+)/);
    const uMatch = url.match(/u=([^&]+)/);
    const encoded = vidMatch?.[1] || uMatch?.[1];
    
    if (encoded) {
      const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
      if (decoded.includes('.mp4') || decoded.includes('.m3u8') || decoded.startsWith('http')) {
        return decoded;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function extractHentaiTVSources(url: string): Promise<ExtractedSources> {
  const sources: VideoSource[] = [];
  
  try {
    // First try to decode video URL from the iframe src directly
    const directUrl = decodeVideoUrl(url);
    if (directUrl) {
      const format = directUrl.includes('.m3u8') ? 'hls' : 'mp4';
      sources.push({ src: directUrl, format });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': url
      }
    });
    const data = await response.text();
    const $ = load(data);

    const serverLi = $('.servers li[data-id]');
    if (!serverLi.length && sources.length === 0) {
      sources.push({
        src: url,
        format: 'iframe',
        note: 'Fallback to original URL'
      });
      return { sources };
    }

    const playerUrl = serverLi.attr('data-id');
    if (!playerUrl) {
      if (sources.length === 0) {
        sources.push({
          src: url,
          format: 'iframe',
          note: 'No player URL found'
        });
      }
      return { sources };
    }

    // Try to decode from player URL
    const decodedFromPlayer = decodeVideoUrl(playerUrl);
    if (decodedFromPlayer && !sources.find(s => s.src === decodedFromPlayer)) {
      const format = decodedFromPlayer.includes('.m3u8') ? 'hls' : 'mp4';
      sources.push({ src: decodedFromPlayer, format });
    }

    const playerFullUrl = new URL(playerUrl, url).href;

    try {
      const playerResponse = await fetch(playerFullUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Referer': url
        }
      });
      const playerHtml = await playerResponse.text();
      const extracted = extractPhpPlayer(playerHtml);

      if (extracted.video && !sources.find(s => s.src === extracted.video)) {
        sources.push({ src: extracted.video, format: 'mp4' });
      }
      
      if (extracted.srt) {
        sources.push({ src: extracted.srt, format: 'srt' });
      }

      // Add iframe as fallback
      if (!sources.find(s => s.src === playerFullUrl)) {
        sources.push({ src: playerFullUrl, format: 'iframe' });
      }
    } catch (e) {
      if (!sources.find(s => s.src === playerFullUrl)) {
        sources.push({
          src: playerFullUrl,
          format: 'iframe',
        });
      }
    }

    return { sources };
  } catch (error) {
    if (sources.length === 0) {
      sources.push({
        src: url,
        format: 'iframe',
      });
    }
    return { sources };
  }
}
