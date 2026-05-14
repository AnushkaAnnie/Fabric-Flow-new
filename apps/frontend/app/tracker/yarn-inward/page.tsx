'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package2, Printer } from 'lucide-react';
import type { Mill } from '@/types/yarn';

export default function YarnInwardPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [poRecord, setPoRecord] = useState<any>(null);

  const [formData, setFormData] = useState({
    receiptDate: new Date().toISOString().split('T')[0],
    millId: '',
    hfBatch: '',
    yarnCount: '',
    yarnQuality: '',
    totalWeight: '',
    numBags: '',
    ratePerKg: '',
    purchaseAccount: 'C.N.T.LLP',
    remarks: '',
  });

  const { data: records = [] } = useQuery<any[]>({
    queryKey: ['yarn-inward'],
    queryFn: async () => {
      const { data } = await api.get('/yarn-inward');
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

  const createMutation = useMutation({
    mutationFn: (form: any) => api.post('/yarn-inward', form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yarn-inward'] });
      toast.success('Yarn inward record created');
      setCreateOpen(false);
      setFormData({
        receiptDate: new Date().toISOString().split('T')[0],
        millId: '',
        hfBatch: '',
        yarnCount: '',
        yarnQuality: '',
        totalWeight: '',
        numBags: '',
        ratePerKg: '',
        purchaseAccount: 'C.N.T.LLP',
        remarks: '',
      });
    },
    onError: () => toast.error('Failed to create yarn inward record'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      millId: parseInt(formData.millId),
      totalWeight: parseFloat(formData.totalWeight),
      numBags: formData.numBags ? parseInt(formData.numBags) : undefined,
      ratePerKg: formData.ratePerKg ? parseFloat(formData.ratePerKg) : undefined,
    });
  };

  const calculatedCost = (parseFloat(formData.totalWeight || '0') * parseFloat(formData.ratePerKg || '0')).toFixed(2);

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Yarn Inward</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Package2 className="mr-2 h-4 w-4" /> Add Inward Record
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inward Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Mill</TableHead>
                <TableHead>HF Batch</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell>{new Date(r.receiptDate).toLocaleDateString()}</TableCell>
                  <TableCell>{r.mill?.name}</TableCell>
                  <TableCell>{r.hfBatch}</TableCell>
                  <TableCell>{r.yarnCount}</TableCell>
                  <TableCell>{r.totalWeight} kg</TableCell>
                  <TableCell>₹{r.totalCost}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPoRecord(r)}
                    >
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
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Yarn Inward</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 text-slate-900">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="date"
                required
                className="border p-2 rounded"
                value={formData.receiptDate}
                onChange={e => setFormData({ ...formData, receiptDate: e.target.value })}
              />
              <select
                required
                className="border p-2 rounded"
                value={formData.millId}
                onChange={e => setFormData({ ...formData, millId: e.target.value })}
              >
                <option value="">Select Mill...</option>
                {mills.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="HF Batch"
                className="border p-2 rounded"
                value={formData.hfBatch}
                onChange={e => setFormData({ ...formData, hfBatch: e.target.value })}
              />
              <input
                type="text"
                placeholder="Yarn Count"
                className="border p-2 rounded"
                value={formData.yarnCount}
                onChange={e => setFormData({ ...formData, yarnCount: e.target.value })}
              />
              <input
                type="text"
                placeholder="Yarn Quality"
                className="border p-2 rounded"
                value={formData.yarnQuality}
                onChange={e => setFormData({ ...formData, yarnQuality: e.target.value })}
              />
              <input
                type="number"
                step="0.01"
                required
                placeholder="Total Weight (kg)"
                className="border p-2 rounded"
                value={formData.totalWeight}
                onChange={e => setFormData({ ...formData, totalWeight: e.target.value })}
              />
              <input
                type="number"
                placeholder="Num Bags"
                className="border p-2 rounded"
                value={formData.numBags}
                onChange={e => setFormData({ ...formData, numBags: e.target.value })}
              />
              <input
                type="number"
                step="0.01"
                placeholder="Rate Per Kg"
                className="border p-2 rounded"
                value={formData.ratePerKg}
                onChange={e => setFormData({ ...formData, ratePerKg: e.target.value })}
              />
              <input
                type="text"
                placeholder="Purchase Account"
                className="border p-2 rounded"
                value={formData.purchaseAccount}
                onChange={e => setFormData({ ...formData, purchaseAccount: e.target.value })}
              />
              <input
                type="text"
                placeholder="Remarks"
                className="border p-2 rounded"
                value={formData.remarks}
                onChange={e => setFormData({ ...formData, remarks: e.target.value })}
              />
            </div>
            <div className="text-sm font-semibold text-white">Calculated Cost: ₹{calculatedCost}</div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} className="text-black">
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!poRecord} onOpenChange={(open) => !open && setPoRecord(null)}>
        <DialogContent className="max-w-3xl print:max-w-full">
          <DialogHeader>
            <DialogTitle>Purchase Order / Inward Receipt</DialogTitle>
          </DialogHeader>
          {poRecord && (
            <div className="p-8 border rounded-lg bg-white text-black print:border-none print:p-0">
              <div className="text-center mb-6 border-b pb-4">
                <h2 className="text-2xl font-bold uppercase">{poRecord.purchaseAccount || 'C.N.T.LLP'}</h2>
                <p className="text-gray-600">Yarn Inward Receipt</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                  <p><strong>Date:</strong> {new Date(poRecord.receiptDate).toLocaleDateString()}</p>
                  <p><strong>Mill:</strong> {poRecord.mill?.name}</p>
                </div>
                <div className="text-right">
                  <p><strong>Record ID:</strong> INW-{poRecord.id.toString().padStart(4, '0')}</p>
                  <p><strong>HF Batch:</strong> {poRecord.hfBatch || '-'}</p>
                </div>
              </div>
              <table className="w-full text-left border-collapse mb-8 text-sm">
                <thead>
                  <tr className="border-b-2 border-black">
                    <th className="py-2">Quality</th>
                    <th className="py-2">Count</th>
                    <th className="py-2">Bags</th>
                    <th className="py-2 text-right">Weight (kg)</th>
                    <th className="py-2 text-right">Rate/kg</th>
                    <th className="py-2 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3">{poRecord.yarnQuality || '-'}</td>
                    <td className="py-3">{poRecord.yarnCount || '-'}</td>
                    <td className="py-3">{poRecord.numBags || '-'}</td>
                    <td className="py-3 text-right">{poRecord.totalWeight}</td>
                    <td className="py-3 text-right">{poRecord.ratePerKg || '-'}</td>
                    <td className="py-3 text-right">{poRecord.totalCost || '-'}</td>
                  </tr>
                </tbody>
              </table>
              <div className="mt-16 flex justify-between text-sm">
                <div className="border-t border-black w-48 text-center pt-2">Prepared By</div>
                <div className="border-t border-black w-48 text-center pt-2">Authorized Signatory</div>
              </div>
            </div>
          )}
          <div className="flex justify-end mt-4 print:hidden">
            <Button onClick={() => window.print()}>Print PO</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
