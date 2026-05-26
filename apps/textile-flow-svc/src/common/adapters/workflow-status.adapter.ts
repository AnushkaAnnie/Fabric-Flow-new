import { WorkflowStatus } from '@textile-flow/shared';

export const YarnLotStatus = {
  PENDING: 'Pending',
  RECEIVED: 'Received',
} as const;

export function yarnStatusFromInvoice(invoiceNo?: string | null): string {
  return invoiceNo && invoiceNo.trim().length > 0
    ? YarnLotStatus.RECEIVED
    : YarnLotStatus.PENDING;
}

export function dyeingStatusFromDc(
  knitterDcNo?: string | null,
  companyDcNo?: string | null,
): string {
  return knitterDcNo && companyDcNo
    ? WorkflowStatus.IN_DYEING
    : WorkflowStatus.PENDING;
}

export function toOldYarnLookupShape(lot: {
  id: number;
  hfCode: string;
  description?: string | null;
  totalWeight: number;
  availableWeight: number;
}) {
  const used = lot.totalWeight - lot.availableWeight;

  return {
    id: lot.id,
    hf_code: lot.hfCode,
    description: lot.description ?? '',
    total_weight: lot.totalWeight,
    used,
    remaining: lot.availableWeight,
  };
}
