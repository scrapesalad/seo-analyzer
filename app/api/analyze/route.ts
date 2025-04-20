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
  try {
    // Log request details
    console.log('Received analyze request:', {
      method: request.method,
      headers: Object.fromEntries(request.headers),
      url: request.url
    });

    // Validate API key first
    if (!process.env.TOGETHER_API_KEY) {
      console.error('TOGETHER_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log('Request body:', JSON.stringify(body, null, 2));
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: error instanceof Error ? error.message : 'Unknown parsing error'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate required fields
    if (!body.url) {
      console.error('Missing required field: url');
      return new Response(
        JSON.stringify({ error: 'Missing required field: url' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL format
    try {
      new URL(body.url);
    } catch (error) {
      console.error('Invalid URL format:', body.url);
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check cache with retries
    const cacheKey = `analyze:${body.url}:${body.keyword || ''}`;
    let cachedResult;
    let cacheAttempts = 3;

    while (cacheAttempts > 0) {
      try {
        cachedResult = await getCache(cacheKey);
        if (cachedResult) {
          console.log('Cache hit for:', cacheKey);
          return new Response(
            JSON.stringify({ 
              result: cachedResult,
              cached: true 
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
        break;
      } catch (error) {
        console.warn(`Cache read attempt ${4 - cacheAttempts} failed:`, error);
        cacheAttempts--;
        if (cacheAttempts > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    console.log('Cache miss, performing analysis for:', cacheKey);

    // Perform analysis with validation
    try {
      const result = await analyzeSEO(body.url, body.keyword);
      
      // Basic content validation
      if (!result || typeof result !== 'string') {
        console.error('Invalid analysis result:', {
          resultType: typeof result,
          isEmpty: !result
        });
        throw new Error('Analysis failed: empty or invalid response');
      }

      const trimmedResult = result.trim();
      if (!trimmedResult) {
        console.error('Empty analysis result');
        throw new Error('Analysis failed: empty response');
      }

      // Validate minimum content requirements
      const contentStats = {
        length: trimmedResult.length,
        hasMarkdown: trimmedResult.includes('#'),
        sections: trimmedResult.split('#').length - 1,
        bulletPoints: trimmedResult.split('-').length - 1,
        firstLine: trimmedResult.split('\n')[0]
      };

      console.log('Content validation:', contentStats);

      // Minimum content requirements
      const isValidContent = 
        contentStats.length > 500 && // Minimum length
        contentStats.hasMarkdown && // Has markdown formatting
        contentStats.sections >= 1 && // Has at least one section
        contentStats.bulletPoints >= 3 && // Has some bullet points
        contentStats.firstLine.toLowerCase().includes('seo analysis'); // Has proper title

      if (!isValidContent) {
        console.error('Content validation failed:', {
          ...contentStats,
          preview: trimmedResult.substring(0, 200)
        });
        throw new Error('Analysis failed: incomplete or invalid content structure');
      }
      
      // Cache the result with retries
      let cacheSuccess = false;
      let cacheSetAttempts = 3;

      while (cacheSetAttempts > 0) {
        try {
          await setCache(cacheKey, trimmedResult);
          console.log('Successfully cached result for:', cacheKey);
          cacheSuccess = true;
          break;
        } catch (error) {
          console.warn(`Cache write attempt ${4 - cacheSetAttempts} failed:`, error);
          cacheSetAttempts--;
          if (cacheSetAttempts > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      console.log('Analysis completed successfully');
      return new Response(
        JSON.stringify({ 
          result: trimmedResult,
          cached: false,
          cacheStatus: cacheSuccess ? 'saved' : 'failed'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Analysis failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.constructor.name : typeof error,
        stack: error instanceof Error ? error.stack : undefined
      });

      // Determine if this is a temporary failure that the client should retry
      const isTemporaryError = error instanceof Error && (
        error.message.includes('rate limit') ||
        error.message.includes('timeout') ||
        error.message.includes('network') ||
        error.message.includes('temporary')
      );

      return new Response(
        JSON.stringify({ 
          error: 'Analysis failed',
          details: error instanceof Error ? error.message : 'Unknown error during analysis',
          retryable: isTemporaryError
        }),
        { 
          status: isTemporaryError ? 503 : 500, 
          headers: {
            'Content-Type': 'application/json',
            ...(isTemporaryError ? { 'Retry-After': '5' } : {})
          } 
        }
      );
    }
  } catch (error) {
    console.error('Unexpected error in analyze endpoint:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.constructor.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined
    });
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 