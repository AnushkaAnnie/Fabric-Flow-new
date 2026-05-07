import Link from "next/link";

const services = [
  {
    id: "textile-flow-tracker",
    title: "Textile Flow Tracker",
    description:
      "Complete yarn-to-fabric lifecycle for Chhavineetu Textiles LLP. Real-time stock visibility at every stage.",
    href: "/tracker",
    icon: "🧵",
    status: "active",
    port: 3001,
    color: "from-blue-500/20 to-violet-500/20",
    border: "border-blue-500/30",
    glow: "shadow-blue-500/10",
    badge: "Core Service",
    metrics: [
      { label: "Yarn Lots", value: "—" },
      { label: "Programs", value: "—" },
      { label: "In Transit", value: "—" },
    ],
  }
];

const pipeline = [
  { stage: "Yarn Lot", icon: "🧶", color: "bg-blue-500" },
  { stage: "Knitting", icon: "🔧", color: "bg-violet-500" },
  { stage: "Grey Fabric", icon: "📦", color: "bg-indigo-500" },
  { stage: "Dyeing", icon: "🎨", color: "bg-pink-500" },
  { stage: "Compacting", icon: "⚙️", color: "bg-emerald-500" },
  { stage: "Finished", icon: "✅", color: "bg-teal-500" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#080c14] relative overflow-hidden">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/8 blur-[120px]" />
        <div className="absolute top-[30%] right-[-15%] w-[500px] h-[500px] rounded-full bg-violet-600/8 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[30%] w-[400px] h-[400px] rounded-full bg-emerald-600/6 blur-[100px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 border-b border-slate-800/60 bg-[#080c14]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-lg shadow-lg shadow-blue-500/25">
              🪡
            </div>
            <div>
              <span className="text-xl font-bold gradient-text">Textile Flow</span>
              <span className="ml-2 text-xs text-slate-500 font-medium uppercase tracking-wider">Phase 0</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">All Systems Operational</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        {/* Hero section */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-6">
            <span className="text-xs text-blue-400 font-semibold uppercase tracking-wider">Monolith Foundation</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
            <span className="gradient-text">Textile Flow</span>
            <br />
            <span className="text-slate-300 text-4xl md:text-5xl font-light">Chhavineetu Textiles LLP</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            A unified application for end-to-end textile manufacturing —
            from raw yarn to finished fabric, with complete audit trails and master data management.
          </p>
        </div>

        {/* Production Pipeline */}
        <div className="mb-16">
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-blue-500 inline-block" />
              Production Pipeline
            </h2>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {pipeline.map((step, i) => (
                <div key={step.stage} className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-12 h-12 rounded-xl ${step.color}/20 border border-slate-700/50 flex items-center justify-center text-xl transition-transform hover:scale-105`}>
                      {step.icon}
                    </div>
                    <span className="text-xs text-slate-400 font-medium whitespace-nowrap">{step.stage}</span>
                  </div>
                  {i < pipeline.length - 1 && (
                    <div className="flex items-center gap-1 mb-4">
                      <div className="w-6 h-px bg-gradient-to-r from-slate-600 to-slate-700" />
                      <svg className="w-3 h-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Service Cards */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-slate-200 mb-8 flex items-center gap-3">
            <span>Services</span>
            <span className="text-sm font-normal text-slate-500 bg-slate-800/60 px-2.5 py-1 rounded-full">{services.length} running</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((svc) => (
              <Link
                key={svc.id}
                id={`service-card-${svc.id}`}
                href={svc.href}
                className={`group relative glass-card rounded-2xl p-6 ${svc.border} hover:border-opacity-60 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${svc.glow} cursor-pointer block`}
              >
                {/* Background gradient on hover */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${svc.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                        {svc.icon}
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{svc.badge}</span>
                        <h3 className="text-base font-bold text-slate-100 leading-tight">{svc.title}</h3>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1 bg-emerald-500/10 rounded-full px-2 py-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-xs text-emerald-400 font-medium">:{svc.port}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-400 leading-relaxed mb-5">
                    {svc.description}
                  </p>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    {svc.metrics.map((metric) => (
                      <div key={metric.label} className="bg-slate-800/40 rounded-xl p-2.5 text-center">
                        <div className="text-base font-bold text-slate-200">{metric.value}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{metric.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-400 font-medium group-hover:text-blue-300 transition-colors">
                      Open dashboard →
                    </span>
                    <span className="text-slate-600 text-xs font-mono">localhost:{svc.port}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Infrastructure Status */}
        <div className="glass-card rounded-2xl p-6 mb-8">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-violet-500 inline-block" />
            Infrastructure
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "PostgreSQL", detail: "Docker · Port 5432", icon: "🐘", color: "text-sky-400" },
              { label: "textile_flow_db", detail: "All Data Models", icon: "🗄️", color: "text-emerald-400" },
            ].map((item) => (
              <div key={item.label} className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-4 hover:border-slate-600/50 transition-colors">
                <div className="text-2xl mb-2">{item.icon}</div>
                <div className={`text-sm font-semibold ${item.color}`}>{item.label}</div>
                <div className="text-xs text-slate-500 mt-1">{item.detail}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-slate-600 text-sm">
          <span>Textile Flow Platform</span>
          <span className="mx-2">·</span>
          <span>Turborepo + NestJS + Next.js + PostgreSQL</span>
        </div>
      </main>
    </div>
  );
}
