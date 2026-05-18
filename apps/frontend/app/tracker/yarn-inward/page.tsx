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
import { Package2, Printer } from 'lucide-react';
import type {
  YarnInward,
  YarnInwardFormData,
  Knitter,
} from '@/types/entities';
import type { Mill } from '@/types/yarn';

const SELECT_CLASS =
  'mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-ring';

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

export default function YarnInwardPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [poRecord, setPoRecord] = useState<YarnInward | null>(null);
  const [formData, setFormData] = useState<YarnInwardFormData>(EMPTY_FORM);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: records = [] } = useQuery<YarnInward[]>({
    queryKey: ['yarn-inward'],
    queryFn: async () => {
      const { data } = await api.get<YarnInward[]>('/yarn-inward');
      return data;
    },
  });

  const { data: mills = [] } = useQuery<Mill[]>({
    queryKey: ['mills'],
    queryFn: async () => {
      const { data } = await api.get<Mill[]>('/mills');
      return data;
    },
  });

  const { data: knitters = [] } = useQuery<Knitter[]>({
    queryKey: ['knitters'],
    queryFn: async () => {
      const { data } = await api.get<Knitter[]>('/knitters');
      return data;
    },
  });

  // ── Mutation ───────────────────────────────────────────────────────────────
  const createMutation = useMutation<YarnInward, Error, Record<string, unknown>>({
    mutationFn: async (form: Record<string, unknown>) => {
      const response = await api.post<YarnInward>('/yarn-inward', form);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yarn-inward'] });
      toast.success('Yarn inward record created');
      setCreateOpen(false);
      setFormData(EMPTY_FORM);
    },
    onError: () => toast.error('Failed to create yarn inward record'),
  });

  // ── Live calculation (display only) ────────────────────────────────────────
  const bagWeight   = parseFloat(formData.bagWeight)  || 0;
  const numBags     = parseInt(formData.numBags)       || 0;
  const totalWeight = numBags * bagWeight;
  const ratePerKg   = parseFloat(formData.ratePerKg)  || 0;
  const taxableCost = totalWeight * ratePerKg;
  const cgstRate    = parseFloat(formData.cgstRate)    || 0;
  const sgstRate    = parseFloat(formData.sgstRate)    || 0;
  const cgstAmount  = taxableCost * (cgstRate / 100);
  const sgstAmount  = taxableCost * (sgstRate / 100);
  const totalCost   = taxableCost + cgstAmount + sgstAmount;

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      receiptDate:       formData.receiptDate,
      millId:            parseInt(formData.millId),
      deliveryKnitterId: parseInt(formData.deliveryKnitterId),
      hfBatch:           formData.hfBatch || undefined,
      yarnCount:         formData.yarnCount || undefined,
      yarnQuality:       formData.yarnQuality || undefined,
      rlVl:              formData.rlVl || undefined,
      numBags:           formData.numBags ? parseInt(formData.numBags) : undefined,
      bagWeight:         formData.bagWeight ? parseFloat(formData.bagWeight) : undefined,
      ratePerKg:         parseFloat(formData.ratePerKg),
      cgstRate:          formData.cgstRate ? parseFloat(formData.cgstRate) : undefined,
      sgstRate:          formData.sgstRate ? parseFloat(formData.sgstRate) : undefined,
      purchaseAccount:   formData.purchaseAccount || undefined,
      remarks:           formData.remarks || undefined,
    });
  };

  const fmt = (v: number | null | undefined) =>
    v != null ? Number(v).toFixed(2) : '–';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Yarn Inward</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Package2 className="mr-2 h-4 w-4" /> Add Inward Record
        </Button>
      </div>

      {/* ── Records Table ── */}
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
              {records.map((r: YarnInward) => {
                const tw   = Number(r.totalWeight);
                const rate = Number(r.ratePerKg ?? 0);
                const taxable = tw * rate;
                return (
                  <TableRow key={r.id}>
                    <TableCell>{new Date(r.receiptDate).toLocaleDateString()}</TableCell>
                    <TableCell>{r.mill?.name}</TableCell>
                    <TableCell>{r.deliveryKnitter?.name}</TableCell>
                    <TableCell>{r.hfBatch ?? '–'}</TableCell>
                    <TableCell>{r.yarnCount ?? '–'}</TableCell>
                    <TableCell>{r.rlVl ?? '–'}</TableCell>
                    <TableCell>{r.numBags ?? '–'}</TableCell>
                    <TableCell>{fmt(r.bagWeight)} kg</TableCell>
                    <TableCell>{fmt(r.totalWeight)} kg</TableCell>
                    <TableCell>₹{fmt(r.ratePerKg)}</TableCell>
                    <TableCell>₹{taxable.toFixed(2)}</TableCell>
                    <TableCell>₹{fmt(r.cgstAmount)}</TableCell>
                    <TableCell>₹{fmt(r.sgstAmount)}</TableCell>
                    <TableCell className="font-semibold">₹{fmt(r.totalCost)}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => setPoRecord(r)}>
                        <Printer className="mr-1 h-3 w-3" /> PO
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Create Dialog ── */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Add Yarn Inward</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">

            {/* Row 1: Date + Mill */}
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
                  <option value="">Select Mill...</option>
                  {mills.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </div>

            {/* Row 2: Knitter + HF Batch */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deliveryKnitter">Issue to Knitter *</Label>
                <select id="deliveryKnitter" required className={SELECT_CLASS}
                  value={formData.deliveryKnitterId}
                  onChange={(e) => setFormData({ ...formData, deliveryKnitterId: e.target.value })}
                >
                  <option value="">Select Knitter...</option>
                  {knitters.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="hfBatch">HF Batch</Label>
                <Input id="hfBatch" type="text" placeholder="e.g. HF-24"
                  value={formData.hfBatch}
                  onChange={(e) => setFormData({ ...formData, hfBatch: e.target.value })}
                />
              </div>
            </div>

            {/* Row 3: Yarn Count + Quality */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="yarnCount">Yarn Count</Label>
                <Input id="yarnCount" type="text" placeholder="e.g. 30/1"
                  value={formData.yarnCount}
                  onChange={(e) => setFormData({ ...formData, yarnCount: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="yarnQuality">Yarn Quality</Label>
                <Input id="yarnQuality" type="text" placeholder="e.g. Super Carded"
                  value={formData.yarnQuality}
                  onChange={(e) => setFormData({ ...formData, yarnQuality: e.target.value })}
                />
              </div>
            </div>

            {/* Row 4: RL/VL */}
            <div>
              <Label htmlFor="rlVl">RL / VL</Label>
              <select id="rlVl" className={SELECT_CLASS}
                value={formData.rlVl}
                onChange={(e) => setFormData({ ...formData, rlVl: e.target.value })}
              >
                <option value="">Select...</option>
                <option value="RL">RL</option>
                <option value="VL">VL</option>
              </select>
            </div>

            {/* Row 5: Bags + Bag Weight */}
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

            {/* Row 6: Rate per Kg */}
            <div>
              <Label htmlFor="ratePerKg">Rate per Kg (₹) *</Label>
              <Input id="ratePerKg" type="number" step="0.01" min="0" required placeholder="0.00"
                value={formData.ratePerKg}
                onChange={(e) => setFormData({ ...formData, ratePerKg: e.target.value })}
              />
            </div>

            {/* Row 7: CGST + SGST */}
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

            {/* Row 8: Purchase Account + Remarks */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="purchaseAccount">Purchase Account</Label>
                <Input id="purchaseAccount" type="text" placeholder="e.g. C.N.T.LLP"
                  value={formData.purchaseAccount}
                  onChange={(e) => setFormData({ ...formData, purchaseAccount: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="remarks">Remarks</Label>
                <Input id="remarks" type="text" placeholder="Any additional notes..."
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                />
              </div>
            </div>

            {/* Live Calculation Summary */}
            <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Weight</span>
                <strong>{totalWeight.toFixed(2)} kg</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Taxable Amount</span>
                <strong>₹{taxableCost.toFixed(2)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">CGST ({cgstRate}%)</span>
                <strong>₹{cgstAmount.toFixed(2)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">SGST ({sgstRate}%)</span>
                <strong>₹{sgstAmount.toFixed(2)}</strong>
              </div>
              <div className="flex justify-between border-t border-slate-600 pt-2 mt-2">
                <span className="font-semibold text-white">Total Cost</span>
                <strong className="text-lg text-white">₹{totalCost.toFixed(2)}</strong>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving...' : 'Save Inward Record'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── PO Dialog ── */}
      {poRecord && (
        <Dialog open={!!poRecord} onOpenChange={() => setPoRecord(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Purchase Order</DialogTitle></DialogHeader>
            <div className="space-y-2 text-sm">
              <p><strong>Date:</strong> {new Date(poRecord.receiptDate).toLocaleDateString()}</p>
              <p><strong>Mill:</strong> {poRecord.mill?.name}</p>
              <p><strong>Delivered To:</strong> {poRecord.deliveryKnitter?.name}</p>
              <p><strong>HF Batch:</strong> {poRecord.hfBatch ?? '–'}</p>
              <p><strong>RL/VL:</strong> {poRecord.rlVl ?? '–'}</p>
              <p><strong>Bags:</strong> {poRecord.numBags ?? '–'} × {fmt(poRecord.bagWeight)} kg</p>
              <p><strong>Total Weight:</strong> {fmt(poRecord.totalWeight)} kg</p>
              <p><strong>Rate per Kg:</strong> ₹{fmt(poRecord.ratePerKg)}</p>
              <p><strong>CGST ({poRecord.cgstRate ?? 0}%):</strong> ₹{fmt(poRecord.cgstAmount)}</p>
              <p><strong>SGST ({poRecord.sgstRate ?? 0}%):</strong> ₹{fmt(poRecord.sgstAmount)}</p>
              <p className="text-base font-bold"><strong>Total Cost:</strong> ₹{fmt(poRecord.totalCost)}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
