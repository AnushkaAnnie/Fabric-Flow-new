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
import { Package2, Printer } from 'lucide-react';
import type {
  YarnInward,
  YarnInwardFormData,
  Knitter,
} from '@/types/entities';
import type { Mill } from '@/types/yarn';

export default function YarnInwardPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [poRecord, setPoRecord] = useState<YarnInward | null>(null);
  const [formData, setFormData] = useState<YarnInwardFormData>({
    receiptDate: new Date().toISOString().split('T')[0],
    millId: '',
    deliveryKnitterId: '',
    hfBatch: '',
    yarnCount: '',
    yarnQuality: '',
    totalWeight: '',
    numBags: '',
    ratePerKg: '',
    purchaseAccount: 'C.N.T.LLP',
    remarks: '',
  });

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

  const createMutation = useMutation<YarnInward, Error, Record<string, unknown>>({
    mutationFn: async (form: Record<string, unknown>) => {
      const response = await api.post<YarnInward>('/yarn-inward', form);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yarn-inward'] });
      toast.success('Yarn inward record created');
      setCreateOpen(false);
      setFormData({
        receiptDate: new Date().toISOString().split('T')[0],
        millId: '', deliveryKnitterId: '', hfBatch: '', yarnCount: '',
        yarnQuality: '', totalWeight: '', numBags: '', ratePerKg: '',
        purchaseAccount: 'C.N.T.LLP', remarks: '',
      });
    },
    onError: () => toast.error('Failed to create yarn inward record'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      millId: parseInt(formData.millId),
      deliveryKnitterId: parseInt(formData.deliveryKnitterId),
      totalWeight: parseFloat(formData.totalWeight),
      numBags: formData.numBags ? parseInt(formData.numBags) : undefined,
      ratePerKg: formData.ratePerKg ? parseFloat(formData.ratePerKg) : undefined,
    });
  };

  const calculatedCost = (
    parseFloat(formData.totalWeight || '0') *
    parseFloat(formData.ratePerKg || '0')
  ).toFixed(2);

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Yarn Inward</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Package2 className="mr-2 h-4 w-4" /> Add Inward Record
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Inward Records</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Mill</TableHead>
                <TableHead>Delivered To</TableHead>
                <TableHead>HF Batch</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r: YarnInward) => (
                <TableRow key={r.id}>
                  <TableCell>{new Date(r.receiptDate).toLocaleDateString()}</TableCell>
                  <TableCell>{r.mill?.name}</TableCell>
                  <TableCell>{r.deliveryKnitter?.name}</TableCell>
                  <TableCell>{r.hfBatch}</TableCell>
                  <TableCell>{r.yarnCount}</TableCell>
                  <TableCell>{r.totalWeight} kg</TableCell>
                  <TableCell>₹{r.totalCost}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => setPoRecord(r)}>
                      <Printer className="mr-1 h-3 w-3" /> PO
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Yarn Inward</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 text-slate-900">
            <div className="grid grid-cols-2 gap-4">
              <input type="date" required className="border p-2 rounded"
                value={formData.receiptDate}
                onChange={(e) => setFormData({ ...formData, receiptDate: e.target.value })} />
              <select required className="border p-2 rounded" value={formData.millId}
                onChange={(e) => setFormData({ ...formData, millId: e.target.value })}>
                <option value="">Select Mill...</option>
                {mills.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <select required className="border p-2 rounded" value={formData.deliveryKnitterId}
                onChange={(e) => setFormData({ ...formData, deliveryKnitterId: e.target.value })}>
                <option value="">Issue to Knitter...</option>
                {knitters.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
              </select>
              <input type="text" placeholder="HF Batch" className="border p-2 rounded"
                value={formData.hfBatch}
                onChange={(e) => setFormData({ ...formData, hfBatch: e.target.value })} />
              <input type="text" placeholder="Yarn Count" className="border p-2 rounded"
                value={formData.yarnCount}
                onChange={(e) => setFormData({ ...formData, yarnCount: e.target.value })} />
              <input type="text" placeholder="Yarn Quality" className="border p-2 rounded"
                value={formData.yarnQuality}
                onChange={(e) => setFormData({ ...formData, yarnQuality: e.target.value })} />
              <input type="number" step="0.01" required placeholder="Total Weight (kg)"
                className="border p-2 rounded" value={formData.totalWeight}
                onChange={(e) => setFormData({ ...formData, totalWeight: e.target.value })} />
              <input type="number" placeholder="Num Bags" className="border p-2 rounded"
                value={formData.numBags}
                onChange={(e) => setFormData({ ...formData, numBags: e.target.value })} />
              <input type="number" step="0.01" placeholder="Rate Per Kg"
                className="border p-2 rounded" value={formData.ratePerKg}
                onChange={(e) => setFormData({ ...formData, ratePerKg: e.target.value })} />
              <input type="text" placeholder="Purchase Account" className="border p-2 rounded"
                value={formData.purchaseAccount}
                onChange={(e) => setFormData({ ...formData, purchaseAccount: e.target.value })} />
              <input type="text" placeholder="Remarks" className="border p-2 rounded"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} />
            </div>
            <div className="text-sm font-semibold text-white">Calculated Cost: ₹{calculatedCost}</div>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {poRecord && (
        <Dialog open={!!poRecord} onOpenChange={() => setPoRecord(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Purchase Order</DialogTitle></DialogHeader>
            <div className="space-y-2 text-sm">
              <p><strong>Date:</strong> {new Date(poRecord.receiptDate).toLocaleDateString()}</p>
              <p><strong>Mill:</strong> {poRecord.mill?.name}</p>
              <p><strong>Delivered To:</strong> {poRecord.deliveryKnitter?.name}</p>
              <p><strong>HF Batch:</strong> {poRecord.hfBatch}</p>
              <p><strong>Weight:</strong> {poRecord.totalWeight} kg</p>
              <p><strong>Cost:</strong> ₹{poRecord.totalCost}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
