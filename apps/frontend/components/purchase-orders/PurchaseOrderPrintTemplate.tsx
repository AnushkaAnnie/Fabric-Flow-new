'use client';

interface POItem {
  description: string;
  count: string;
  quality: string;
  bags: number;
  bagWeight: number;
  totalWeight: number;
  rate: number;
  cgst: number;
  sgst: number;
}

interface POData {
  poNumber?: string;
  hfCode?: string;
  agent?: string;
  date?: string;
  deliveryDate?: string;
  supplierName?: string;
  supplierAddress?: string;
  supplierGST?: string;
  deliveryName?: string;
  deliveryAddress?: string;
  deliveryGST?: string;
  items?: POItem[];
  poType?: 'YARN' | 'GREY_FABRIC';
  fabricType?: string;
  fabricColour?: string;
  fabricDia?: string;
  fabricGsm?: string;
  totalFabricWeight?: string;
}

export default function PurchaseOrderPrintTemplate({ data }: { data: POData }) {
  const items = data.items || [];
  const isFabric = data.poType === 'GREY_FABRIC';

  const totalBags = items.reduce((acc, item) => acc + (Number(item.bags) || 0), 0);
  const totalWeight = items.reduce((acc, item) => acc + (Number(item.totalWeight) || 0), 0);

  const grandTotal = items.reduce((acc, item) => {
    const tw = Number(item.totalWeight) || 0;
    const rate = Number(item.rate) || 0;
    const taxable = tw * rate;
    const cgst = taxable * ((Number(item.cgst) || 0) / 100);
    const sgst = taxable * ((Number(item.sgst) || 0) / 100);
    return acc + taxable + cgst + sgst;
  }, 0);

  return (
    <div
      id="po-print"
      className="bg-white text-black w-[210mm] min-h-[297mm] mx-auto p-8 text-[11px] font-mono leading-tight"
      style={{
        boxSizing: 'border-box',
        pageBreakInside: 'avoid',
      }}
    >
      {/* HEADER SECTION */}
      <div className="text-center border-2 border-black p-4 space-y-1">
        <h1 className="text-2xl font-bold tracking-wide uppercase">CHHAVI NEETU TEXTILES LLP</h1>
        <p className="text-[10px]">
          No. 789, Kallangayam, Andipalayam, Tirupur - 641601
        </p>
        <p className="text-[10px]">
          Phone: 96003 20779 | Email: chhavineetutextilesllp@gmail.com
        </p>
        <p className="text-[11px] font-bold">
          GSTIN: 33AATFC5860D1ZC
        </p>
      </div>

      {/* DOCUMENT TITLE */}
      <div className="text-center border-x-2 border-b-2 border-black p-2 bg-slate-100 font-bold text-xs uppercase tracking-wider">
        {isFabric ? 'FABRIC PURCHASE ORDER' : 'YARN PURCHASE ORDER'}
      </div>

      {/* METADATA TABLE */}
      <table className="w-full border-collapse border-x-2 border-b-2 border-black text-[10px]">
        <thead>
          <tr className="bg-slate-50 font-bold uppercase text-center border-b border-black">
            <th className="border-r border-black p-1.5 w-1/5">PO Number</th>
            <th className="border-r border-black p-1.5 w-1/5">HF Code</th>
            <th className="border-r border-black p-1.5 w-1/5">Agent</th>
            <th className="border-r border-black p-1.5 w-1/5">PO Date</th>
            <th className="p-1.5 w-1/5">Exp Delivery Date</th>
          </tr>
        </thead>
        <tbody>
          <tr className="text-center font-semibold">
            <td className="border-r border-black p-2">{data.poNumber || '—'}</td>
            <td className="border-r border-black p-2">{data.hfCode || '—'}</td>
            <td className="border-r border-black p-2">{data.agent || '—'}</td>
            <td className="border-r border-black p-2">{data.date ? new Date(data.date).toLocaleDateString() : '—'}</td>
            <td className="p-2">{data.deliveryDate ? new Date(data.deliveryDate).toLocaleDateString() : '—'}</td>
          </tr>
        </tbody>
      </table>

      {/* ADDRESS SECTION */}
      <div className="grid grid-cols-2 border-x-2 border-b-2 border-black">
        <div className="border-r border-black p-3 space-y-1">
          <p className="font-bold underline uppercase tracking-wider mb-1">Supplier Details:</p>
          <p className="font-bold text-[11px] uppercase">{data.supplierName || '—'}</p>
          <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{data.supplierAddress || '—'}</p>
          <p className="font-bold pt-1 text-[10px]">GSTIN: {data.supplierGST || '—'}</p>
        </div>
        <div className="p-3 space-y-1">
          <p className="font-bold underline uppercase tracking-wider mb-1">Delivery Address:</p>
          <p className="font-bold text-[11px] uppercase">{data.deliveryName || '—'}</p>
          <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{data.deliveryAddress || '—'}</p>
          <p className="font-bold pt-1 text-[10px]">GSTIN: {data.deliveryGST || '—'}</p>
        </div>
      </div>

      {/* FABRIC SPECIFICATIONS (only for Grey Fabric PO) */}
      {isFabric && (data.fabricType || data.fabricDia || data.fabricGsm) && (
        <div className="border-x-2 border-b-2 border-black p-3">
          <p className="font-bold underline uppercase tracking-wider mb-1 text-[10px]">Fabric Specifications:</p>
          <div className="grid grid-cols-4 gap-4 text-[10px]">
            {data.fabricType && <p><span className="font-bold">Type:</span> {data.fabricType}</p>}
            {data.fabricColour && <p><span className="font-bold">Colour:</span> {data.fabricColour}</p>}
            {data.fabricDia && <p><span className="font-bold">Dia:</span> {data.fabricDia}</p>}
            {data.fabricGsm && <p><span className="font-bold">GSM:</span> {data.fabricGsm}</p>}
          </div>
        </div>
      )}

      {/* ITEMS TABLE */}
      <table className="w-full border-collapse border-x-2 border-b-2 border-black text-[10px] mt-4">
        <thead>
          <tr className="bg-slate-100 font-bold uppercase text-center border-b-2 border-black">
            <th className="border-r border-black p-2 w-[4%]">S.No</th>
            <th className="border-r border-black p-2 text-left w-[24%]">Description / Particulars</th>
            <th className="border-r border-black p-2 w-[8%]">{isFabric ? 'Fabric Type' : 'Count'}</th>
            <th className="border-r border-black p-2 w-[10%]">{isFabric ? 'Colour' : 'Quality'}</th>
            <th className="border-r border-black p-2 w-[7%]">{isFabric ? 'Rolls' : 'Bags'}</th>
            <th className="border-r border-black p-2 w-[8%]">{isFabric ? 'Wt/Roll' : 'Bag Wt'}</th>
            <th className="border-r border-black p-2 w-[9%]">Total Wt</th>
            <th className="border-r border-black p-2 w-[7%]">Rate</th>
            <th className="border-r border-black p-2 w-[9%]">Taxable</th>
            <th className="border-r border-black p-2 w-[4%]">CGST %</th>
            <th className="border-r border-black p-2 w-[8%]">CGST Amt</th>
            <th className="border-r border-black p-2 w-[4%]">SGST %</th>
            <th className="border-r border-black p-2 w-[8%]">SGST Amt</th>
            <th className="p-2 w-[10%]">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const tw = Number(item.totalWeight) || 0;
            const rate = Number(item.rate) || 0;
            const taxable = tw * rate;
            const cgstAmount = taxable * ((Number(item.cgst) || 0) / 100);
            const sgstAmount = taxable * ((Number(item.sgst) || 0) / 100);
            const total = taxable + cgstAmount + sgstAmount;

            return (
              <tr key={index} className="border-b border-black text-center font-medium">
                <td className="border-r border-black p-2">{index + 1}</td>
                <td className="border-r border-black p-2 text-left font-bold">{item.description || '—'}</td>
                <td className="border-r border-black p-2">{item.count || '—'}</td>
                <td className="border-r border-black p-2">{item.quality || '—'}</td>
                <td className="border-r border-black p-2">{item.bags || 0}</td>
                <td className="border-r border-black p-2">{Number(item.bagWeight).toFixed(2)}</td>
                <td className="border-r border-black p-2 font-bold">{Number(item.totalWeight).toFixed(2)} kg</td>
                <td className="border-r border-black p-2">₹{Number(item.rate).toFixed(2)}</td>
                <td className="border-r border-black p-2 font-bold">₹{taxable.toFixed(2)}</td>
                <td className="border-r border-black p-2">{item.cgst}%</td>
                <td className="border-r border-black p-2">₹{cgstAmount.toFixed(2)}</td>
                <td className="border-r border-black p-2">{item.sgst}%</td>
                <td className="border-r border-black p-2">₹{sgstAmount.toFixed(2)}</td>
                <td className="p-2 font-bold">₹{total.toFixed(2)}</td>
              </tr>
            );
          })}

          {/* EMPTY ROWS FOR FILLING A4 SPACE IF UNDER 5 ITEMS */}
          {items.length < 5 &&
            Array.from({ length: 5 - items.length }).map((_, idx) => (
              <tr key={`empty-${idx}`} className="border-b border-black text-center min-h-[30px] opacity-20">
                <td className="border-r border-black p-2.5">&nbsp;</td>
                <td className="border-r border-black p-2.5">&nbsp;</td>
                <td className="border-r border-black p-2.5">&nbsp;</td>
                <td className="border-r border-black p-2.5">&nbsp;</td>
                <td className="border-r border-black p-2.5">&nbsp;</td>
                <td className="border-r border-black p-2.5">&nbsp;</td>
                <td className="border-r border-black p-2.5">&nbsp;</td>
                <td className="border-r border-black p-2.5">&nbsp;</td>
                <td className="border-r border-black p-2.5">&nbsp;</td>
                <td className="border-r border-black p-2.5">&nbsp;</td>
                <td className="border-r border-black p-2.5">&nbsp;</td>
                <td className="border-r border-black p-2.5">&nbsp;</td>
                <td className="border-r border-black p-2.5">&nbsp;</td>
                <td className="p-2.5">&nbsp;</td>
              </tr>
            ))}
        </tbody>
      </table>

      {/* SUMMARY PANEL */}
      <div className="flex border-x-2 border-b-2 border-black justify-between bg-slate-50 font-bold p-3 text-[11px]">
        <div>
          {isFabric ? 'Total Rolls' : 'Total Bags'}: <span className="underline">{totalBags}</span>
        </div>
        <div>
          Total Weight: <span className="underline">{totalWeight.toFixed(2)} kg</span>
        </div>
        <div className="text-xs tracking-wider">
          GRAND TOTAL: <span className="underline text-lg font-black">₹{grandTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* TERMS & SIGNATURE SECTION */}
      <div className="grid grid-cols-2 mt-8 text-[10px]">
        <div className="space-y-1">
          <p className="font-bold underline uppercase">Terms &amp; Conditions:</p>
          <p>1. Goods once sold will not be taken back.</p>
          <p>2. Subject to Tirupur jurisdiction.</p>
          <p>3. E. &amp; O.E.</p>
        </div>
        <div className="text-right flex flex-col justify-between items-end h-[100px] pr-4">
          <p className="font-bold uppercase tracking-wider">For CHHAVI NEETU TEXTILES LLP</p>
          <div className="w-[150px] border-b border-black border-dashed pb-1"></div>
          <p className="font-bold uppercase">Authorized Signatory</p>
        </div>
      </div>
    </div>
  );
}
