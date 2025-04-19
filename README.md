# AI SEO + Backlink Analyzer

AI-powered SEO analysis and backlink checker tool. Get comprehensive website analysis, backlink insights, and actionable recommendations.

## Live Demo

Visit [https://seo-analyzer-opal.vercel.app](https://seo-analyzer-opal.vercel.app) to try it out.

## Features

- AI-powered SEO analysis using Together AI
- Backlink analysis using Google Custom Search and SERP API
- Domain Authority (DA) score calculation
- Caching with Vercel KV (Redis)
- Modern UI with Tailwind CSS
- Real-time analysis and recommendations

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your API keys:

```bash
TOGETHER_API_KEY=your-together-api-key
GOOGLE_API_KEY=your-google-api-key
GOOGLE_CX=your-google-cx
SERP_API_KEY=your-serp-api-key
NEXT_PUBLIC_APP_URL=https://seo-analyzer-opal.vercel.app
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## Deployment

The project is deployed on Vercel with the following features:
- Vercel KV for caching
- Edge Functions for API routes
- Environment variables for API keys

## License

MIT 