import Link from "next/link";

function ArrowRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function NetworkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="16" y="16" width="6" height="6" rx="1" />
      <rect x="2" y="16" width="6" height="6" rx="1" />
      <rect x="9" y="2" width="6" height="6" rx="1" />
      <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
      <path d="M12 12V8" />
    </svg>
  );
}

function BrainIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
    </svg>
  );
}

function ZapIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-50 selection:bg-orange-500/30 selection:text-orange-200 font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-stone-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 text-white font-bold shadow-lg shadow-orange-900/20">
              V
            </div>
            <span className="font-semibold tracking-tight text-lg">Vantage</span>
          </div>
          <Link
            href="/home"
            className="group flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-stone-950 hover:bg-stone-200 transition-all hover:pr-5"
          >
            Try it out
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </nav>

      <main className="pt-32 pb-16">
        {/* Hero Section */}
        <section className="px-6 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[500px] bg-orange-500/10 blur-[100px] rounded-full -z-10 pointer-events-none" />
          
          <div className="mx-auto max-w-4xl text-center animate-fade-in-up">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1]">
              AI-Powered <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-200">Research</span> <br className="hidden md:block" />
              on a Canvas
            </h1>
            
            <p className="mx-auto max-w-2xl text-lg text-stone-400 mb-10 leading-relaxed">
              Vantage is a visual research workspace where you can organize ideas as nodes, 
              connect them together, and chat with AI to explore topics deeply. 
              Think of it as a whiteboard that thinks with you.
            </p>
            
            <Link
              href="/home"
              className="inline-flex h-14 px-10 rounded-full bg-orange-600 hover:bg-orange-500 text-white font-medium text-lg items-center justify-center transition-all shadow-lg shadow-orange-900/20 gap-2"
            >
              Open Workspace
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
          </div>
          
          {/* Hero Visual Mockup */}
          <div className="mt-20 mx-auto max-w-5xl relative animate-fade-in-up [animation-delay:200ms]">
            <div className="w-full aspect-[16/10] rounded-xl border border-white/10 bg-stone-900/40 backdrop-blur-sm overflow-hidden shadow-2xl relative">
              {/* Fake UI Header */}
              <div className="h-10 border-b border-white/5 flex items-center px-4 gap-2 bg-stone-900/60">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-stone-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-stone-700" />
                  <div className="w-2.5 h-2.5 rounded-full bg-stone-700" />
                </div>
                <div className="ml-4 h-5 px-3 rounded text-xs bg-stone-800 flex items-center text-stone-500 font-mono">Research Board</div>
              </div>
              
              {/* Fake Canvas Grid */}
              <div className="absolute inset-x-0 bottom-0 top-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]">
                
                {/* Node 1 */}
                <div className="absolute top-[15%] left-[20%] bg-stone-800 border border-stone-700 rounded-lg p-3 w-56 shadow-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    <span className="text-xs font-medium text-stone-200">Market Analysis</span>
                  </div>
                  <div className="text-[11px] text-stone-500 leading-relaxed">
                    Exploring the competitive landscape and key market trends...
                  </div>
                </div>

                {/* Node 2 - Center */}
                <div className="absolute top-[40%] left-[45%] transform -translate-x-1/2 bg-stone-800 border border-orange-500/50 rounded-lg p-3 w-60 shadow-xl z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    <span className="text-xs font-medium text-orange-100">Core Question</span>
                  </div>
                  <div className="text-[11px] text-stone-400 leading-relaxed">
                    What makes this approach different from existing solutions?
                  </div>
                  <div className="mt-2 pt-2 border-t border-stone-700 text-[10px] text-stone-500">
                    3 AI responses
                  </div>
                </div>

                {/* Node 3 */}
                <div className="absolute top-[20%] right-[15%] bg-stone-800 border border-stone-700 rounded-lg p-3 w-52 shadow-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-xs font-medium text-purple-100">Key Insight</span>
                  </div>
                  <div className="text-[11px] text-stone-500 leading-relaxed">
                    The gap is in real-time collaboration features...
                  </div>
                </div>

                {/* Node 4 */}
                <div className="absolute bottom-[20%] left-[25%] bg-stone-800 border border-stone-700 rounded-lg p-3 w-48 shadow-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs font-medium text-green-100">Evidence</span>
                  </div>
                  <div className="text-[11px] text-stone-500 leading-relaxed">
                    User research shows 70% prefer visual tools...
                  </div>
                </div>

                {/* Connecting Lines */}
                <svg className="absolute inset-0 pointer-events-none w-full h-full">
                  <line x1="28%" y1="28%" x2="40%" y2="42%" stroke="rgba(251,146,60,0.3)" strokeWidth="2" />
                  <line x1="55%" y1="42%" x2="72%" y2="28%" stroke="rgba(251,146,60,0.3)" strokeWidth="2" />
                  <line x1="40%" y1="55%" x2="32%" y2="68%" stroke="rgba(251,146,60,0.3)" strokeWidth="2" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="px-6 py-24 max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-12 text-center">How it works</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 mb-4 mx-auto">
                <NetworkIcon className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Create Nodes</h3>
              <p className="text-stone-400 text-sm leading-relaxed">
                Add research topics, questions, or ideas as nodes on an infinite canvas. Drag them around and connect related concepts.
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 mb-4 mx-auto">
                <BrainIcon className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Chat with AI</h3>
              <p className="text-stone-400 text-sm leading-relaxed">
                Each node has its own AI chat. Ask questions, get research summaries, and explore ideas with context-aware responses.
              </p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 mb-4 mx-auto">
                <SearchIcon className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Deep Research</h3>
              <p className="text-stone-400 text-sm leading-relaxed">
                The AI agent searches the web, analyzes sources, and synthesizes information to give you comprehensive answers.
              </p>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="px-6 py-16 border-y border-white/5 bg-stone-900/20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Built for</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                "Startup Research",
                "Due Diligence",
                "Market Analysis",
                "Competitive Intelligence",
                "Academic Research",
                "Product Discovery",
                "Strategic Planning",
                "Brainstorming",
              ].map((item) => (
                <span
                  key={item}
                  className="px-4 py-2 rounded-full bg-stone-800 border border-stone-700 text-sm text-stone-300"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-20 text-center">
          <h2 className="text-3xl font-bold mb-4">See it in action</h2>
          <p className="text-stone-400 mb-8 text-lg max-w-xl mx-auto">
            Create a workspace and start exploring. No sign-up required.
          </p>
          <Link
            href="/home"
            className="inline-flex h-12 px-8 rounded-full bg-white text-stone-950 font-medium items-center justify-center transition-all hover:bg-stone-200 gap-2"
          >
            Get Started
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </section>

        <footer className="px-6 py-8 border-t border-white/5 text-center text-stone-600 text-sm">
          <p>Vantage - AI Research Workspace</p>
        </footer>
      </main>
    </div>
  );
}
