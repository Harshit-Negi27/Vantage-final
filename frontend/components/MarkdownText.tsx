"use client";

import React from "react";

interface MarkdownTextProps {
  content: string;
  className?: string;
}

/**
 * Simple markdown renderer for chat messages.
 * Supports: **bold**, *italic*, `code`, headers, lists, links
 */
export function MarkdownText({ content, className = "" }: MarkdownTextProps) {
  if (!content) return null;

  // Strip any remaining action/status markers
  const cleanContent = content
    .replace(/<<<ACTION:[\s\S]*?:ACTION>>>/g, '')
    .replace(/<<<STATUS:[\s\S]*?:STATUS>>>/g, '')
    .trim();

  // Process the content into React elements
  const processContent = (text: string): React.ReactNode[] => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];
    let inList = false;

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc pl-4 my-1 space-y-0.5">
            {listItems.map((item, i) => (
              <li key={i}>{processInline(item)}</li>
            ))}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };

    lines.forEach((line, lineIndex) => {
      // Check for list items
      const listMatch = line.match(/^[-*]\s+(.+)$/);
      if (listMatch) {
        inList = true;
        listItems.push(listMatch[1]);
        return;
      } else if (inList) {
        flushList();
      }

      // Headers
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={lineIndex} className="text-xs font-bold text-stone-200 mt-2 mb-1">
            {processInline(line.slice(4))}
          </h3>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={lineIndex} className="text-sm font-bold text-stone-100 mt-2 mb-1">
            {processInline(line.slice(3))}
          </h2>
        );
      } else if (line.startsWith('# ')) {
        elements.push(
          <h1 key={lineIndex} className="text-base font-bold text-white mt-2 mb-1">
            {processInline(line.slice(2))}
          </h1>
        );
      } else if (line.startsWith('> ')) {
        // Blockquote
        elements.push(
          <blockquote key={lineIndex} className="border-l-2 border-stone-600 pl-2 my-1 text-stone-500 italic">
            {processInline(line.slice(2))}
          </blockquote>
        );
      } else if (line.trim() === '') {
        // Empty line
        elements.push(<div key={lineIndex} className="h-1" />);
      } else {
        // Regular paragraph
        elements.push(
          <p key={lineIndex} className="my-0.5">
            {processInline(line)}
          </p>
        );
      }
    });

    // Flush any remaining list items
    flushList();

    return elements;
  };

  const processInline = (text: string): React.ReactNode => {
    // Process inline markdown elements
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Bold + Italic: ***text***
      let match = remaining.match(/^\*\*\*(.+?)\*\*\*/);
      if (match) {
        parts.push(<strong key={key++} className="font-bold italic text-stone-100">{match[1]}</strong>);
        remaining = remaining.slice(match[0].length);
        continue;
      }

      // Bold: **text**
      match = remaining.match(/^\*\*(.+?)\*\*/);
      if (match) {
        parts.push(<strong key={key++} className="font-bold text-stone-100">{match[1]}</strong>);
        remaining = remaining.slice(match[0].length);
        continue;
      }

      // Italic: *text* or _text_
      match = remaining.match(/^\*([^*]+?)\*/) || remaining.match(/^_([^_]+?)_/);
      if (match) {
        parts.push(<em key={key++} className="italic text-stone-300">{match[1]}</em>);
        remaining = remaining.slice(match[0].length);
        continue;
      }

      // Code: `code`
      match = remaining.match(/^`([^`]+?)`/);
      if (match) {
        parts.push(
          <code key={key++} className="bg-stone-800 text-orange-400 px-1 py-0.5 rounded text-[10px] font-mono">
            {match[1]}
          </code>
        );
        remaining = remaining.slice(match[0].length);
        continue;
      }

      // Link: [text](url)
      match = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
      if (match) {
        parts.push(
          <a key={key++} href={match[2]} target="_blank" rel="noopener noreferrer"
            className="text-blue-400 hover:underline">
            {match[1]}
          </a>
        );
        remaining = remaining.slice(match[0].length);
        continue;
      }

      // Tool Card: [[TOOL:type:title]]
      // Example: [[TOOL:create_chart:AAPL Chart]]
      match = remaining.match(/^\[\[TOOL:([^:]+):([^\]]+)\]\]/);
      if (match) {
        const [_, type, title] = match;
        // Map types to icons/colors
        let icon = "⚡";
        let color = "text-blue-400";
        let bg = "bg-blue-500/10";
        let border = "border-blue-500/20";
        let label = "Action";

        if (type.includes("chart")) { icon = "📈"; color = "text-green-400"; bg = "bg-green-500/10"; border = "border-green-500/20"; label = "Created Chart"; }
        else if (type.includes("research")) { icon = "🕵️‍♂️"; color = "text-purple-400"; bg = "bg-purple-500/10"; border = "border-purple-500/20"; label = "Researching"; }
        else if (type.includes("company")) { icon = "🏢"; color = "text-orange-400"; bg = "bg-orange-500/10"; border = "border-orange-500/20"; label = "Added Company"; }
        else if (type.includes("metric")) { icon = "📊"; color = "text-cyan-400"; bg = "bg-cyan-500/10"; border = "border-cyan-500/20"; label = "Added Metric"; }
        else if (type.includes("map")) { icon = "🧠"; color = "text-pink-400"; bg = "bg-pink-500/10"; border = "border-pink-500/20"; label = "Generated Map"; }

        parts.push(
          <div key={key++} className={`my-2 flex items-center gap-3 p-2 rounded-lg border ${bg} ${border}`}>
            <div className={`p-1.5 rounded-md bg-stone-900/50 ${color}`}>{icon}</div>
            <div className="flex-1 min-w-0">
              <div className={`text-[10px] font-bold uppercase tracking-wider ${color} opacity-70`}>{label}</div>
              <div className="text-xs text-stone-200 font-medium truncate">{title}</div>
            </div>
            <div className="text-[10px] text-stone-500 font-mono">DONE</div>
          </div>
        );
        remaining = remaining.slice(match[0].length);
        continue;
      }

      // Status Card: [[STATUS:message]]
      match = remaining.match(/^\[\[STATUS:([^\]]+)\]\]/);
      if (match) {
        const [_, msg] = match;
        parts.push(
          <div key={key++} className="my-1.5 flex items-center gap-2 text-xs text-stone-500 animate-pulse">
            <div className="w-1.5 h-1.5 rounded-full bg-stone-500" />
            <span className="italic">{msg}</span>
          </div>
        );
        remaining = remaining.slice(match[0].length);
        continue;
      }

      // No match - take the next character
      const nextSpecial = remaining.search(/[\*_`\[]/);
      if (nextSpecial === -1) {
        parts.push(remaining);
        break;
      } else if (nextSpecial === 0) {
        // Special char at start but no match - treat as regular text
        parts.push(remaining[0]);
        remaining = remaining.slice(1);
      } else {
        parts.push(remaining.slice(0, nextSpecial));
        remaining = remaining.slice(nextSpecial);
      }
    }

    return parts.length === 1 ? parts[0] : <>{parts}</>;
  };

  return (
    <div className={`markdown-content ${className}`}>
      {cleanContent ? processContent(cleanContent) : null}
    </div>
  );
}
