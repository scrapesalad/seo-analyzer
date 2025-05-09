import { NextResponse } from "next/server";

// Make environment variable checks more graceful
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CX = process.env.GOOGLE_CX;
const SERP_API_KEY = process.env.SERP_API_KEY;

interface BacklinkResult {
  url: string;
  title: string;
  snippet: string;
  source: 'google' | 'serp';
}

async function getGoogleBacklinks(domain: string): Promise<BacklinkResult[]> {
  if (!GOOGLE_API_KEY || !GOOGLE_CX) {
    console.warn('Google API credentials not configured');
    return [];
  }

  try {
    const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '');
    
    const query = `link:${cleanDomain} -site:${cleanDomain}`;
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(query)}&num=10`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Google API Error:', data);
      return [];
    }

    return (data.items || []).map((item: any) => ({
      url: item.link,
      title: item.title,
      snippet: item.snippet,
      source: 'google' as const
    }));
  } catch (error) {
    console.error('Error fetching Google backlinks:', error);
    return [];
  }
}

async function getSerpBacklinks(domain: string): Promise<BacklinkResult[]> {
  if (!SERP_API_KEY) {
    console.warn('SERP API key not configured');
    return [];
  }

  try {
    const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '');
    
    const response = await fetch(
      `https://serpapi.com/search.json?engine=google&q=link:${encodeURIComponent(cleanDomain)}&api_key=${SERP_API_KEY}&num=100`
    );

    if (!response.ok) {
      throw new Error(`SERP API request failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(`SERP API error: ${data.error}`);
    }

    return (data.organic_results || []).map((result: any) => ({
      url: result.link,
      title: result.title,
      snippet: result.snippet,
      source: 'serp' as const
    }));
  } catch (error) {
    console.error('Error fetching SERP backlinks:', error);
    return [];
  }
}

function calculateDAScore(backlinksCount: number): number {
  // Calculate DA using the formula: DA = 20 * log10(backlinks + 1)
  const daScore = 20 * Math.log10(backlinksCount + 1);
  
  // Cap the score at 100
  return Math.min(100, Math.round(daScore));
}

function removeDuplicateBacklinks(backlinks: BacklinkResult[]): BacklinkResult[] {
  const seen = new Set<string>();
  return backlinks.filter(backlink => {
    const normalizedUrl = backlink.url.toLowerCase();
    if (seen.has(normalizedUrl)) {
      return false;
    }
    seen.add(normalizedUrl);
    return true;
  });
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Get backlinks from both sources
    const [googleBacklinks, serpBacklinks] = await Promise.all([
      getGoogleBacklinks(url),
      getSerpBacklinks(url)
    ]);

    // Combine and deduplicate backlinks
    const allBacklinks = removeDuplicateBacklinks([...googleBacklinks, ...serpBacklinks]);
    
    // Calculate DA score
    const daScore = calculateDAScore(allBacklinks.length);

    return NextResponse.json({
      backlinks: allBacklinks,
      daScore,
      totalBacklinks: allBacklinks.length,
      sources: {
        google: googleBacklinks.length,
        serp: serpBacklinks.length
      }
    });
  } catch (error) {
    console.error('Error processing backlinks:', error);
    return NextResponse.json(
      { error: 'Failed to analyze backlinks' },
      { status: 500 }
    );
  }
} 