import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { url } = await req.json();

  // Option 1: Google Custom Search API (Free)
  const res = await fetch(
    `https://www.googleapis.com/customsearch/v1?q=link:${url}&key=${process.env.GOOGLE_API_KEY}&cx=${process.env.GOOGLE_CSE_ID}`
  );

  // Option 2: OpenLinkProfiler (Free)
  // const res = await fetch(`http://openlinkprofiler.org/getBacklinks?url=${url}`);

  const data = await res.json();
  return NextResponse.json(data);
}