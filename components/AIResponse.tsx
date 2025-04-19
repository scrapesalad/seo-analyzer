'use client';

import React from 'react';
import { CopyIcon, ThumbsUpIcon, ThumbsDownIcon } from 'lucide-react';
import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'prism-react-renderer';
import { vscDarkPlus } from '../lib/code-theme';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function AIResponse({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'like' | 'dislike' | null>(null);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <Markdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ node, ...props }) => <h2 className="text-xl font-semibold mt-6 mb-3" {...props} />,
                  h2: ({ node, ...props }) => <h3 className="text-lg font-semibold mt-5 mb-2" {...props} />,
                  h3: ({ node, ...props }) => <h4 className="text-base font-medium mt-4 mb-2" {...props} />,
                  p: ({ node, ...props }) => <p className="my-3 leading-relaxed" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1 my-3" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal pl-5 space-y-1 my-3" {...props} />,
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline ? (
                      <div className="relative">
                        <SyntaxHighlighter
                          language={match?.[1] || 'text'}
                          style={vscDarkPlus}
                          PreTag="div"
                          className="rounded-md text-sm my-4"
                          showLineNumbers={false}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(String(children));
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          className="absolute top-2 right-2 p-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition-opacity opacity-0 group-hover:opacity-100"
                        >
                          {copied ? 'Copied!' : <CopyIcon className="w-3 h-3" />}
                        </button>
                      </div>
                    ) : (
                      <code className="bg-gray-100 dark:bg-gray-800 rounded px-1.5 py-0.5 text-sm font-mono">
                        {children}
                      </code>
                    );
                  },
                  table: ({ node, ...props }) => (
                    <div className="overflow-x-auto my-4">
                      <table className="min-w-full border-collapse" {...props} />
                    </div>
                  ),
                  th: ({ node, ...props }) => (
                    <th className="border-b border-gray-200 dark:border-gray-700 px-4 py-2 text-left font-medium bg-gray-50 dark:bg-gray-800" {...props} />
                  ),
                  td: ({ node, ...props }) => (
                    <td className="border-b border-gray-100 dark:border-gray-700 px-4 py-2" {...props} />
                  ),
                  blockquote: ({ node, ...props }) => (
                    <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic text-gray-600 dark:text-gray-300 my-3" {...props} />
                  ),
                }}
              >
                {content}
              </Markdown>
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