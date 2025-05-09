"use client";
import React, { useState, useEffect, Suspense } from "react";
import {
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  XAxis,
  YAxis,
  Bar
} from 'recharts';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import Avatar from './components/Avatar';
import { AIResponse } from '../components/AIResponse';

// Lazy load the charts
const LineChart = dynamic(() => import('recharts').then(mod => mod.LineChart), { ssr: false });
const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false });

export default function SEOAnalyzer() {
  const [url, setUrl] = useState("");
  const [keyword, setKeyword] = useState("");
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [backlinks, setBacklinks] = useState<number | null>(null);
  const [daScore, setDaScore] = useState<number | null>(null);
  const [trafficData, setTrafficData] = useState<any>(null);
  const [detailedTrafficData, setDetailedTrafficData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [urlHistory, setUrlHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [seoData, setSeoData] = useState<any>(null);
  const [backlinkData, setBacklinkData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [visibleBacklinks, setVisibleBacklinks] = useState(20);

  // Load URL history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('urlHistory');
    if (savedHistory) {
      setUrlHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save URL to history when analysis is completed
  const saveToHistory = (url: string) => {
    const formattedUrl = formatUrl(url);
    const newHistory = [formattedUrl, ...urlHistory.filter(u => u !== formattedUrl)].slice(0, 5);
    setUrlHistory(newHistory);
    localStorage.setItem('urlHistory', JSON.stringify(newHistory));
  };

  // Function to format URL with proper protocol
  const formatUrl = (inputUrl: string) => {
    let formattedUrl = inputUrl.trim();
    
    // Remove any existing protocol
    formattedUrl = formattedUrl.replace(/^(https?:\/\/)?(www\.)?/, '');
    
    // Add https:// protocol
    formattedUrl = `https://${formattedUrl}`;
    
    return formattedUrl;
  };

  // Handle URL input change
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputUrl = e.target.value;
    setUrl(inputUrl);
  };

  const selectHistoryUrl = (historyUrl: string) => {
    setUrl(historyUrl);
    setShowHistory(false);
  };

  const checkBacklinks = async () => {
    setIsLoading(true);
    setError(null);
    setBacklinkData(null);
    setDaScore(null);

    const formattedUrl = formatUrl(url);
    saveToHistory(url);

    try {
      console.log('Making backlinks request...');
      const backlinkResponse = await fetch("/api/backlinks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: formattedUrl }),
      });

      console.log('Backlinks response status:', backlinkResponse.status);
      if (!backlinkResponse.ok) {
        const errorData = await backlinkResponse.json();
        console.error('Backlinks analysis error:', errorData);
        throw new Error(errorData.error || 'Failed to analyze backlinks');
      }

      const backlinkData = await backlinkResponse.json();
      console.log('Backlinks data received:', backlinkData);
      setBacklinkData(backlinkData);
      setBacklinks(backlinkData.backlinks?.length || 0);
      setDaScore(backlinkData.daScore);

    } catch (error) {
      console.error('Backlink analysis error:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze backlinks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!url) {
      setError('Please enter a URL');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Format the URL
      let formattedUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        formattedUrl = `https://${url}`;
      }

      // Save to history
      const historyEntry = {
        url: formattedUrl,
        keyword: keyword || '',
        timestamp: new Date().toISOString(),
      };
      
      const existingHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
      const updatedHistory = [historyEntry, ...existingHistory].slice(0, 10);
      localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
      setUrlHistory(updatedHistory.map(entry => entry.url));

      // Add timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout

      try {
        // Make API requests
        const [analysisResponse, backlinksResponse] = await Promise.all([
          fetch("/api/analyze", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: formattedUrl,
              keyword: keyword || '',
            }),
            signal: controller.signal
          }),
          fetch("/api/backlinks", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: formattedUrl,
            }),
            signal: controller.signal
          }),
        ]);

        clearTimeout(timeoutId);

        if (!analysisResponse.ok) {
          const errorData = await analysisResponse.json();
          throw new Error(errorData.error || errorData.details || 'Failed to fetch analysis');
        }

        if (!backlinksResponse.ok) {
          console.warn('Backlinks data not available');
        } else {
          const backlinksData = await backlinksResponse.json();
          setBacklinks(backlinksData.backlinks?.length || 0);
          setBacklinkData(backlinksData);
        }

        const analysisData = await analysisResponse.json();
        setAnalysis(analysisData.result);
      } catch (error) {
        if (error.name === 'AbortError') {
          throw new Error('Analysis timed out. Please try again with a simpler URL or different keyword.');
        }
        throw error;
      }
      
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze the URL. Please try again.');
      setAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAnalysis = (text: string) => {
    // Handle non-sectioned content (old format)
    if (!text.includes('---')) {
      return text.split('\n').map((line, index) => {
        if (line.startsWith('**') && line.endsWith('**')) {
          return (
            <h3 key={index} className="text-xl font-bold mb-4">
              {line.replace(/\*\*/g, '')}
            </h3>
          );
        } else if (line.startsWith('- ')) {
          return (
            <li key={index} className="ml-6 mb-2 text-gray-700">
              {line.substring(2)}
            </li>
          );
        } else if (line.match(/^\d+\./)) {
          return (
            <li key={index} className="ml-6 mb-2 text-gray-700">
              {line.substring(line.indexOf('.') + 2)}
            </li>
          );
        }
        return line ? (
          <p key={index} className="mb-3 text-gray-700">
            {line}
          </p>
        ) : null;
      });
    }

    // Handle sectioned content (new format)
    const sections = text.split('---').filter(section => section.trim());
    
    return sections.map((section, index) => {
      const lines = section.split('\n').filter(line => line.trim());
      const title = lines[0].trim();
      const content = lines.slice(1);

      if (title.includes('SEO Analysis Report')) {
        return (
          <div key={index} className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span role="img" aria-label="magnifying glass">🔍</span>
              SEO Analysis Report
            </h2>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="mb-4">
                <span className="font-semibold">URL:</span>{' '}
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {url.replace(/^(https?:\/\/)?(www\.)?/, '')}
                </a>
              </div>
              {keyword && (
                <>
                  <div className="mb-4">
                    <span className="font-semibold">Target Keyword:</span>{' '}
                    <span className="text-gray-800">"{keyword}"</span>
                  </div>
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-800 mb-3">Keyword Optimization Opportunities:</h4>
                    <ul className="list-disc pl-6 space-y-2">
                      {content
                        .filter(line => line.startsWith('- ') && !line.includes('URL:') && !line.includes('Target Keyword:'))
                        .map((item, i) => (
                          <li key={i} className="text-gray-700">
                            {item.replace(/^-\s*/, '')}
                          </li>
                        ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      }

      if (title.includes('Keyword Strategy')) {
        return (
          <div key={index} className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span role="img" aria-label="chart">📊</span>
              Keyword Strategy
            </h2>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Search Intent Analysis:</h4>
                <ul className="list-disc pl-6 space-y-2">
                  {content
                    .filter(line => line.startsWith('- ') && line.includes('search intent'))
                    .map((item, i) => (
                      <li key={i} className="text-gray-700">
                        {item.replace(/^-\s*/, '')}
                      </li>
                    ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Content Opportunities:</h4>
                <ul className="space-y-2">
                  {content
                    .filter(line => line.startsWith('✅'))
                    .map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-700">
                        <span className="text-green-500">✅</span>
                        <span>{item.replace(/^✅\s*/, '')}</span>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        );
      }

      if (title.includes('Priority Fixes')) {
        return (
          <div key={index} className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span role="img" aria-label="rocket">🚀</span>
              Top Priority Fixes
            </h2>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <ol className="list-decimal pl-6 space-y-3">
                {content
                  .filter(line => /^\d+\./.test(line))
                  .map((line, i) => (
                    <li key={i} className="text-gray-800">
                      {line.replace(/^\d+\.\s*/, '')}
                    </li>
                  ))}
              </ol>
              <div className="mt-6">
                <h4 className="font-semibold text-gray-800 mb-3">Tools to Help:</h4>
                <ul className="list-disc pl-6 space-y-2">
                  {content
                    .filter(line => line.startsWith('- ') && line.includes('tool'))
                    .map((item, i) => (
                      <li key={i} className="text-gray-700">
                        {item.replace(/^-\s*/, '')}
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
        );
      }

      // Regular sections
      return (
        <div key={index} className="mb-8">
          <h3 className="text-xl font-bold mb-4">
            {title.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '')}
          </h3>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            {content.map((line, i) => {
              // Handle Assessment section
              if (line.includes('**Assessment:**')) {
                return (
                  <div key={i} className="mb-6">
                    <h4 className="font-semibold text-gray-800 mb-3">Assessment:</h4>
                    <ul className="list-disc pl-6 space-y-2">
                      {content
                        .slice(i + 1)
                        .filter(l => l.startsWith('-'))
                        .map((item, j) => (
                          <li key={j} className="text-gray-700">
                            {item.replace(/^-\s*/, '').replace(/\*\*/g, '')}
                          </li>
                        ))}
                    </ul>
                  </div>
                );
              }
              
              // Handle Action Items section
              if (line.includes('**Action Items:**')) {
                return (
                  <div key={i} className="mb-6">
                    <h4 className="font-semibold text-gray-800 mb-3">Action Items:</h4>
                    <ul className="space-y-2">
                      {content
                        .slice(i + 1)
                        .filter(l => l.startsWith('✅'))
                        .map((item, j) => (
                          <li key={j} className="flex items-start gap-2 text-gray-700">
                            <span className="text-green-500">✅</span>
                            <span>{item.replace(/^✅\s*/, '').replace(/\*\*/g, '')}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                );
              }

              // Handle regular lines that aren't part of Assessment or Action Items
              if (!line.includes('**Assessment:**') && !line.includes('**Action Items:**')) {
                return line ? (
                  <p key={i} className="mb-3 text-gray-700">
                    {line.replace(/\*\*/g, '')}
                  </p>
                ) : null;
              }

              return null;
            })}
          </div>
        </div>
      );
    });
  };

  const renderTrendIndicator = (value: number, isPercentage: boolean = false) => {
    const isPositive = value > 0;
    const color = isPositive ? 'text-green-600' : 'text-red-600';
    const symbol = isPositive ? '↑' : '↓';
    return (
      <span className={`${color} font-medium`}>
        {symbol} {Math.abs(value).toFixed(1)}{isPercentage ? '%' : ''}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-2 sm:p-4 md:p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-3 py-4 sm:px-4 md:px-6">
          <div className="flex items-center justify-center gap-4 mb-4 sm:mb-6 md:mb-8">
            <Avatar isThinking={isLoading} />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-center">
              AI SEO + Backlink Analyzer
            </h1>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Website URL
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={url}
                  onChange={handleUrlChange}
                  onFocus={() => setShowHistory(true)}
                  onBlur={() => setTimeout(() => setShowHistory(false), 200)}
                  placeholder="example.com"
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                  required
                />
                {urlHistory.length > 0 && showHistory && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200">
                    <div className="py-1">
                      <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                        Recent URLs
                      </div>
                      {urlHistory.map((historyUrl, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => selectHistoryUrl(historyUrl)}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                        >
                          {historyUrl.replace(/^(https?:\/\/)?(www\.)?/, '')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">
                No need to include 'https://' - we'll add it automatically
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Target Keyword (Optional)
              </label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g., 'best SEO tools'"
                className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-3 sm:py-4 rounded-lg font-medium disabled:opacity-50 transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Analyzing...
                </span>
              ) : "Check SEO & Backlinks"}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error analyzing website
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          {analysis && (
            <div className="mt-6 sm:mt-8">
              <AIResponse content={analysis} />
            </div>
          )}

          {/* Backlinks Section */}
          {backlinks !== null && (
            <div className="mt-4 sm:mt-6 p-4 sm:p-6 bg-gray-50 rounded-xl">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                <span role="img" aria-label="link">🔗</span>
                Backlinks Analysis
              </h2>
              
              {/* Stats Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
                  <div className="text-xs sm:text-sm text-gray-600">Total Backlinks Found</div>
                  <div className="text-xl sm:text-2xl font-bold text-red-600">{backlinks}</div>
                  {backlinkData?.sources && (
                    <div className="mt-2 text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Google: {backlinkData.sources.google || 0}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          SERP: {backlinkData.sources.serp || 0}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {backlinkData?.backlinks && backlinkData.backlinks.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-base sm:text-lg font-medium text-gray-700 mb-2">
                    Backlink Details
                  </h3>
                  {backlinkData.backlinks.slice(0, visibleBacklinks).map((link: any, i: number) => (
                    <div key={i} className="p-3 sm:p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-3 sm:gap-4">
                        <div className="flex-grow">
                          <a 
                            href={link.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-base sm:text-lg font-medium text-red-600 hover:text-red-800 hover:underline break-all"
                          >
                            {link.title || link.url}
                          </a>
                          <div className="text-xs sm:text-sm text-gray-600 mt-2">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-gray-500">{link.url}</span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                link.source === 'google' 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {link.source === 'google' ? 'Google Search' : 'SERP API'}
                              </span>
                            </div>
                            {link.snippet && (
                              <p className="mt-2 text-gray-700">
                                {link.snippet}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {backlinkData.backlinks.length > visibleBacklinks && (
                    <div className="flex justify-center mt-4">
                      <button
                        onClick={() => setVisibleBacklinks(prev => prev + 20)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        See More Backlinks
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <p>No backlinks found for this domain.</p>
                  <p className="text-sm mt-1">This could be because the website is new or not yet indexed by search engines.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 