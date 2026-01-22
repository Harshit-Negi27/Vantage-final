import Link from "next/link";

export default function ChatsPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="max-w-md rounded-xl border border-white/10 bg-white/5 p-5">
        <div className="text-lg font-medium">Chats</div>
        <div className="mt-2 text-sm text-white/55">This view is not wired yet. Use Whiteboards for node-based research chats.</div>
        <div className="mt-4">
          <Link href="/home" className="inline-flex rounded-md bg-white text-black px-3 py-2 text-sm">
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

