import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getCache, setCache } from '@/lib/cache';
import { callTogetherAPI, analyzeSEO } from '@/lib/ai';

if (!process.env.TOGETHER_API_KEY) {
  throw new Error('TOGETHER_API_KEY is not defined in environment variables');
}

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;

// Type definitions for API responses
interface SERPResult {
  link: string;
  title: string;
  snippet: string;
}

interface SERPResponse {
  organic_results?: SERPResult[];
  answer_box?: any;
}

interface GoogleSearchInformation {
  totalResults: string;
  searchTime: number;
}

interface GoogleResponse {
  searchInformation?: GoogleSearchInformation;
  items?: any[];
}

export async function POST(request: Request) {
  try {
    const { url, keyword } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Generate cache key
    const cacheKey = `seo:${url}:${keyword || ''}`;
    
    // Check cache
    const cached = await getCache(cacheKey);
    if (cached) {
      return NextResponse.json(JSON.parse(cached));
    }

    // Get fresh analysis
    const analysis = await analyzeSEO(url, keyword);
    
    // Cache the result
    await setCache(cacheKey, JSON.stringify({ analysis }));
    
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Error analyzing SEO:', error);
    return NextResponse.json(
      { error: 'Failed to analyze SEO' },
      { status: 500 }
    );
  }
} 