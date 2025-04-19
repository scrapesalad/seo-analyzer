import { NextResponse } from "next/server";

if (!process.env.SIMILARWEB_API_KEY) {
  throw new Error('SIMILARWEB_API_KEY is not defined in environment variables');
}

const SIMILARWEB_API_KEY = process.env.SIMILARWEB_API_KEY;

interface HistoricalData {
  date: string;
  visits: number;
  bounceRate: number;
  pageViews: number;
  avgVisitDuration: number;
}

interface CompetitorData {
  domain: string;
  globalRank: number;
  totalVisits: number;
  category: string;
}

interface DetailedTrafficData {
  historical: HistoricalData[];
  competitors: CompetitorData[];
  trends: {
    visitsChange: number;
    bounceRateChange: number;
    pageViewsChange: number;
    durationChange: number;
  };
}

async function getHistoricalData(domain: string): Promise<HistoricalData[]> {
  try {
    const response = await fetch(
      `https://api.similarweb.com/v1/website/${domain}/total-traffic-and-engagement/visits?api_key=${SIMILARWEB_API_KEY}&start_date=2023-01&end_date=2023-12&granularity=monthly`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Historical data API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      return [];
    }

    const data = await response.json();
    return data.visits || [];
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return [];
  }
}

async function getCompetitorData(domain: string): Promise<CompetitorData[]> {
  try {
    const response = await fetch(
      `https://api.similarweb.com/v1/website/${domain}/competitors/domains?api_key=${SIMILARWEB_API_KEY}`,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Competitor data API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      return [];
    }

    const data = await response.json();
    return data.domains?.map((domain: any) => ({
      domain: domain.domain,
      globalRank: domain.globalRank || 0,
      totalVisits: domain.totalVisits || 0,
      category: domain.category || 'Unknown'
    })) || [];
  } catch (error) {
    console.error('Error fetching competitor data:', error);
    return [];
  }
}

function calculateTrends(historical: HistoricalData[]) {
  if (historical.length < 2) {
    return {
      visitsChange: 0,
      bounceRateChange: 0,
      pageViewsChange: 0,
      durationChange: 0
    };
  }

  const current = historical[historical.length - 1];
  const previous = historical[historical.length - 2];

  return {
    visitsChange: ((current.visits - previous.visits) / previous.visits) * 100,
    bounceRateChange: current.bounceRate - previous.bounceRate,
    pageViewsChange: current.pageViews - previous.pageViews,
    durationChange: current.avgVisitDuration - previous.avgVisitDuration
  };
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

    // Clean and format the domain
    const cleanDomain = url
      .replace(/^(https?:\/\/)?(www\.)?/, '')
      .split('/')[0] // Remove any paths
      .toLowerCase();
    
    const [historical, competitors] = await Promise.all([
      getHistoricalData(cleanDomain),
      getCompetitorData(cleanDomain)
    ]);

    const trends = calculateTrends(historical);

    return NextResponse.json({
      historical,
      competitors: competitors.slice(0, 5), // Return top 5 competitors
      trends,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in detailed traffic route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch detailed traffic data' },
      { status: 500 }
    );
  }
} 