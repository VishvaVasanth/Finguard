import React from 'react';
import Markdown from 'react-markdown';

interface FormattedMarkdownProps {
  content: string;
  className?: string;
}

export const FormattedMarkdown: React.FC<FormattedMarkdownProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Normalize Unicode bullets like "• " to standard markdown "- "
  const normalized = content
    .replace(/^[ \t]*[•●▪]\s*/gm, '- ')
    .replace(/\n\s*[•●▪]\s*/g, '\n- ');

  return (
    <div className={`prose-neutral text-sm leading-relaxed ${className}`}>
      <Markdown
        components={{
          strong: ({ children }) => (
            <strong className="font-bold text-[#17233C]">{children}</strong>
          ),
          p: ({ children }) => (
            <p className="mb-2.5 last:mb-0 leading-relaxed text-slate-800">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="my-2 space-y-1.5 list-disc pl-5 text-slate-800">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 space-y-1.5 list-decimal pl-5 text-slate-800">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed pl-0.5">{children}</li>
          ),
          code: ({ children }) => (
            <code className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-xs text-indigo-700 font-medium">
              {children}
            </code>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-3 border-indigo-300 pl-3 italic text-slate-600 my-2 text-xs">
              {children}
            </blockquote>
          ),
          h1: ({ children }) => (
            <h1 className="text-base font-bold text-[#17233C] mt-3 mb-1.5">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-bold text-[#17233C] mt-2.5 mb-1">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs font-bold text-[#17233C] mt-2 mb-1 uppercase tracking-wider">{children}</h3>
          ),
        }}
      >
        {normalized}
      </Markdown>
    </div>
  );
};
