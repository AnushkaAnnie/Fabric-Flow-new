'use client';

import PurchaseOrderForm from '@/components/purchase-orders/PurchaseOrderForm';

export default function PurchaseOrdersPage() {
  return (
    <div className="p-6 bg-slate-950 min-h-screen text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white uppercase">Yarn Purchase Orders</h1>
            <p className="text-slate-400 text-sm mt-1">
              Generate, preview, and print industry-standard yarn purchase orders with exact layout formatting.
            </p>
          </div>
        </div>
        <PurchaseOrderForm />
      </div>
    </div>
  );
}
