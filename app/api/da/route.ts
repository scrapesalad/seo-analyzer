import { NextResponse } from "next/server";

if (!process.env.SERP_API_KEY) {
  throw new Error('SERP_API_KEY is not defined in environment variables');
}

const SERP_API_KEY = process.env.SERP_API_KEY;

interface SerpApiResponse {
  search_information?: {
    total_results?: number;
  };
  organic_results?: Array<{
    link: string;
    title: string;
    snippet: string;
    position?: number;
  }>;
  error?: string;
}

interface BacklinkMetrics {
  totalBacklinks: number;
  uniqueDomains: Set<string>;
  rootDomainBacklinks: Set<string>;
  qualityMetrics: {
    highAuthority: number;  // Backlinks from .edu, .gov, etc.
    dofollow: number;
    homepage: number;
    contextual: number;
  };
}

async function getBacklinkData(domain: string) {
  try {
    // Clean the domain for search
    const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '');
    
    // Get backlinks from SERP API
    const response = await fetch(
      `https://serpapi.com/search.json?engine=google&q=link:${encodeURIComponent(cleanDomain)}&api_key=${SERP_API_KEY}&num=100`
    );

    if (!response.ok) {
      throw new Error(`SERP API request failed: ${response.statusText}`);
    }

    const data: SerpApiResponse = await response.json();

    if (data.error) {
      throw new Error(`SERP API error: ${data.error}`);
    }

    // Process backlink metrics
    const metrics: BacklinkMetrics = {
      totalBacklinks: data.search_information?.total_results || 0,
      uniqueDomains: new Set(),
      rootDomainBacklinks: new Set(),
      qualityMetrics: {
        highAuthority: 0,
        dofollow: 0,
        homepage: 0,
        contextual: 0
      }
    };

    // Analyze each backlink
    (data.organic_results || []).forEach(result => {
      const linkDomain = new URL(result.link).hostname;
      const rootDomain = linkDomain.split('.').slice(-2).join('.');
      
      metrics.uniqueDomains.add(linkDomain);
      metrics.rootDomainBacklinks.add(rootDomain);

      // Check for high authority domains
      if (linkDomain.endsWith('.edu') || linkDomain.endsWith('.gov')) {
        metrics.qualityMetrics.highAuthority++;
      }

      // Check for homepage links
      if (result.link.split('/').length <= 4) {
        metrics.qualityMetrics.homepage++;
      }

      // Estimate dofollow links (most links are dofollow)
      metrics.qualityMetrics.dofollow++;

      // Check for contextual links (links with relevant anchor text/context)
      if (result.snippet && result.snippet.toLowerCase().includes(cleanDomain.toLowerCase())) {
        metrics.qualityMetrics.contextual++;
      }
    });

    return {
      metrics,
      backlinks: data.organic_results || []
    };
  } catch (error) {
    console.error('Error fetching backlink data:', error);
    throw error;
  }
}

// Get search visibility score
async function getSearchVisibility(domain: string): Promise<number> {
  try {
    const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '');
    const response = await fetch(
      `https://serpapi.com/search.json?engine=google&q=site:${encodeURIComponent(cleanDomain)}&api_key=${SERP_API_KEY}&num=100`
    );

    if (!response.ok) return 0;

    const data: SerpApiResponse = await response.json();
    const totalResults = data.search_information?.total_results || 0;
    const topPositions = (data.organic_results || [])
      .filter(result => result.position && result.position <= 10).length;

    return Math.min(100, (topPositions / 10) * 100);
  } catch (error) {
    console.error('Error getting search visibility:', error);
    return 0;
  }
}

// Calculate DA score based on multiple factors
async function calculateDAScore(domain: string, metrics: BacklinkMetrics): Promise<number> {
  // Base score (0-100)
  let score = 0;

  // 1. Backlink Profile (40% of total score)
  const backlinkScore = Math.min(40, calculateBacklinkScore(metrics));
  
  // 2. Domain Age Factor (10% of total score)
  const ageScore = await calculateDomainAgeScore(domain);
  
  // 3. Search Visibility (20% of total score)
  const visibilityScore = await getSearchVisibility(domain);
  
  // 4. Root Domain Authority (15% of total score)
  const rootDomainScore = Math.min(15, Math.log10(metrics.rootDomainBacklinks.size + 1) * 5);
  
  // 5. Link Quality (15% of total score)
  const qualityScore = calculateLinkQualityScore(metrics);

  // Combine all scores
  score = backlinkScore + (ageScore * 0.1) + (visibilityScore * 0.2) + rootDomainScore + qualityScore;

  // Normalize score to 0-100 range
  return Math.min(100, Math.max(1, Math.round(score)));
}

function calculateBacklinkScore(metrics: BacklinkMetrics): number {
  const totalBacklinks = metrics.totalBacklinks;
  const uniqueDomains = metrics.uniqueDomains.size;
  
  // Calculate logarithmic scores to handle large numbers
  const backlinkScore = Math.log10(totalBacklinks + 1) * 10;
  const domainScore = Math.log10(uniqueDomains + 1) * 8;
  
  return Math.min(40, backlinkScore + domainScore);
}

async function calculateDomainAgeScore(domain: string): Promise<number> {
  try {
    // Use WHOIS API or similar to get domain age
    // For now, return a default score
    return 50;
  } catch (error) {
    console.error('Error calculating domain age score:', error);
    return 30;
  }
}

function calculateLinkQualityScore(metrics: BacklinkMetrics): number {
  const {highAuthority, dofollow, homepage, contextual} = metrics.qualityMetrics;
  const totalLinks = metrics.totalBacklinks;
  
  if (totalLinks === 0) return 0;
  
  // Calculate quality ratios
  const authorityRatio = (highAuthority / totalLinks) * 5;
  const dofollowRatio = (dofollow / totalLinks) * 4;
  const homepageRatio = (homepage / totalLinks) * 3;
  const contextualRatio = (contextual / totalLinks) * 3;
  
  return Math.min(15, authorityRatio + dofollowRatio + homepageRatio + contextualRatio);
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

    const { metrics, backlinks } = await getBacklinkData(url);
    const daScore = await calculateDAScore(url, metrics);

    return NextResponse.json({
      daScore,
      metrics: {
        totalBacklinks: metrics.totalBacklinks,
        uniqueDomains: metrics.uniqueDomains.size,
        rootDomains: metrics.rootDomainBacklinks.size,
        qualityMetrics: metrics.qualityMetrics
      },
      backlinks: backlinks.slice(0, 10), // Return top 10 backlinks
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in DA route:', error);
    return NextResponse.json(
      { error: 'Failed to calculate DA score' },
      { status: 500 }
    );
  }
}