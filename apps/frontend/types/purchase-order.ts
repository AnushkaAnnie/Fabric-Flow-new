export interface PurchaseOrderItem {
  description: string;
  hsnCode?: string;
  quantity?: number;
  rate?: number;
  amount?: number;
  // Existing form uses bags/bagWeight/totalWeight; keep flexible
  bags?: number;
  bagWeight?: number;
  totalWeight?: number;
  cgst?: number;
  sgst?: number;
}

export interface PurchaseOrder {
  id: string | number;
  poNumber: string;
  hfCode?: string;
  date: string;
  supplierName?: string;
  supplier?: string;
  agent?: string;
  items: PurchaseOrderItem[];
  totalAmount?: number;
  status?: string;
  createdAt?: string;
}

export interface CreatePurchaseOrderInput {
  supplierName?: string;
  supplier?: string;
  date: string;
  items: PurchaseOrderItem[];
  poNumber?: string;
  hfCode?: string;
}
