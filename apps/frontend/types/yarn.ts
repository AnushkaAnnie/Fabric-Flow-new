// Yarn lot as returned by the backend
export interface YarnLot {
  id: number;
  hfCode: string;
  millId: number;
  mill?: { id: number; name: string } | null;
  description?: string | null;
  count?: string | null;
  qualityId?: number | null;
  numBags: number;
  bagWeight: number;
  ratePerKg: number;
  totalWeight: number;
  totalCost: number;
  availableWeight: number;
  createdAt: string;
  updatedAt: string;
}

// Data sent to create/update a yarn lot
export interface YarnLotFormData {
  hfCode: string;
  millId: number;
  numBags: number;
  bagWeight: number;
  ratePerKg: number;
  description?: string;
  count?: string;
  qualityId?: number;
}

// Data sent to issue yarn to a knitter
export interface IssueYarnFormData {
  knitterId: number;
  weight: number;
}

// A mill reference (already exists in YarnLotForm.tsx – keep it there)
export interface Mill {
  id: number;
  name: string;
}

// A knitter reference (already exists in IssueForm.tsx – keep it there)
export interface Knitter {
  id: number;
  name: string;
}
