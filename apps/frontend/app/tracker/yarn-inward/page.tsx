'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Pencil, Trash2, FileText } from 'lucide-react';
import type { YarnInward, YarnInwardFormData, Knitter } from '@/types/entities';
import type { Mill } from '@/types/yarn';
import POPrint from '@/components/po/POPrint';

// ── Constants ────────────────────────────────────────────────────────────────
const SELECT_CLASS =
  'mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-ring';

const EMPTY_FORM: YarnInwardFormData = {
  receiptDate: new Date().toISOString().split('T')[0],
  millId: '',
  deliveryKnitterId: '',
  hfBatch: '',
  yarnCount: '',
  yarnQuality: '',
  rlVl: '',
  numBags: '',
  bagWeight: '60',
  ratePerKg: '',
  cgstRate: '2.5',
  sgstRate: '2.5',
  purchaseAccount: 'C.N.T.LLP',
  remarks: '',
};

const fmt = (v: number | null | undefined, prefix = '') =>
  v != null ? `${prefix}${Number(v).toFixed(2)}` : '–';

export default function YarnInwardPage() {
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<YarnInward | null>(null);
  const [poData, setPoData] = useState<YarnInward | null>(null);
  const [formData, setFormData] = useState<YarnInwardFormData>(EMPTY_FORM);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: records = [] } = useQuery<YarnInward[]>({
    queryKey: ['yarn-inward'],
    queryFn: async () => (await api.get<YarnInward[]>('/yarn-inward')).data,
  });

  const { data: mills = [] } = useQuery<Mill[]>({
    queryKey: ['mills'],
    queryFn: async () => (await api.get<Mill[]>('/mills')).data,
  });

  const { data: knitters = [] } = useQuery<Knitter[]>({
    queryKey: ['knitters'],
    queryFn: async () => (await api.get<Knitter[]>('/knitters')).data,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = useMutation<YarnInward, Error, Record<string, unknown>>({
    mutationFn: (body) => api.post<YarnInward>('/yarn-inward', body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yarn-inward'] });
      toast.success('Yarn inward created');
      closeDialogs();
    },
    onError: () => toast.error('Failed to create yarn inward'),
  });

  const updateMutation = useMutation<YarnInward, Error, { id: number } & Record<string, unknown>>({
    mutationFn: ({ id, ...body }) =>
      api.patch<YarnInward>(`/yarn-inward/${id}`, body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yarn-inward'] });
      toast.success('Yarn inward updated');
      closeDialogs();
    },
    onError: () => toast.error('Failed to update yarn inward'),
  });

  const deleteMutation = useMutation<unknown, Error, number>({
    mutationFn: (id) => api.delete(`/yarn-inward/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yarn-inward'] });
      toast.success('Yarn inward deleted');
    },
    onError: () => toast.error('Failed to delete yarn inward'),
  });

  // ── Helpers ────────────────────────────────────────────────────────────────
  const closeDialogs = () => {
    setCreateOpen(false);
    setEditRecord(null);
    setFormData(EMPTY_FORM);
  };

  const openEditDialog = (record: YarnInward) => {
    setEditRecord(record);
    setFormData({
      receiptDate: record.receiptDate?.split('T')[0] ?? '',
      millId: String(record.millId ?? ''),
      deliveryKnitterId: String(record.deliveryKnitterId ?? ''),
      hfBatch: record.hfBatch ?? '',
      yarnCount: record.yarnCount ?? '',
      yarnQuality: record.yarnQuality ?? '',
      rlVl: record.rlVl ?? '',
      numBags: record.numBags != null ? String(record.numBags) : '',
      bagWeight: record.bagWeight != null ? String(record.bagWeight) : '60',
      ratePerKg: record.ratePerKg != null ? String(record.ratePerKg) : '',
      cgstRate: record.cgstRate != null ? String(record.cgstRate) : '2.5',
      sgstRate: record.sgstRate != null ? String(record.sgstRate) : '2.5',
      purchaseAccount: record.purchaseAccount ?? 'C.N.T.LLP',
      remarks: record.remarks ?? '',
    });
  };

  const confirmDelete = (id: number) => {
    if (window.confirm('Delete this yarn inward record?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleGeneratePO = async (id: number) => {
    try {
      const { data } = await api.get<YarnInward>(`/yarn-inward/${id}`);
      setPoData(data);
      setTimeout(() => {
        window.print();
      }, 250);
    } catch (err) {
      toast.error('Failed to fetch PO details');
    }
  };

  // ── Live calculation ───────────────────────────────────────────────────────
  const numBagsVal = parseInt(formData.numBags) || 0;
  const bagWeightVal = parseFloat(formData.bagWeight) || 0;
  const ratePerKgVal = parseFloat(formData.ratePerKg) || 0;
  const cgstRateVal = parseFloat(formData.cgstRate) || 0;
  const sgstRateVal = parseFloat(formData.sgstRate) || 0;
  const totalWeightCalc = numBagsVal * bagWeightVal;
  const taxableCostCalc = totalWeightCalc * ratePerKgVal;
  const cgstAmountCalc = taxableCostCalc * (cgstRateVal / 100);
  const sgstAmountCalc = taxableCostCalc * (sgstRateVal / 100);
  const totalCostCalc = taxableCostCalc + cgstAmountCalc + sgstAmountCalc;

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      receiptDate: formData.receiptDate,
      millId: parseInt(formData.millId),
      deliveryKnitterId: parseInt(formData.deliveryKnitterId),
      hfBatch: formData.hfBatch || undefined,
      yarnCount: formData.yarnCount || undefined,
      yarnQuality: formData.yarnQuality || undefined,
      rlVl: formData.rlVl || undefined,
      numBags: formData.numBags ? parseInt(formData.numBags) : undefined,
      bagWeight: formData.bagWeight ? parseFloat(formData.bagWeight) : undefined,
      ratePerKg: parseFloat(formData.ratePerKg),
      cgstRate: formData.cgstRate ? parseFloat(formData.cgstRate) : undefined,
      sgstRate: formData.sgstRate ? parseFloat(formData.sgstRate) : undefined,
      purchaseAccount: formData.purchaseAccount || undefined,
      remarks: formData.remarks || undefined,
    };

    if (editRecord) {
      updateMutation.mutate({ id: editRecord.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Yarn Inward</h1>
        <Button onClick={() => { setEditRecord(null); setCreateOpen(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Inward Record
        </Button>
      </div>

      {/* ── Table ── */}
      <Card>
        <CardHeader><CardTitle>Inward Records</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Mill</TableHead>
                <TableHead>Delivered To</TableHead>
                <TableHead>HF Batch</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>RL/VL</TableHead>
                <TableHead>Bags</TableHead>
                <TableHead>Bag Wt</TableHead>
                <TableHead>Total Wt</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Taxable</TableHead>
                <TableHead>CGST</TableHead>
                <TableHead>SGST</TableHead>
                <TableHead>Total Cost</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r) => {
                const tw = Number(r.totalWeight ?? 0);
                const rate = Number(r.ratePerKg ?? 0);
                return (
                  <TableRow key={r.id}>
                    <TableCell>{new Date(r.receiptDate).toLocaleDateString()}</TableCell>
                    <TableCell>{r.mill?.name ?? '–'}</TableCell>
                    <TableCell>{r.deliveryKnitter?.name ?? '–'}</TableCell>
                    <TableCell>{r.hfBatch ?? '–'}</TableCell>
                    <TableCell>{r.yarnCount ?? '–'}</TableCell>
                    <TableCell>{r.rlVl ?? '–'}</TableCell>
                    <TableCell>{r.numBags ?? '–'}</TableCell>
                    <TableCell>{fmt(r.bagWeight)} kg</TableCell>
                    <TableCell>{fmt(r.totalWeight)} kg</TableCell>
                    <TableCell>₹{fmt(r.ratePerKg)}</TableCell>
                    <TableCell>₹{(tw * rate).toFixed(2)}</TableCell>
                    <TableCell>₹{fmt(r.cgstAmount)}</TableCell>
                    <TableCell>₹{fmt(r.sgstAmount)}</TableCell>
                    <TableCell className="font-semibold">₹{fmt(r.totalCost)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="outline" size="sm"
                          title="Edit"
                          onClick={() => openEditDialog(r)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline" size="sm"
                          title="Delete"
                          onClick={() => confirmDelete(r.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline" size="sm"
                          title="Generate PO"
                          onClick={() => handleGeneratePO(r.id)}
                        >
                          <FileText className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Create / Edit Dialog ── */}
      <Dialog
        open={createOpen || editRecord !== null}
        onOpenChange={(open) => { if (!open) closeDialogs(); }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editRecord ? 'Edit Yarn Inward' : 'Add Yarn Inward'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Row 1 – Date + Mill */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="receiptDate">Receipt Date *</Label>
                <Input id="receiptDate" type="date" required
                  value={formData.receiptDate}
                  onChange={(e) => setFormData({ ...formData, receiptDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="mill">Mill *</Label>
                <select id="mill" required className={SELECT_CLASS}
                  value={formData.millId}
                  onChange={(e) => setFormData({ ...formData, millId: e.target.value })}
                >
                  <option value="">Select Mill…</option>
                  {mills.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </div>

            {/* Row 2 – Knitter + HF Batch */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="knitter">Delivery Knitter *</Label>
                <select id="knitter" required className={SELECT_CLASS}
                  value={formData.deliveryKnitterId}
                  onChange={(e) => setFormData({ ...formData, deliveryKnitterId: e.target.value })}
                >
                  <option value="">Select Knitter…</option>
                  {knitters.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="hfBatch">HF Batch</Label>
                <Input id="hfBatch" placeholder="e.g. HF-24"
                  value={formData.hfBatch}
                  onChange={(e) => setFormData({ ...formData, hfBatch: e.target.value })}
                />
              </div>
            </div>

            {/* Row 3 – Yarn Count + Quality */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="yarnCount">Yarn Count</Label>
                <Input id="yarnCount" placeholder="e.g. 30/1"
                  value={formData.yarnCount}
                  onChange={(e) => setFormData({ ...formData, yarnCount: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="yarnQuality">Yarn Quality</Label>
                <Input id="yarnQuality" placeholder="e.g. Super Carded"
                  value={formData.yarnQuality}
                  onChange={(e) => setFormData({ ...formData, yarnQuality: e.target.value })}
                />
              </div>
            </div>

            {/* Row 4 – RL/VL */}
            <div>
              <Label htmlFor="rlVl">RL / VL</Label>
              <select id="rlVl" className={SELECT_CLASS}
                value={formData.rlVl}
                onChange={(e) => setFormData({ ...formData, rlVl: e.target.value })}
              >
                <option value="">Select…</option>
                <option value="RL">RL</option>
                <option value="VL">VL</option>
              </select>
            </div>

            {/* Row 5 – Bags + Bag Weight */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numBags">Number of Bags</Label>
                <Input id="numBags" type="number" min="0" placeholder="0"
                  value={formData.numBags}
                  onChange={(e) => setFormData({ ...formData, numBags: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="bagWeight">Bag Weight (kg)</Label>
                <Input id="bagWeight" type="number" step="0.01" min="0"
                  value={formData.bagWeight}
                  onChange={(e) => setFormData({ ...formData, bagWeight: e.target.value })}
                />
              </div>
            </div>

            {/* Row 6 – Rate per Kg */}
            <div>
              <Label htmlFor="ratePerKg">Rate per Kg (₹) *</Label>
              <Input id="ratePerKg" type="number" step="0.01" min="0" required placeholder="0.00"
                value={formData.ratePerKg}
                onChange={(e) => setFormData({ ...formData, ratePerKg: e.target.value })}
              />
            </div>

            {/* Row 7 – CGST + SGST */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cgstRate">CGST (%)</Label>
                <Input id="cgstRate" type="number" step="0.1" min="0"
                  value={formData.cgstRate}
                  onChange={(e) => setFormData({ ...formData, cgstRate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="sgstRate">SGST (%)</Label>
                <Input id="sgstRate" type="number" step="0.1" min="0"
                  value={formData.sgstRate}
                  onChange={(e) => setFormData({ ...formData, sgstRate: e.target.value })}
                />
              </div>
            </div>

            {/* Row 8 – Account + Remarks */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="purchaseAccount">Purchase Account</Label>
                <Input id="purchaseAccount" placeholder="e.g. C.N.T.LLP"
                  value={formData.purchaseAccount}
                  onChange={(e) => setFormData({ ...formData, purchaseAccount: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="remarks">Remarks</Label>
                <Input id="remarks" placeholder="Any additional notes…"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                />
              </div>
            </div>

            {/* Live Calculation Summary */}
            <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Weight</span>
                <strong>{totalWeightCalc.toFixed(2)} kg</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Taxable Amount</span>
                <strong>₹{taxableCostCalc.toFixed(2)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">CGST ({cgstRateVal}%)</span>
                <strong>₹{cgstAmountCalc.toFixed(2)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">SGST ({sgstRateVal}%)</span>
                <strong>₹{sgstAmountCalc.toFixed(2)}</strong>
              </div>
              <div className="flex justify-between border-t border-slate-600 pt-2 mt-1">
                <span className="font-semibold text-white">Total Cost</span>
                <strong className="text-lg text-white">₹{totalCostCalc.toFixed(2)}</strong>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={closeDialogs}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isPending}>
                {isPending ? 'Saving…' : editRecord ? 'Update Record' : 'Create Record'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── PO Print Overlay ── */}
      {poData && (
        <div className="hidden print:block absolute top-0 left-0 w-full bg-white">
          <POPrint data={poData} />
        </div>
      )}

      {/* Global CSS overrides for printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #po-print, #po-print * {
            visibility: visible;
          }
          #po-print {
            position: absolute;
            top: 0;
            left: 0;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
}
