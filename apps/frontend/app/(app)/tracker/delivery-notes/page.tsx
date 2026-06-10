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
import { PlusCircle } from 'lucide-react';
import type {
  DeliveryNote,
  DeliveryNoteFormData,
  Knitter,
  YarnLot,
} from '@/types/entities';

export default function DeliveryNotesPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState<DeliveryNoteFormData>({
    sourceKnitterId: '',
    destinationKnitterId: '',
    yarnLotId: '',
    quantity: '',
    dcNumber: '',
    note: '',
  });

  const { data: deliveryNotes = [] } = useQuery<DeliveryNote[]>({
    queryKey: ['delivery-notes'],
    queryFn: async () => {
      const { data } = await api.get<DeliveryNote[]>('/delivery-notes');
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

  const { data: yarnLots = [] } = useQuery<YarnLot[]>({
    queryKey: ['yarn-lots'],
    queryFn: async () => {
      const { data } = await api.get<YarnLot[]>('/yarn-lots');
      return data;
    },
  });

  const createMutation = useMutation<DeliveryNote, Error, Record<string, unknown>>({
    mutationFn: async (form: Record<string, unknown>) => {
      const response = await api.post<DeliveryNote>('/delivery-notes', form);
      return response.data;
    },
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
    onError: (error: Error) => {
      const message =
        (error as unknown as { response?: { data?: { message?: string } } })
          .response?.data?.message || 'Failed to create delivery note';
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

  const resetForm = () => {
    setFormData({
      sourceKnitterId: '',
      destinationKnitterId: '',
      yarnLotId: '',
      quantity: '',
      dcNumber: '',
      note: '',
    });
    setCreateOpen(false);
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
              {deliveryNotes.map((dn: DeliveryNote) => (
                <TableRow key={dn.id}>
                  <TableCell>
                    {new Date(dn.createdAt).toLocaleDateString()}
                  </TableCell>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Transfer DC</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300">Source Knitter</label>
              <select
                value={formData.sourceKnitterId}
                onChange={(e) =>
                  setFormData({ ...formData, sourceKnitterId: e.target.value })
                }
                className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
              >
                <option value="">Select Source...</option>
                {knitters.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-300">
                Destination Knitter
              </label>
              <select
                value={formData.destinationKnitterId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    destinationKnitterId: e.target.value,
                  })
                }
                className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
              >
                <option value="">Select Destination...</option>
                {knitters.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-300">Yarn Lot</label>
              <select
                value={formData.yarnLotId}
                onChange={(e) =>
                  setFormData({ ...formData, yarnLotId: e.target.value })
                }
                className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
              >
                <option value="">Select Lot...</option>
                {yarnLots.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.hfCode}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-300">
                Quantity (kg)
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300">
                DC Number (Optional)
              </label>
              <input
                type="text"
                value={formData.dcNumber}
                onChange={(e) =>
                  setFormData({ ...formData, dcNumber: e.target.value })
                }
                className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300">Note</label>
              <input
                type="text"
                value={formData.note}
                onChange={(e) =>
                  setFormData({ ...formData, note: e.target.value })
                }
                className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
              />
            </div>

            <div className="flex gap-4 justify-end">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit">Create Transfer</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
