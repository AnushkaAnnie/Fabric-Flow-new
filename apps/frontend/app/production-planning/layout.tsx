import type { ReactNode } from "react";
import { Suspense } from "react";
import MasterDataSidebar from "@/components/master-data/MasterDataSidebar";

export default function ProductionPlanningLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100">
      <div className="flex min-h-screen">
        <MasterDataSidebar />
        <main className="flex-1 overflow-y-auto">
          <Suspense
            fallback={
              <div className="flex min-h-screen items-center justify-center bg-[#080c14] text-slate-500 font-medium text-sm animate-pulse">
                Loading...
              </div>
            }
          >
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
