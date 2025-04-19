'use client';

import React from 'react';
import { CopyIcon, ThumbsUpIcon, ThumbsDownIcon, ChevronDownIcon } from 'lucide-react';
import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface CodeProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

interface AIResponseProps {
  content: string;
}

export function AIResponse({ content }: AIResponseProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);
  const [showKeywords, setShowKeywords] = useState(false);
  const keywordsSection = content.match(/---\nSemantic Keywords\n---\n([\s\S]*?)(?=\n\n|$)/);
  const keywords = keywordsSection ? keywordsSection[1].split('\n').filter(line => line.trim()) : [];
  const mainContent = keywordsSection ? content.replace(keywordsSection[0], '') : content;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sections = content.split('---').filter(section => section.trim());
  
  const components: Components = {
    code({ node, inline, className, children, ...props }: CodeProps) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={vscDarkPlus as any}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };

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
              <ReactMarkdown
                components={components}
              >
                {mainContent}
              </ReactMarkdown>
            </div>

            {keywords.length > 0 && (
              <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
                <button
                  onClick={() => setShowKeywords(!showKeywords)}
                  className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <span>Semantic Keywords</span>
                  <ChevronDownIcon className={`w-4 h-4 transition-transform ${showKeywords ? 'rotate-180' : ''}`} />
                </button>
                
                {showKeywords && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {keywords.map((keyword, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          {index + 1}.
                        </span>{' '}
                        <span className="text-gray-900 dark:text-gray-100">
                          {keyword.replace(/^\d+\.\s*/, '')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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