import type { ReactNode } from "react";
import MasterDataSidebar from "@/components/master-data/MasterDataSidebar";

export default function TrackerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100">
      <div className="flex min-h-screen">
        <MasterDataSidebar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
