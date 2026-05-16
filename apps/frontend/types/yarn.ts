// Yarn lot as returned by the backend
export interface YarnLot {
  id: number;
  hfCode: string;
  millId: number;
  mill?: { id: number; name: string } | null;
  description?: string | null;
  count?: string | null;
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
}



// A mill reference
export interface Mill {
  id: number;
  name: string;
}

// A knitter reference
export interface Knitter {
  id: number;
  name: string;
}

export interface Dyer {
  id: number;
  name: string;
}
