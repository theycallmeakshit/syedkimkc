import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#212121] text-zinc-200 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#18181b] border border-zinc-800 rounded-xl p-8 text-center space-y-4">
        <h1 className="text-xl font-semibold text-zinc-100">404 - Page not found</h1>
        <p className="text-sm text-zinc-400">
          The requested page or endpoint does not exist on the Aegis Guard server.
        </p>
        <div>
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium rounded-lg border border-zinc-700 transition-colors"
          >
            Return to Gateway
          </Link>
        </div>
      </div>
    </div>
  );
}
