import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { url } = await req.json();

  // Estimate DA (fake logic)
  const backlinks = await getBacklinkCount(url); // From Step 1
  const daScore = Math.min(100, Math.log10(backlinks + 1) * 20); // Fake formula

  return NextResponse.json({ daScore });
}

// Helper: Count backlinks
async function getBacklinkCount(url: string) {
  const res = await fetch(`https://api.serpapi.com/search?q=link:${url}&api_key=${process.env.SERPAPI_KEY}`);
  const data = await res.json();
  return data.search_information?.total_results || 0;
}