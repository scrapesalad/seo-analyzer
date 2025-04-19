import { NextResponse } from "next/server";

if (!process.env.GOOGLE_API_KEY) {
  throw new Error('GOOGLE_API_KEY is not defined in environment variables');
}

if (!process.env.GOOGLE_CX) {
  throw new Error('GOOGLE_CX is not defined in environment variables');
}

if (!process.env.SERP_API_KEY) {
  throw new Error('SERP_API_KEY is not defined in environment variables');
}

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
  const baseScore = 15;
  const backlinkScore = Math.min(60, Math.log10(backlinksCount + 1) * 15);
  const trustFactor = Math.min(20, Math.sqrt(backlinksCount) * 2);
  return Math.round(baseScore + backlinkScore + trustFactor);
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
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Get backlinks from both sources in parallel
    const [googleBacklinks, serpBacklinks] = await Promise.all([
      getGoogleBacklinks(url),
      getSerpBacklinks(url)
    ]);
    
    // Combine and remove duplicates
    const allBacklinks = removeDuplicateBacklinks([...googleBacklinks, ...serpBacklinks]);
    
    // Calculate DA score based on total unique backlinks
    const daScore = calculateDAScore(allBacklinks.length);

    return NextResponse.json({
      backlinks: allBacklinks,
      daScore,
      totalBacklinks: allBacklinks.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in backlinks route:', error);
    return NextResponse.json(
      { error: 'Failed to analyze backlinks' },
      { status: 500 }
    );
  }
} 