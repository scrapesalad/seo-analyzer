'use client';

import React from 'react';
import { CopyIcon, ThumbsUpIcon, ThumbsDownIcon } from 'lucide-react';
import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface CodeComponentProps {
  node: any;
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
}

interface AIResponseProps {
  content: string;
}

export function AIResponse({ content }: AIResponseProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sections = content.split('---').filter(section => section.trim());

  return (
    <div className="group w-full border-b border-gray-100 dark:border-gray-800">
      <div className="flex flex-col p-4">
        {/* AI Avatar Header */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
            AI
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Response Content */}
            <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
              {sections.map((section, index) => {
                const lines = section.split('\n').filter(line => line.trim());
                const title = lines[0].trim();
                const content = lines.slice(1);

                // Skip empty sections
                if (!title) return null;

                // Handle the main title section
                if (title.includes('SEO Analysis for')) {
                  return (
                    <div key={index} className="mb-8">
                      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        <span role="img" aria-label="robot">🤖</span>
                        {title.replace(/\*\*/g, '').replace(/^#+\s*/, '')}
                      </h2>
                      <div className="bg-white p-6 rounded-lg border border-gray-200">
                        {content.map((line, i) => (
                          <p key={i} className="mb-3 text-gray-700">
                            {line.replace(/\*\*/g, '').replace(/^#+\s*/, '')}
                          </p>
                        ))}
                      </div>
                    </div>
                  );
                }

                // Handle semantic keywords section
                if (title.includes('Semantic Keywords')) {
                  return (
                    <div key={index} className="mb-8">
                      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                        <span role="img" aria-label="keywords">🔑</span>
                        Top 10 Semantic Keywords
                      </h2>
                      <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {content
                            .filter(line => line.trim().startsWith('- '))
                            .map((keyword, i) => (
                              <div key={i} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                <span className="text-red-600 font-medium">{i + 1}.</span>
                                <span className="text-gray-700">{keyword.replace(/^-\s*/, '')}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  );
                }

                // Handle numbered sections
                if (title.match(/^\d+\./)) {
                  const sectionNumber = title.match(/^\d+\./)?.[0];
                  const sectionTitle = title.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').replace(/^#+\s*/, '');
                  const emoji = {
                    'Content Depth and Quality': '📝',
                    'URL Structure': '🔗',
                    'H1 Title Tag': '🏷️',
                    'Internal Links': '↪️',
                    'Meta Description': '📄',
                    'Readability': '📖',
                    'Additional SEO & UX Recommendations': '🚀',
                    'Final Verdict': '✅'
                  }[sectionTitle] || '📌';

                  return (
                    <div key={index} className="mb-8">
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <span role="img" aria-label="section icon">{emoji}</span>
                        {sectionTitle}
                      </h3>
                      <div className="bg-white p-6 rounded-lg border border-gray-200">
                        {content.map((line, i) => {
                          // Handle Analysis section
                          if (line.includes('**Analysis:**')) {
                            return (
                              <div key={i} className="mb-6">
                                <h4 className="font-bold text-gray-800 mb-3">Analysis:</h4>
                                <ul className="list-disc pl-6 space-y-2">
                                  {content
                                    .slice(i + 1)
                                    .filter(l => l.startsWith('-'))
                                    .map((item, j) => (
                                      <li key={j} className="text-gray-700">
                                        {item.replace(/^-\s*/, '').replace(/\*\*/g, '').replace(/^#+\s*/, '')}
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
                                <h4 className="font-bold text-gray-800 mb-3">Action Items:</h4>
                                <ul className="space-y-2">
                                  {content
                                    .slice(i + 1)
                                    .filter(l => l.startsWith('✅'))
                                    .map((item, j) => (
                                      <li key={j} className="flex items-start gap-2 text-gray-700">
                                        <span className="text-green-500">✅</span>
                                        <span>{item.replace(/^✅\s*/, '').replace(/\*\*/g, '').replace(/^#+\s*/, '')}</span>
                                      </li>
                                    ))}
                                </ul>
                              </div>
                            );
                          }

                          // Handle numbered recommendations
                          if (line.match(/^\d+\./)) {
                            return (
                              <div key={i} className="mb-4">
                                <ol className="list-decimal pl-6 space-y-2">
                                  {content
                                    .slice(i)
                                    .filter(l => l.match(/^\d+\./))
                                    .map((item, j) => (
                                      <li key={j} className="text-gray-700">
                                        {item.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').replace(/^#+\s*/, '')}
                                      </li>
                                    ))}
                                </ol>
                              </div>
                            );
                          }

                          // Handle regular lines that aren't part of special sections
                          if (!line.includes('**Analysis:**') && !line.includes('**Action Items:**') && !line.match(/^\d+\./)) {
                            return line ? (
                              <p key={i} className="mb-3 text-gray-700">
                                {line.replace(/\*\*/g, '').replace(/^#+\s*/, '')}
                              </p>
                            ) : null;
                          }

                          return null;
                        })}
                      </div>
                    </div>
                  );
                }

                // Handle regular sections
                return (
                  <div key={index} className="mb-8">
                    <h3 className="text-xl font-bold mb-4">
                      {title.replace(/\*\*/g, '').replace(/^#+\s*/, '')}
                    </h3>
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      {content.map((line, i) => (
                        <p key={i} className="mb-3 text-gray-700">
                          {line.replace(/\*\*/g, '').replace(/^#+\s*/, '')}
                        </p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Feedback & Copy Buttons */}
            <div className="flex items-center gap-2 mt-4 text-sm text-gray-500 dark:text-gray-400">
              <button
                onClick={() => setFeedback(feedback === 'like' ? null : 'like')}
                className={`p-1 rounded-md ${feedback === 'like' ? 'text-green-500 bg-green-50 dark:bg-green-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                <ThumbsUpIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setFeedback(feedback === 'dislike' ? null : 'dislike')}
                className={`p-1 rounded-md ${feedback === 'dislike' ? 'text-red-500 bg-red-50 dark:bg-red-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                <ThumbsDownIcon className="w-4 h-4" />
              </button>
              <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <CopyIcon className="w-4 h-4" />
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 