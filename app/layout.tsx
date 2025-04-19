import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://seo-analyzer-opal.vercel.app'),
  title: {
    template: '%s | AI SEO Analyzer',
    default: 'AI SEO + Backlink Analyzer',
  },
  description: 'AI-powered SEO analysis and backlink checker tool',
  keywords: ["SEO analyzer", "website analysis", "backlink checker", "SEO tools", "Claude AI", "domain authority", "SEO recommendations"],
  authors: [{ name: "SEO Analyzer Team" }],
  creator: "SEO Analyzer",
  publisher: "SEO Analyzer",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'AI SEO + Backlink Analyzer',
    description: 'AI-powered SEO analysis and backlink checker tool',
    url: "https://seo-analyzer-opal.vercel.app",
    siteName: "AI SEO Analyzer",
    images: [
      {
        url: "https://seo-analyzer-opal.vercel.app/og-image.png",
        width: 1200,
        height: 630,
      }
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI SEO + Backlink Analyzer",
    description: "AI-powered SEO analysis and backlink checker tool",
    images: ["https://seo-analyzer-opal.vercel.app/og-image.png"],
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
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },
  alternates: {
    canonical: "https://seo-analyzer-opal.vercel.app"
  },
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