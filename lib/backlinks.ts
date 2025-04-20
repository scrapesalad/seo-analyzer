import axios from 'axios';

interface Backlink {
  sourceUrl: string;
  targetUrl: string;
  anchorText: string;
  domainAuthority: number;
  pageAuthority: number;
}

interface BacklinksResponse {
  backlinks: Backlink[];
}

export async function getBacklinks(url: string): Promise<Backlink[]> {
  try {
    // Using Google Search API for backlink analysis
    const response = await axios.get<BacklinksResponse>(`https://api.example.com/backlinks?url=${encodeURIComponent(url)}`, {
      headers: {
        'Authorization': `Bearer ${process.env.BACKLINKS_API_KEY}`
      }
    });

    return response.data.backlinks || [];
  } catch (error) {
    console.error('Backlinks API error:', error);
    return [];
  }
} 