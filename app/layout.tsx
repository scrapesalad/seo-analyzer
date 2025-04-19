import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://seo-analyzer.vercel.app'),
  title: {
    default: "AI SEO Analyzer - Free Website Analysis Tool",
    template: "%s | AI SEO Analyzer"
  },
  description: "Free AI-powered SEO analyzer tool. Get comprehensive website analysis, backlink insights, and traffic data. Improve your search rankings with detailed SEO recommendations powered by Claude AI.",
  keywords: ["SEO analyzer", "website analysis", "backlink checker", "SEO tool", "free SEO analysis", "AI SEO", "website optimization", "search engine optimization", "Claude AI", "domain authority", "traffic analysis", "SEO recommendations"],
  authors: [{ name: "SEO Analyzer Team" }],
  creator: "SEO Analyzer",
  publisher: "SEO Analyzer",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    title: "AI SEO Analyzer - Free Website Analysis Tool",
    description: "Free AI-powered SEO analyzer tool. Get comprehensive website analysis, backlink insights, and traffic data.",
    siteName: "AI SEO Analyzer",
    url: "https://seo-analyzer.vercel.app",
    images: [{
      url: "https://seo-analyzer.vercel.app/og-image.png",
      width: 1200,
      height: 630,
      alt: "AI SEO Analyzer"
    }]
  },
  twitter: {
    card: "summary_large_image",
    title: "AI SEO Analyzer - Free Website Analysis Tool",
    description: "Free AI-powered SEO analyzer tool. Get comprehensive website analysis, backlink insights, and traffic data.",
    images: ["https://seo-analyzer.vercel.app/og-image.png"],
    creator: "@seoanalyzer"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: "your-google-site-verification",
  },
  alternates: {
    canonical: "https://seo-analyzer.vercel.app"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
      </head>
      <body className={inter.className}>
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
} 