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
import { Package2, Search } from 'lucide-react';
import { YarnLotForm } from '@/components/yarn/YarnLotForm';
import type { YarnLot, YarnLotFormData, Mill, Knitter } from '@/types/yarn';

export default function YarnPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editLot, setEditLot] = useState<YarnLot | null>(null);

  // Search / filter state
  const [searchHF, setSearchHF] = useState('');
  const [selectedKnitterId, setSelectedKnitterId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'all' | 'knitter'>('all');

  const { data: lots = [] } = useQuery<YarnLot[]>({
    queryKey: ['yarn-lots', searchHF, selectedKnitterId, viewMode],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (viewMode === 'all' && searchHF) params['hfCode'] = searchHF;
      if (viewMode === 'knitter' && selectedKnitterId)
        params['knitterId'] = selectedKnitterId;
      const { data } = await api.get<YarnLot[]>('/yarn-lots', { params });
      return data;
    },
  });

  const { data: mills = [] } = useQuery<Mill[]>({
    queryKey: ['mills'],
    queryFn: async () => (await api.get<Mill[]>('/mills')).data,
  });

  const { data: knitters = [] } = useQuery<Knitter[]>({
    queryKey: ['knitters'],
    queryFn: async () => (await api.get<Knitter[]>('/knitters')).data,
  });

  const createMutation = useMutation({
    mutationFn: (form: YarnLotFormData) => api.post('/yarn-lots', form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yarn-lots'] });
      toast.success('Yarn lot created');
      setCreateOpen(false);
    },
    onError: () => toast.error('Failed to create yarn lot'),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      ...body
    }: { id: number } & Partial<YarnLotFormData>) =>
      api.patch(`/yarn-lots/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yarn-lots'] });
      toast.success('Yarn lot updated');
      setCreateOpen(false);
      setEditLot(null);
    },
    onError: () => toast.error('Update failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/yarn-lots/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yarn-lots'] });
      toast.success('Yarn lot deleted');
    },
    onError: () => toast.error('Delete failed'),
  });

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Yarn Inventory</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Package2 className="mr-2 h-4 w-4" /> Add Yarn Lot
        </Button>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search HF code..."
            value={searchHF}
            onChange={(e) => setSearchHF(e.target.value)}
            className="pl-8 rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
          />
        </div>
        <select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value as 'all' | 'knitter')}
          className="rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
        >
          <option value="all">All Inventory</option>
          <option value="knitter">By Knitter</option>
        </select>
        {viewMode === 'knitter' && (
          <select
            value={selectedKnitterId}
            onChange={(e) => setSelectedKnitterId(e.target.value)}
            className="rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
          >
            <option value="">Select knitter...</option>
            {knitters.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {viewMode === 'knitter' ? 'Knitter Stock' : 'All Yarn Lots'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>HF Code</TableHead>
                <TableHead>Mill</TableHead>
                {viewMode === 'knitter' ? (
                  <>
                    <TableHead>Knitter</TableHead>
                    <TableHead>Received Weight</TableHead>
                    <TableHead>Used Weight</TableHead>
                    <TableHead>Available Weight</TableHead>
                  </>
                ) : (
                  <>
                    <TableHead>Total (kg)</TableHead>
                    <TableHead>Available (kg)</TableHead>
                    <TableHead>Rate/kg</TableHead>
                    <TableHead>Total Cost</TableHead>
                  </>
                )}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lots.map((lot) => {
                if (viewMode === 'knitter') {
                  return lot.knitterStocks?.map((stock) => {
                    const used = stock.receivedWeight - stock.remainingWeight;
                    return (
                      <TableRow key={`${lot.id}-${stock.knitterId}`}>
                        <TableCell className="font-medium">{lot.hfCode}</TableCell>
                        <TableCell>{lot.mill?.name}</TableCell>
                        <TableCell>{stock.knitter?.name}</TableCell>
                        <TableCell>{stock.receivedWeight.toFixed(2)} kg</TableCell>
                        <TableCell>{used.toFixed(2)} kg</TableCell>
                        <TableCell>{stock.remainingWeight.toFixed(2)} kg</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditLot(lot);
                              setCreateOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  });
                }

                return (
                  <TableRow key={lot.id}>
                    <TableCell className="font-medium">{lot.hfCode}</TableCell>
                    <TableCell>{lot.mill?.name}</TableCell>
                    <TableCell>{lot.totalWeight} kg</TableCell>
                    <TableCell>{lot.availableWeight} kg</TableCell>
                    <TableCell>₹{lot.ratePerKg}</TableCell>
                    <TableCell>₹{lot.totalCost}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditLot(lot);
                          setCreateOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(lot.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) setEditLot(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editLot ? 'Edit Yarn Lot' : 'Add New Yarn Lot'}
            </DialogTitle>
          </DialogHeader>
          <YarnLotForm
            key={editLot?.id || 'new'}
            initial={editLot}
            mills={mills}
            onSubmit={(data: YarnLotFormData) => {
              if (editLot) {
                updateMutation.mutate({ id: editLot.id, ...data });
              } else {
                createMutation.mutate(data);
              }
            }}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
