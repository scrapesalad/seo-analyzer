import { NextResponse } from "next/server";

if (!process.env.SIMILARWEB_API_KEY) {
  throw new Error('SIMILARWEB_API_KEY is not defined in environment variables');
}

const SIMILARWEB_API_KEY = process.env.SIMILARWEB_API_KEY;

interface TrafficData {
  globalRank: number;
  countryRank: number;
  category: string;
  totalVisits: number;
  bounceRate: number;
  pageViews: number;
  avgVisitDuration: number;
  lastUpdated: string;
}

async function getSimilarWebData(domain: string): Promise<TrafficData> {
  try {
    // Remove protocol and www from domain
    const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '');
    
    // Get website overview data
    const response = await fetch(
      `https://api.similarweb.com/v1/website/${cleanDomain}/general-data/all?api_key=${SIMILARWEB_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`SimilarWeb API request failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Get traffic data
    const trafficResponse = await fetch(
      `https://api.similarweb.com/v1/website/${cleanDomain}/traffic-and-engagement/visits?api_key=${SIMILARWEB_API_KEY}`
    );

    if (!trafficResponse.ok) {
      throw new Error(`SimilarWeb traffic API request failed: ${trafficResponse.statusText}`);
    }

    const trafficData = await trafficResponse.json();

    // Get engagement metrics
    const engagementResponse = await fetch(
      `https://api.similarweb.com/v1/website/${cleanDomain}/traffic-and-engagement/engagement-metrics?api_key=${SIMILARWEB_API_KEY}`
    );

    if (!engagementResponse.ok) {
      throw new Error(`SimilarWeb engagement API request failed: ${engagementResponse.statusText}`);
    }

    const engagementData = await engagementResponse.json();

    // Get the most recent month's data
    const lastMonth = trafficData.visits?.slice(-1)[0] || {};
    const lastEngagement = engagementData.slice(-1)[0] || {};

    return {
      globalRank: data.GlobalRank?.Rank || 0,
      countryRank: data.CountryRank?.Rank || 0,
      category: data.Category || 'Unknown',
      totalVisits: lastMonth.visits || 0,
      bounceRate: lastEngagement.bounce_rate || 0,
      pageViews: lastEngagement.pages_per_visit || 0,
      avgVisitDuration: lastEngagement.average_visit_duration || 0,
      lastUpdated: lastMonth.date || new Date().toISOString().slice(0, 7)
    };
  } catch (error) {
    console.error('Error fetching SimilarWeb data:', error);
    // Return default values if API fails
    return {
      globalRank: 0,
      countryRank: 0,
      category: 'Unknown',
      totalVisits: 0,
      bounceRate: 0,
      pageViews: 0,
      avgVisitDuration: 0,
      lastUpdated: new Date().toISOString().slice(0, 7)
    };
  }
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

    const trafficData = await getSimilarWebData(url);

    return NextResponse.json({
      ...trafficData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in traffic route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch traffic data' },
      { status: 500 }
    );
  }
} 