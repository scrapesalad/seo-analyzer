# AI SEO + Backlink Analyzer

A powerful SEO analysis tool that combines AI-powered insights with comprehensive backlink and traffic analysis.

## Features

- AI-powered SEO analysis using Claude and Mixtral
- Backlink analysis and domain authority scoring
- Traffic analysis with historical data
- Mobile-friendly interface
- URL history tracking
- Real-time competitor analysis

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Recharts for data visualization
- Anthropic Claude API
- Together AI API
- SERP API
- SimilarWeb API

## Environment Variables

Create a `.env.local` file with the following variables:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key
TOGETHER_API_KEY=your_together_api_key
SERPAPI_KEY=your_serpapi_key
```

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

This project is configured for deployment on Vercel. Simply push to GitHub and import into Vercel.

## License

MIT 