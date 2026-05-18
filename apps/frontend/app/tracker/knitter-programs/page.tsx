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
import { PlusCircle, AlertTriangle } from 'lucide-react';
import type {
  KnitterProgram,
  KnitterProgramFormData,
  Knitter,
  YarnLot,
} from '@/types/entities';
import type { Dyer } from '@/types/yarn';

export default function KnitterProgramsPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState<KnitterProgramFormData>({
    knitterId: '',
    yarnLotId: '',
    quantityUsed: '',
    greyWeight: '',
    numRolls: '',
    dia: '',
    gg: '',
    loopLength: '',
    fabricName: '',
    fabricColour: '',
    programmeRef: '',
    preAssignedDyerId: '',
    programDate: new Date().toISOString().split('T')[0],
  });

  const { data: programs = [] } = useQuery<KnitterProgram[]>({
    queryKey: ['knitter-programs'],
    queryFn: async () => (await api.get<KnitterProgram[]>('/knitter-programs')).data,
  });

  const { data: knitters = [] } = useQuery<Knitter[]>({
    queryKey: ['knitters'],
    queryFn: async () => (await api.get<Knitter[]>('/knitters')).data,
  });

  const { data: yarnLots = [] } = useQuery<YarnLot[]>({
    queryKey: ['yarn-lots'],
    queryFn: async () => (await api.get<YarnLot[]>('/yarn-lots')).data,
  });

  const { data: dyers = [] } = useQuery<Dyer[]>({
    queryKey: ['dyers'],
    queryFn: async () => (await api.get<Dyer[]>('/dyers')).data,
  });

  const createMutation = useMutation<KnitterProgram, Error, Record<string, unknown>>({
    mutationFn: async (body: Record<string, unknown>) => {
      const response = await api.post<KnitterProgram>('/knitter-programs', body);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knitter-programs'] });
      queryClient.invalidateQueries({ queryKey: ['knitter-stock'] });
      toast.success('Knitter program recorded');
      setCreateOpen(false);
      setFormData({
        knitterId: '', yarnLotId: '', quantityUsed: '', greyWeight: '',
        numRolls: '', dia: '', gg: '', loopLength: '',
        fabricName: '', fabricColour: '', programmeRef: '',
        preAssignedDyerId: '',
        programDate: new Date().toISOString().split('T')[0],
      });
    },
    onError: (error: Error) => {
      const message =
        (error as unknown as { response?: { data?: { message?: string } } })
          .response?.data?.message || 'Failed to record program';
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      knitterId: parseInt(formData.knitterId),
      yarnLotId: parseInt(formData.yarnLotId),
      quantityUsed: parseFloat(formData.quantityUsed),
      greyWeight: parseFloat(formData.greyWeight),
      numRolls: formData.numRolls ? parseInt(formData.numRolls) : undefined,
      preAssignedDyerId: formData.preAssignedDyerId ? parseInt(formData.preAssignedDyerId) : undefined,
    });
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Knitting Production</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Record Production
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Knitter Programs / Production</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Knitter</TableHead>
                <TableHead>Yarn Lot</TableHead>
                <TableHead>Yarn Used</TableHead>
                <TableHead>Grey Weight</TableHead>
                <TableHead>Fabric</TableHead>
                <TableHead>Anomaly</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.map((p: KnitterProgram) => (
                <TableRow key={p.id}>
                  <TableCell>{new Date(p.programDate).toLocaleDateString()}</TableCell>
                  <TableCell>{p.knitter?.name}</TableCell>
                  <TableCell>{p.yarnLot?.hfCode}</TableCell>
                  <TableCell>{p.quantityUsed} kg</TableCell>
                  <TableCell>{p.greyWeight} kg</TableCell>
                  <TableCell>{p.fabricName} ({p.fabricColour})</TableCell>
                  <TableCell>
                    {p.anomalyFlag && (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Knitting Production Record</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-300">Date</label>
                <input type="date" value={formData.programDate}
                  onChange={(e) => setFormData({ ...formData, programDate: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-slate-300">Knitter *</label>
                <select required value={formData.knitterId}
                  onChange={(e) => setFormData({ ...formData, knitterId: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white">
                  <option value="">Select Knitter...</option>
                  {knitters.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-300">Yarn Lot *</label>
                <select required value={formData.yarnLotId}
                  onChange={(e) => setFormData({ ...formData, yarnLotId: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white">
                  <option value="">Select Lot...</option>
                  {yarnLots.map(l => <option key={l.id} value={l.id}>{l.hfCode}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-300">Yarn Used (kg) *</label>
                <input type="number" step="0.01" required value={formData.quantityUsed}
                  onChange={(e) => setFormData({ ...formData, quantityUsed: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-slate-300">Grey Weight Produced (kg) *</label>
                <input type="number" step="0.01" required value={formData.greyWeight}
                  onChange={(e) => setFormData({ ...formData, greyWeight: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-slate-300">Num Rolls</label>
                <input type="number" value={formData.numRolls}
                  onChange={(e) => setFormData({ ...formData, numRolls: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t border-slate-700 pt-4">
              <div>
                <label className="block text-sm text-slate-300">Fabric Name</label>
                <input type="text" value={formData.fabricName}
                  onChange={(e) => setFormData({ ...formData, fabricName: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-slate-300">Fabric Colour</label>
                <input type="text" value={formData.fabricColour}
                  onChange={(e) => setFormData({ ...formData, fabricColour: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-slate-300">Ref / Program No</label>
                <input type="text" value={formData.programmeRef}
                  onChange={(e) => setFormData({ ...formData, programmeRef: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-slate-300">Dia</label>
                <input type="text" value={formData.dia}
                  onChange={(e) => setFormData({ ...formData, dia: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-slate-300">GG</label>
                <input type="text" value={formData.gg}
                  onChange={(e) => setFormData({ ...formData, gg: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-slate-300">Loop Length</label>
                <input type="text" value={formData.loopLength}
                  onChange={(e) => setFormData({ ...formData, loopLength: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white" />
              </div>
              <div className="col-span-3">
                <label className="block text-sm text-slate-300">Pre-Assigned Dyer</label>
                <select value={formData.preAssignedDyerId}
                  onChange={(e) => setFormData({ ...formData, preAssignedDyerId: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white">
                  <option value="">Select Dyer...</option>
                  {dyers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-4 justify-end">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Saving...' : 'Record Production'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
