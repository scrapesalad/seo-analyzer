import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

interface MozDAResponse {
  da: number | null;
  error?: string;
}

export async function POST(req: Request) {
  const { url } = await req.json();
  
  if (!url) {
    return NextResponse.json(
      { error: 'URL is required' },
      { status: 400 }
    );
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Set a reasonable timeout
    await page.setDefaultNavigationTimeout(30000);
    
    // Navigate to Moz Link Explorer
    await page.goto('https://moz.com/link-explorer', { waitUntil: 'networkidle0' });
    
    // Wait for and fill the URL input
    await page.waitForSelector('input[name="url"]');
    await page.type('input[name="url"]', url);
    
    // Click the submit button
    await page.click('button[type="submit"]');
    
    // Wait for the DA score to appear
    try {
      await page.waitForSelector('.moz-metrics-column .score-value', { timeout: 10000 });
      
      // Extract the DA score
      const daText = await page.$eval('.moz-metrics-column .score-value', el => el.textContent);
      const da = daText ? parseInt(daText.trim()) : null;
      
      return NextResponse.json({ da } as MozDAResponse);
    } catch (error) {
      console.error('Error extracting DA score:', error);
      return NextResponse.json(
        { error: 'Failed to extract DA score from Moz' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error scraping Moz:', error);
    return NextResponse.json(
      { error: 'Failed to scrape Moz for DA score' },
      { status: 500 }
    );
  } finally {
    await browser.close();
  }
} 