import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getCache, setCache } from '@/lib/cache';
import { callTogetherAPI, analyzeSEO } from '@/lib/ai';

if (!process.env.TOGETHER_API_KEY) {
  console.error('TOGETHER_API_KEY is not defined in environment variables');
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
  console.log('Received analyze request');
  try {
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return NextResponse.json(
        { 
          error: 'Invalid request format',
          details: error instanceof Error ? error.message : 'Unknown error',
          status: 'error',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    const { url, keyword } = body;
    console.log('Request data:', { url, keyword });
    
    if (!url) {
      console.error('URL is required');
      return NextResponse.json(
        { 
          error: 'URL is required',
          status: 'error',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Generate cache key
    const cacheKey = `seo:${url}:${keyword || ''}`;
    console.log('Cache key:', cacheKey);
    
    // Check cache
    const cached = await getCache(cacheKey);
    if (cached) {
      console.log('Returning cached result');
      return NextResponse.json(cached);
    }

    console.log('Getting fresh analysis');
    // Get fresh analysis
    let analysis;
    try {
      analysis = await analyzeSEO(url, keyword);
      console.log('Analysis completed successfully');
    } catch (error) {
      console.error('Error in analyzeSEO:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to analyze SEO');
    }
    
    if (!analysis) {
      console.error('Analysis result is empty');
      throw new Error('Empty analysis result');
    }
    
    // Cache the result
    const result = { analysis };
    try {
      await setCache(cacheKey, result);
      console.log('Result cached successfully');
    } catch (cacheError) {
      console.warn('Failed to cache result:', cacheError);
      // Continue even if caching fails
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error analyzing SEO:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze SEO';
    const errorDetails = error instanceof Error ? error.stack : undefined;
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        status: 'error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 