"use client";

import Link from "next/link";
import { SearchIcon } from "@/components/icons";

interface HeaderProps {
  query: string;
  onQueryChange: (value: string) => void;
}

export function Header({ query, onQueryChange }: HeaderProps) {
  return (
    <header className="fixed top-0 inset-x-0 z-10 glass border-b border-white/5">
      <div className="flex h-16 items-center justify-between px-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white font-bold text-lg shadow-lg shadow-orange-900/20 group-hover:scale-105 transition-transform">
              V
            </div>
            <span className="font-semibold tracking-tight text-white/90 group-hover:text-white transition-colors">
              Vantage
            </span>
          </Link>
          <div className="h-6 w-px bg-white/10" />
          <nav className="flex items-center gap-1 bg-stone-900/50 p-1 rounded-lg border border-white/5">
            <button className="px-3 py-1.5 rounded-md bg-white/10 text-xs font-medium text-white shadow-sm">
              Whiteboards
            </button>
            <button className="px-3 py-1.5 rounded-md text-stone-400 hover:text-white text-xs font-medium hover:bg-white/5 transition-all">
              Archives
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 group-focus-within:text-orange-500 transition-colors w-[18px] h-[18px]" />
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search whiteboards..."
              className="h-9 w-64 rounded-full border border-stone-800 bg-stone-900/50 pl-10 pr-4 text-sm text-stone-200 outline-none focus:border-orange-500/50 focus:bg-stone-900 transition-all placeholder:text-stone-600"
            />
          </div>

          <button className="h-9 w-9 rounded-full bg-gradient-to-br from-stone-800 to-stone-900 border border-white/10 flex items-center justify-center text-stone-400 hover:text-white hover:border-white/20 transition-all relative">
            <span className="sr-only">Notifications</span>
            <div className="h-2 w-2 rounded-full bg-orange-500 absolute top-2 right-2 border-2 border-stone-900" />
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </button>

          <div className="h-9 w-9 rounded-full bg-orange-600 border border-orange-400/20 text-xs flex items-center justify-center font-medium shadow-lg shadow-orange-900/20 ring-2 ring-transparent hover:ring-orange-500/20 transition-all cursor-pointer">
            PB
          </div>
        </div>
      </div>
    </header>
  );
}
