"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { masterDataConfig } from "@/lib/master-data-config";

export default function MasterDataSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950/70 p-4">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Master Data</h2>
      <nav className="space-y-1">
        {masterDataConfig.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.entity}
              href={item.path}
              className={`block rounded px-3 py-2 text-sm ${
                isActive ? "bg-blue-600/20 text-blue-300" : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              {item.title}
            </Link>
          );
        })}
      </nav>

      <h2 className="mb-4 mt-8 text-sm font-semibold uppercase tracking-wide text-slate-400">Inventory</h2>
      <nav className="space-y-1">
        <Link
          href="/tracker/yarn"
          className={`block rounded px-3 py-2 text-sm ${
            pathname === "/tracker/yarn" ? "bg-blue-600/20 text-blue-300" : "text-slate-300 hover:bg-slate-800"
          }`}
        >
          Yarn Inventory
        </Link>
      </nav>
    </aside>
  );
}
