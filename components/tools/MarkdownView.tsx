"use client"

import ReactMarkdown, { type Components } from "react-markdown"

/**
 * Lightweight markdown renderer for streaming LLM output. Plain Tailwind
 * classes only (no @tailwindcss/typography dep) so it can render inside
 * tight tool layouts without bloating bundle.
 */
const components: Components = {
  h1: (props) => (
    <h1 className="text-foreground mt-4 mb-2 text-xl font-semibold tracking-tight" {...props} />
  ),
  h2: (props) => (
    <h2 className="text-foreground mt-4 mb-2 text-lg font-semibold tracking-tight" {...props} />
  ),
  h3: (props) => (
    <h3 className="text-foreground mt-3 mb-1.5 text-base font-semibold tracking-tight" {...props} />
  ),
  p: (props) => <p className="text-foreground/90 my-2 leading-relaxed" {...props} />,
  strong: (props) => <strong className="text-foreground font-semibold" {...props} />,
  em: (props) => <em className="text-foreground/90 italic" {...props} />,
  ul: (props) => <ul className="my-2 list-disc space-y-1 pl-5" {...props} />,
  ol: (props) => <ol className="my-2 list-decimal space-y-1 pl-5" {...props} />,
  li: (props) => <li className="text-foreground/90 leading-relaxed" {...props} />,
  a: ({ href, ...props }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline-offset-3 hover:underline"
      {...props}
    />
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = /^language-/.test(className ?? "")
    if (isBlock) {
      return (
        <code className={`block font-mono text-xs ${className ?? ""}`} {...props}>
          {children}
        </code>
      )
    }
    return (
      <code
        className="bg-muted text-foreground rounded px-1 py-0.5 font-mono text-[0.85em]"
        {...props}
      >
        {children}
      </code>
    )
  },
  pre: (props) => (
    <pre
      className="border-border/40 my-3 overflow-auto rounded-md border bg-zinc-950 p-4 text-zinc-100"
      {...props}
    />
  ),
  blockquote: (props) => (
    <blockquote
      className="border-primary/40 text-muted-foreground my-3 border-l-2 pl-4 italic"
      {...props}
    />
  ),
  hr: () => <hr className="border-border/40 my-4" />,
  table: (props) => (
    <div className="my-3 overflow-x-auto">
      <table className="text-foreground/90 min-w-full text-left text-sm" {...props} />
    </div>
  ),
  th: (props) => (
    <th
      className="border-border/40 border-b px-3 py-2 text-xs font-semibold tracking-wider uppercase"
      {...props}
    />
  ),
  td: (props) => <td className="border-border/30 border-b px-3 py-2 text-sm" {...props} />,
}

export function MarkdownView({ text }: { text: string }) {
  return (
    <div className="text-sm">
      <ReactMarkdown components={components}>{text}</ReactMarkdown>
    </div>
  )
}
