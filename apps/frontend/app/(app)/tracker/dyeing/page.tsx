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
import { PlusCircle, Trash2 } from 'lucide-react';
import type {
  DyeingDispatch,
  DyeingDispatchFormData,
  GreyFabricLot,
} from '@/types/entities';
import type { Dyer } from '@/types/yarn';

export default function DyeingPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState<DyeingDispatchFormData>({
    dispatchDate: new Date().toISOString().split('T')[0],
    dyerId: '',
    remarks: '',
    lines: [{ greyFabricLotId: '' }],
  });

  const { data: dispatches = [] } = useQuery<DyeingDispatch[]>({
    queryKey: ['dyeing-dispatch'],
    queryFn: async () => {
      const { data } = await api.get<DyeingDispatch[]>('/dyeing-dispatch');
      return data;
    },
  });

  const { data: dyers = [] } = useQuery<Dyer[]>({
    queryKey: ['dyers'],
    queryFn: async () => (await api.get<Dyer[]>('/dyers')).data,
  });

  const { data: availableLots = [] } = useQuery<GreyFabricLot[]>({
    queryKey: ['grey-fabric-lots', 'AVAILABLE'],
    queryFn: async () => {
      const { data } = await api.get<GreyFabricLot[]>(
        '/grey-fabric-lots?status=AVAILABLE',
      );
      return data;
    },
  });

  const createMutation = useMutation<
    DyeingDispatch,
    Error,
    Record<string, unknown>
  >({
    mutationFn: async (body: Record<string, unknown>) => {
      const response = await api.post<DyeingDispatch>('/dyeing-dispatch', body);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dyeing-dispatch'] });
      queryClient.invalidateQueries({ queryKey: ['grey-fabric-lots'] });
      toast.success('Dyeing dispatch created');
      setCreateOpen(false);
      setFormData({
        dispatchDate: new Date().toISOString().split('T')[0],
        dyerId: '',
        remarks: '',
        lines: [{ greyFabricLotId: '' }],
      });
    },
    onError: () => toast.error('Failed to create dispatch'),
  });

  const handleLineChange = (index: number, field: string, value: string) => {
    const newLines = [...formData.lines];
    (newLines[index] as Record<string, string>)[field] = value;
    setFormData({ ...formData, lines: newLines });
  };

  const addLine = () => {
    setFormData({
      ...formData,
      lines: [...formData.lines, { greyFabricLotId: '' }],
    });
  };

  const removeLine = (index: number) => {
    setFormData({
      ...formData,
      lines: formData.lines.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      dispatchDate: formData.dispatchDate,
      dyerId: parseInt(formData.dyerId),
      remarks: formData.remarks,
      lines: formData.lines.map((l) => ({
        greyFabricLotId: parseInt(l.greyFabricLotId),
      })),
    };
    createMutation.mutate(payload);
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dyeing</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> New Dispatch
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dispatches</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Dyer</TableHead>
                <TableHead>Lots</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dispatches.map((d: DyeingDispatch) => (
                <TableRow key={d.id}>
                  <TableCell>
                    {new Date(d.dispatchDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{d.dyer?.name}</TableCell>
                  <TableCell>{d.lines?.length || 0}</TableCell>
                  <TableCell>{d.remarks || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Dyeing Dispatch</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-300">
                  Dispatch Date
                </label>
                <input
                  type="date"
                  value={formData.dispatchDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dispatchDate: e.target.value })
                  }
                  className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300">Dyer *</label>
                <select
                  value={formData.dyerId}
                  onChange={(e) =>
                    setFormData({ ...formData, dyerId: e.target.value })
                  }
                  className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
                  required
                >
                  <option value="">Select dyer...</option>
                  {dyers.map((d: Dyer) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-300">Remarks</label>
              <input
                type="text"
                value={formData.remarks}
                onChange={(e) =>
                  setFormData({ ...formData, remarks: e.target.value })
                }
                className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
              />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Grey Lots to Dispatch
              </h3>
              <Button type="button" variant="outline" onClick={addLine}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Lot
              </Button>
            </div>

            {formData.lines.map((line, index) => (
              <div
                key={index}
                className="border border-slate-700 rounded p-4 flex gap-4 items-end"
              >
                <div className="flex-1">
                  <label className="block text-sm text-slate-300">
                    Grey Fabric Lot
                  </label>
                  <select
                    value={line.greyFabricLotId}
                    onChange={(e) =>
                      handleLineChange(index, 'greyFabricLotId', e.target.value)
                    }
                    className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
                  >
                    <option value="">Select lot...</option>
                    {availableLots.map((lot: GreyFabricLot) => (
                      <option key={lot.id} value={lot.id}>
                        {lot.lotNumber} – {lot.greyWeight} kg
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLine(index)}
                  disabled={formData.lines.length === 1}
                >
                  <Trash2 className="h-4 w-4 text-red-400" />
                </Button>
              </div>
            ))}

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Dispatch</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
