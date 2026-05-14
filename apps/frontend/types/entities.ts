// ===================== Delivery Note =====================
export interface DeliveryNote {
  id: number;
  sourceKnitterId: number;
  destinationKnitterId: number;
  yarnLotId: number;
  quantity: number;
  dcNumber?: string | null;
  note?: string | null;
  createdAt: string;
  sourceKnitter?: { id: number; name: string } | null;
  destinationKnitter?: { id: number; name: string } | null;
  yarnLot?: { id: number; hfCode: string } | null;
}

export interface DeliveryNoteFormData {
  sourceKnitterId: string;
  destinationKnitterId: string;
  yarnLotId: string;
  quantity: string;
  dcNumber: string;
  note: string;
}

// ===================== Grey Fabric Inward =====================
export interface GreyFabricInward {
  id: number;
  receiptDate: string;
  supplierName: string;
  fabricType?: string | null;
  colour?: string | null;
  totalWeight: number;
  rollCount?: number | null;
  ratePerKg?: number | null;
  totalCost?: number | null;
  purchaseAccount?: string | null;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
  greyFabricLots?: unknown[];
}

export interface GreyFabricInwardFormData {
  receiptDate: string;
  supplierName: string;
  fabricType: string;
  colour: string;
  totalWeight: string;
  rollCount: string;
  ratePerKg: string;
  purchaseAccount: string;
  remarks: string;
}

// ===================== Memo =====================
export interface MemoLine {
  id?: number;
  memoId?: number;
  yarnLotId: number;
  knitterId: number;
  yarnCount?: string | null;
  dia?: string | null;
  gg?: string | null;
  loopLength?: string | null;
  fabricName?: string | null;
  fabricColour?: string | null;
  expectedRolls?: number | null;
  preAssignedDyerId?: number | null;
  yarnLot?: { id: number; hfCode: string; availableWeight: number } | null;
  knitter?: { id: number; name: string } | null;
  dyer?: { id: number; name: string } | null;
}

export interface Memo {
  id: number;
  memoNo: number;
  issueDate: string;
  programmeRef?: string | null;
  account?: string | null;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
  lines?: MemoLine[];
}

export interface MemoLineFormData {
  yarnLotId: string;
  knitterId: string;
  yarnCount: string;
  dia: string;
  gg: string;
  loopLength: string;
  fabricName: string;
  fabricColour: string;
  expectedRolls: string;
  preAssignedDyerId: string;
}

export interface MemoFormData {
  issueDate: string;
  programmeRef: string;
  account: string;
  remarks: string;
  lines: MemoLineFormData[];
}

// ===================== Yarn Inward =====================
export interface YarnInward {
  id: number;
  receiptDate: string;
  millId: number;
  deliveryKnitterId: number;
  hfBatch?: string | null;
  yarnCount?: string | null;
  yarnQuality?: string | null;
  totalWeight: number;
  numBags?: number | null;
  ratePerKg?: number | null;
  totalCost?: number | null;
  purchaseAccount?: string | null;
  remarks?: string | null;
  createdAt: string;
  updatedAt: string;
  mill?: { id: number; name: string } | null;
  deliveryKnitter?: { id: number; name: string } | null;
  yarnLots?: unknown[];
}

export interface YarnInwardFormData {
  receiptDate: string;
  millId: string;
  deliveryKnitterId: string;
  hfBatch: string;
  yarnCount: string;
  yarnQuality: string;
  totalWeight: string;
  numBags: string;
  ratePerKg: string;
  purchaseAccount: string;
  remarks: string;
}

// Re-export commonly used types from yarn.ts for convenience
export type { YarnLot, Knitter } from './yarn';
