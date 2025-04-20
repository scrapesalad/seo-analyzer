'use client';

import React, { useState } from 'react';
import { CopyIcon, ThumbsUpIcon, ThumbsDownIcon } from 'lucide-react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AIResponseProps {
  content: string;
}

export function AIResponse({ content }: AIResponseProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);

  // Helper function to get emoji for section
  const getEmoji = (title: string) => {
    const emojiMap: { [key: string]: string } = {
      'Content Depth and Quality': '📝',
      'URL Structure': '🔗',
      'H1 Title Tag': '🏷️',
      'Internal Links': '↪️',
      'Meta Description': '📄',
      'Readability': '📖',
      'Priority Recommendations': '🚀',
      'Semantic Keywords': '🔑'
    };
    return emojiMap[title] || '📌';
  };

  // Custom components for markdown rendering
  const components = {
    h1: ({ children }) => (
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 pb-4 border-b border-gray-200">
        <span role="img" aria-label="magnifying glass">🔍</span>
        {children}
      </h1>
    ),
    h2: ({ children }) => {
      const title = children?.toString() || '';
      return (
        <h2 className="text-xl font-bold mb-4 mt-8 flex items-center gap-2 text-gray-800">
          <span role="img" aria-label="section icon">{getEmoji(title)}</span>
          {children}
        </h2>
      );
    },
    p: ({ children }) => {
      const content = children?.toString() || '';
      if (content.startsWith('Action Items:')) {
        return (
          <h3 className="font-semibold text-gray-800 mb-3 mt-4">
            {content}
          </h3>
        );
      }
      if (content.startsWith('Final Verdict:')) {
        return (
          <h3 className="font-semibold text-gray-800 mb-3 mt-6">
            {content}
          </h3>
        );
      }
      return (
        <p className="mb-4 text-gray-700 leading-relaxed">{children}</p>
      );
    },
    ul: ({ children }) => (
      <ul className="list-none space-y-2 mb-6">{children}</ul>
    ),
    li: ({ children }) => {
      const content = children?.toString() || '';
      if (content.startsWith('✅')) {
        return (
          <li className="flex items-start gap-2 text-gray-700 pl-4">
            <span className="text-green-500 flex-shrink-0">✅</span>
            <span>{content.replace('✅', '').trim()}</span>
          </li>
        );
      }
      return (
        <li className="flex items-start gap-2 text-gray-700 pl-4">
          <span className="text-gray-400 flex-shrink-0">•</span>
          <span>{content}</span>
        </li>
      );
    },
    ol: ({ children }) => (
      <ol className="list-decimal pl-6 space-y-3 mb-6 text-gray-700">{children}</ol>
    )
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
            <Markdown 
              remarkPlugins={[remarkGfm]}
              components={components}
            >
              {content}
            </Markdown>
          </div>
        </div>

        {/* Feedback & Copy Buttons */}
        <div className="flex items-center gap-2 p-4 border-t border-gray-100">
          <button
            onClick={() => setFeedback(feedback === 'like' ? null : 'like')}
            className={`p-1 rounded-md ${feedback === 'like' ? 'text-green-500 bg-green-50' : 'hover:bg-gray-100'}`}
          >
            <ThumbsUpIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setFeedback(feedback === 'dislike' ? null : 'dislike')}
            className={`p-1 rounded-md ${feedback === 'dislike' ? 'text-red-500 bg-red-50' : 'hover:bg-gray-100'}`}
          >
            <ThumbsDownIcon className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-gray-200 mx-1"></div>
          <CopyToClipboard 
            text={content}
            onCopy={() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            <button className="flex items-center gap-1 p-1 rounded-md hover:bg-gray-100">
              <CopyIcon className="w-4 h-4" />
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </CopyToClipboard>
        </div>
      </div>
    </div>
  );
} 