import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';

const MarkdownMessage = ({ content }) => {
    const [copiedCode, setCopiedCode] = useState(null);

    const copyToClipboard = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedCode(id);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    return (
        <div className="markdown-content">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        const codeString = String(children).replace(/\n$/, '');
                        const codeId = Math.random().toString(36).substr(2, 9);

                        return !inline && match ? (
                            <div className="relative group my-4">
                                <div className="absolute right-2 top-2 z-10">
                                    <button
                                        onClick={() => copyToClipboard(codeString, codeId)}
                                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gpt-surface/90 hover:bg-gpt-hover 
                                                 border border-gpt-borderBright rounded-lg text-xs text-gpt-textDim 
                                                 hover:text-white transition-all shadow-md opacity-0 group-hover:opacity-100"
                                        title="Copy code"
                                    >
                                        {copiedCode === codeId ? (
                                            <>
                                                <Check size={12} className="text-emerald-400" />
                                                <span className="text-emerald-400">Copied!</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={12} />
                                                <span>Copy</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                                <SyntaxHighlighter
                                    style={vscDarkPlus}
                                    language={match[1]}
                                    PreTag="div"
                                    customStyle={{
                                        margin: 0,
                                        borderRadius: '0.75rem',
                                        padding: '1.25rem',
                                        fontSize: '0.875rem',
                                        lineHeight: '1.6',
                                        backgroundColor: '#1a1a1a',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                    }}
                                    {...props}
                                >
                                    {codeString}
                                </SyntaxHighlighter>
                            </div>
                        ) : (
                            <code
                                className="px-1.5 py-0.5 bg-gpt-surface border border-gpt-border rounded text-gpt-accent text-[0.9em] font-mono"
                                {...props}
                            >
                                {children}
                            </code>
                        );
                    },
                    p: ({ children }) => (
                        <p className="mb-4 last:mb-0 leading-7">{children}</p>
                    ),
                    a: ({ href, children }) => (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gpt-accent hover:text-gpt-accentLight underline underline-offset-2 transition-colors"
                        >
                            {children}
                        </a>
                    ),
                    ul: ({ children }) => (
                        <ul className="mb-4 ml-6 list-disc space-y-1">{children}</ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="mb-4 ml-6 list-decimal space-y-1">{children}</ol>
                    ),
                    li: ({ children }) => (
                        <li className="leading-7">{children}</li>
                    ),
                    h1: ({ children }) => (
                        <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0 text-white">{children}</h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className="text-xl font-bold mb-3 mt-5 first:mt-0 text-white">{children}</h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="text-lg font-semibold mb-2 mt-4 first:mt-0 text-white">{children}</h3>
                    ),
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-gpt-accent pl-4 my-4 italic text-gpt-textDim">
                            {children}
                        </blockquote>
                    ),
                    hr: () => (
                        <hr className="my-6 border-gpt-border" />
                    ),
                    table: ({ children }) => (
                        <div className="overflow-x-auto my-4">
                            <table className="min-w-full border border-gpt-border rounded-lg">
                                {children}
                            </table>
                        </div>
                    ),
                    th: ({ children }) => (
                        <th className="px-4 py-2 bg-gpt-surface border-b border-gpt-border text-left font-semibold">
                            {children}
                        </th>
                    ),
                    td: ({ children }) => (
                        <td className="px-4 py-2 border-b border-gpt-border">
                            {children}
                        </td>
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownMessage;
