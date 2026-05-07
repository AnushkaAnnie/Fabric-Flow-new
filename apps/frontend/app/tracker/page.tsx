import Link from "next/link";

export default function TrackerPage() {
  return (
    <div className="min-h-screen bg-[#080c14] flex items-center justify-center p-6">
      <div className="text-center max-w-lg">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-4xl">
          Thread
        </div>
        <h1 className="text-3xl font-bold gradient-text mb-3">
          Yarn-to-Fabric Tracker
        </h1>
        <p className="text-slate-400 mb-8">
          This module will provide real-time tracking of the full production
          pipeline from yarn lot intake through knitting programs, grey fabric
          lots, and dyeing.
          <br />
          <br />
          <span className="text-slate-500 text-sm font-mono bg-slate-800/60 px-2 py-1 rounded">
            API: localhost:3001
          </span>
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-200"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
