'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Layers,
  Package,
  Scissors,
  ClipboardList,
  Truck,
  BarChart3,
  LogOut,
  Zap,
} from 'lucide-react';

const nav = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    ],
  },
  {
    section: 'Master Data',
    items: [
      { label: 'Mills', href: '/tracker/master-data/mills', icon: Layers },
      { label: 'Knitters', href: '/tracker/master-data/knitters', icon: Layers },
      { label: 'Dyers', href: '/tracker/master-data/dyers', icon: Layers },
      { label: 'Compacters', href: '/tracker/master-data/compacters', icon: Layers },
      { label: 'Colours', href: '/tracker/master-data/colours', icon: Layers },
      { label: 'Wash Types', href: '/tracker/master-data/wash-types', icon: Layers },
    ],
  },
  {
    section: 'Procurement',
    items: [
      { label: 'Yarn Inward', href: '/tracker/yarn-inward', icon: Package },
      { label: 'Yarn Inventory', href: '/tracker/yarn', icon: Package },
      { label: 'Grey Fabric Inward', href: '/tracker/grey-fabric-inward', icon: Package },
      { label: 'Purchase Orders', href: '/tracker/purchase-orders', icon: ClipboardList },
    ],
  },
  {
    section: 'Production',
    items: [
      { label: 'Knitter Programs', href: '/tracker/knitter-programs', icon: Scissors },
      { label: 'Dyeing Dispatch', href: '/tracker/dyeing', icon: Scissors },
      { label: 'Memos', href: '/tracker/memos', icon: ClipboardList },
      { label: 'Delivery Notes', href: '/tracker/delivery-notes', icon: Truck },
    ],
  },
  {
    section: 'Planning',
    items: [
      { label: 'Production Plans', href: '/production-planning', icon: BarChart3 },
      { label: 'Plan Dashboard', href: '/production-planning/dashboard', icon: LayoutDashboard },
      { label: 'Event Timeline', href: '/production-planning/events', icon: Zap },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    try { localStorage.removeItem('token'); } catch { /* noop */ }
    router.replace('/login');
  }

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <aside className="w-60 shrink-0 border-r border-slate-800 bg-slate-950/80 flex flex-col sticky top-0 h-screen overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-base shadow-lg shadow-blue-500/25">
          🪡
        </div>
        <div>
          <p className="text-sm font-bold text-slate-100 leading-tight">Fabric Flow</p>
          <p className="text-[10px] text-slate-500">Textile MES</p>
        </div>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 px-3 py-4 space-y-6">
        {nav.map((group) => (
          <div key={group.section}>
            <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              {group.section}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all duration-150 ${
                        active
                          ? 'bg-blue-600/15 text-blue-300 border border-blue-500/25 font-medium'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-blue-400' : 'text-slate-500'}`} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4 border-t border-slate-800 pt-3">
        <button
          onClick={logout}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-150"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
