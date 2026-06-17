export interface PurchaseOrderItem {
  description: string;
  hsnCode?: string;
  quantity?: number;
  rate: number;
  amount?: number;
  // Existing form uses bags/bagWeight/totalWeight; keep flexible
  bags: number;
  bagWeight: number;
  totalWeight: number;
  cgst: number;
  sgst: number;
  count: string;
  quality: string;
}

export interface PurchaseOrder {
  id: string | number;
  poNumber: string;
  hfCode?: string;
  date: string;
  supplierName?: string;
  supplierAddress?: string;
  supplierGST?: string;
  supplier?: string;
  agent?: string;
  deliveryDate?: string;
  poType?: 'YARN' | 'GREY_FABRIC';
  deliveryName?: string;
  deliveryAddress?: string;
  deliveryGST?: string;
  fabricType?: string;
  fabricColour?: string;
  fabricDia?: string;
  fabricGsm?: string;
  totalFabricWeight?: number;
  items: PurchaseOrderItem[];
  totalAmount?: number;
  status?: string;
  createdAt?: string;
}

export interface CreatePurchaseOrderInput {
  poNumber?: string;
  hfCode?: string;
  supplierName?: string;
  supplierAddress?: string;
  supplierGST?: string;
  supplier?: string;
  agent?: string;
  date: string;
  deliveryDate?: string;
  poType?: 'YARN' | 'GREY_FABRIC';
  deliveryName?: string;
  deliveryAddress?: string;
  deliveryGST?: string;
  fabricType?: string;
  fabricColour?: string;
  fabricDia?: string;
  fabricGsm?: string;
  totalFabricWeight?: number;
  items: PurchaseOrderItem[];
}
