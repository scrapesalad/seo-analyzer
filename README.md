# SEO Analyzer

A Next.js application for analyzing website SEO performance.

## Features

- SEO analysis using AI
- Backlink analysis
- URL formatting and validation
- Mobile-responsive design
- Real-time processing feedback

## API Integrations

- Together API (Mixtral)

## Environment Variables

Create a `.env` file with the following variables:

```env
# OpenAI API
OPENAI_API_KEY=your-openai-api-key

# Together API
TOGETHER_API_KEY=your-together-api-key

# App URL (for OG image generation)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables
4. Run the development server:
   ```bash
   npm run dev
   ```

## Deployment

The application can be deployed to Vercel with automatic deployments from GitHub. 