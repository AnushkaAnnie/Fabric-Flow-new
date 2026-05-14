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
import { FileText, PlusCircle } from 'lucide-react';

export default function DeliveryNotesPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const [formData, setFormData] = useState({
    sourceKnitterId: '',
    destinationKnitterId: '',
    yarnLotId: '',
    quantity: '',
    dcNumber: '',
    note: '',
  });

  const { data: deliveryNotes = [] } = useQuery<any[]>({
    queryKey: ['delivery-notes'],
    queryFn: async () => {
      const { data } = await api.get('/delivery-notes');
      return data;
    },
  });

  const { data: knitters = [] } = useQuery<any[]>({
    queryKey: ['knitters'],
    queryFn: async () => {
      const { data } = await api.get('/knitters');
      return data;
    },
  });

  const { data: yarnLots = [] } = useQuery<any[]>({
    queryKey: ['yarn-lots'],
    queryFn: async () => {
      const { data } = await api.get('/yarn-lots');
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (form: any) => api.post('/delivery-notes', form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-notes'] });
      queryClient.invalidateQueries({ queryKey: ['knitter-stock'] });
      toast.success('Delivery note created successfully');
      setCreateOpen(false);
      setFormData({
        sourceKnitterId: '',
        destinationKnitterId: '',
        yarnLotId: '',
        quantity: '',
        dcNumber: '',
        note: '',
      });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create delivery note';
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.sourceKnitterId === formData.destinationKnitterId) {
      toast.error('Source and destination knitters must be different');
      return;
    }
    createMutation.mutate({
      ...formData,
      sourceKnitterId: parseInt(formData.sourceKnitterId),
      destinationKnitterId: parseInt(formData.destinationKnitterId),
      yarnLotId: parseInt(formData.yarnLotId),
      quantity: parseFloat(formData.quantity),
    });
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Delivery Notes (Transfers)</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> New Transfer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transfer Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>DC Number</TableHead>
                <TableHead>Source Knitter</TableHead>
                <TableHead>Dest Knitter</TableHead>
                <TableHead>Yarn Lot</TableHead>
                <TableHead>Quantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveryNotes.map((dn: any) => (
                <TableRow key={dn.id}>
                  <TableCell>{new Date(dn.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{dn.dcNumber || '-'}</TableCell>
                  <TableCell>{dn.sourceKnitter?.name}</TableCell>
                  <TableCell>{dn.destinationKnitter?.name}</TableCell>
                  <TableCell>{dn.yarnLot?.hfCode}</TableCell>
                  <TableCell>{dn.quantity} kg</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Transfer DC</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 text-slate-900">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-white">Source Knitter</label>
                <select
                  required
                  className="w-full border p-2 rounded"
                  value={formData.sourceKnitterId}
                  onChange={e => setFormData({ ...formData, sourceKnitterId: e.target.value })}
                >
                  <option value="">Select Source...</option>
                  {knitters.map(k => (
                    <option key={k.id} value={k.id}>{k.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-white">Destination Knitter</label>
                <select
                  required
                  className="w-full border p-2 rounded"
                  value={formData.destinationKnitterId}
                  onChange={e => setFormData({ ...formData, destinationKnitterId: e.target.value })}
                >
                  <option value="">Select Destination...</option>
                  {knitters.map(k => (
                    <option key={k.id} value={k.id}>{k.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-white">Yarn Lot</label>
                <select
                  required
                  className="w-full border p-2 rounded"
                  value={formData.yarnLotId}
                  onChange={e => setFormData({ ...formData, yarnLotId: e.target.value })}
                >
                  <option value="">Select Lot...</option>
                  {yarnLots.map(l => (
                    <option key={l.id} value={l.id}>{l.hfCode}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-white">Quantity (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="w-full border p-2 rounded"
                  value={formData.quantity}
                  onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-white">DC Number (Optional)</label>
                <input
                  type="text"
                  className="w-full border p-2 rounded"
                  value={formData.dcNumber}
                  onChange={e => setFormData({ ...formData, dcNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-white">Note</label>
                <input
                  type="text"
                  className="w-full border p-2 rounded"
                  value={formData.note}
                  onChange={e => setFormData({ ...formData, note: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} className="text-black">
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                Create Transfer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
