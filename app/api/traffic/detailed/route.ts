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
      `https://api.similarweb.com/v1/website/${domain}/traffic-and-engagement/visits?api_key=${SIMILARWEB_API_KEY}&start_date=2023-01&end_date=2023-12&granularity=monthly`
    );

    if (!response.ok) {
      throw new Error(`Historical data API request failed: ${response.statusText}`);
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
      `https://api.similarweb.com/v1/website/${domain}/competitors/competitors?api_key=${SIMILARWEB_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Competitor data API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.competitors || [];
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

    const cleanDomain = url.replace(/^(https?:\/\/)?(www\.)?/, '');
    
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