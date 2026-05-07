import Link from "next/link";

export default function MasterDataPage() {
  return (
    <div className="min-h-screen bg-[#080c14] flex items-center justify-center p-6">
      <div className="text-center max-w-lg">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-4xl">
          🏭
        </div>
        <h1 className="text-3xl font-bold mb-3" style={{background: 'linear-gradient(135deg, #34d399, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Master Data</h1>
        <p className="text-slate-400 mb-8">
          Manage all reference data — mills, knitters, dyers, compacters, yarn qualities,
          colours, and wash types. Foundation for all production workflows.
          <br /><br />
          <span className="text-slate-500 text-sm font-mono bg-slate-800/60 px-2 py-1 rounded">API: localhost:3001/api</span>
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-200"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
