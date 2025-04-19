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
- Google Custom Search API

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# AI APIs
ANTHROPIC_API_KEY=your_anthropic_api_key
TOGETHER_API_KEY=your_together_api_key

# Search APIs
SERPAPI_KEY=your_serpapi_key
GOOGLE_API_KEY=your_google_api_key
GOOGLE_CX=your_google_custom_search_engine_id
```

### Getting API Keys

1. **Anthropic API Key**
   - Sign up at [Anthropic](https://console.anthropic.com/)
   - Create an API key in your account settings

2. **Together API Key**
   - Sign up at [Together](https://www.together.xyz/)
   - Get your API key from the dashboard

3. **SERP API Key**
   - Sign up at [SERP API](https://serpapi.com/)
   - Get your API key from the dashboard

4. **Google API Keys**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable the Custom Search API
   - Create API credentials
   - Create a Custom Search Engine at [Google Programmable Search](https://programmablesearchengine.google.com/)
   - Get your Search Engine ID (cx)

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