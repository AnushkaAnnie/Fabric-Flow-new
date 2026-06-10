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
  Memo,
  MemoFormData,
  MemoLineFormData,
  Knitter,
  YarnLot,
} from '@/types/entities';

interface Dyer {
  id: number;
  name: string;
}

const emptyLine = (): MemoLineFormData => ({
  yarnLotId: '', knitterId: '', yarnCount: '', dia: '', gg: '',
  loopLength: '', fabricName: '', fabricColour: '', expectedRolls: '', preAssignedDyerId: '',
});

export default function MemosPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState<MemoFormData>({
    issueDate: new Date().toISOString().split('T')[0],
    programmeRef: '',
    account: 'C.N.T.LLP',
    remarks: '',
    lines: [emptyLine()],
  });

  const { data: memos = [] } = useQuery<Memo[]>({
    queryKey: ['memos'],
    queryFn: async () => {
      const { data } = await api.get<Memo[]>('/memos');
      return data;
    },
  });

  const { data: lots = [] } = useQuery<YarnLot[]>({
    queryKey: ['yarn-lots'],
    queryFn: async () => {
      const { data } = await api.get<YarnLot[]>('/yarn-lots');
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

  const { data: dyers = [] } = useQuery<Dyer[]>({
    queryKey: ['dyers'],
    queryFn: async () => {
      const { data } = await api.get<Dyer[]>('/dyers');
      return data;
    },
  });

  const createMutation = useMutation<Memo, Error, Record<string, unknown>>({
    mutationFn: async (form: Record<string, unknown>) => {
      const response = await api.post<Memo>('/memos', form);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memos'] });
      toast.success('Memo created successfully');
      setCreateOpen(false);
      setFormData({
        issueDate: new Date().toISOString().split('T')[0],
        programmeRef: '', account: 'C.N.T.LLP', remarks: '',
        lines: [emptyLine()],
      });
    },
    onError: () => toast.error('Failed to create memo'),
  });

  const handleLineChange = (index: number, field: keyof MemoLineFormData, value: string) => {
    const newLines: MemoLineFormData[] = [...formData.lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setFormData({ ...formData, lines: newLines });
  };

  const addLine = () =>
    setFormData({ ...formData, lines: [...formData.lines, emptyLine()] });

  const removeLine = (index: number) => {
    const newLines = formData.lines.filter((_: MemoLineFormData, i: number) => i !== index);
    setFormData({ ...formData, lines: newLines });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      lines: formData.lines.map((l: MemoLineFormData) => ({
        yarnLotId: parseInt(l.yarnLotId),
        knitterId: parseInt(l.knitterId),
        yarnCount: l.yarnCount,
        dia: l.dia,
        gg: l.gg,
        loopLength: l.loopLength,
        fabricName: l.fabricName,
        fabricColour: l.fabricColour,
        expectedRolls: l.expectedRolls ? parseInt(l.expectedRolls) : undefined,
        preAssignedDyerId: l.preAssignedDyerId ? parseInt(l.preAssignedDyerId) : undefined,
      })),
    };
    createMutation.mutate(payload);
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Memos</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> New Memo
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Dispatch Memos</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Memo No</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Programme Ref</TableHead>
                <TableHead>Lines</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memos.map((m: Memo) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">#{m.memoNo}</TableCell>
                  <TableCell>{new Date(m.issueDate).toLocaleDateString()}</TableCell>
                  <TableCell>{m.account}</TableCell>
                  <TableCell>{m.programmeRef || '-'}</TableCell>
                  <TableCell>{m.lines?.length || 0} line(s)</TableCell>
                  <TableCell>{m.remarks || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create New Memo</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-300">Issue Date</label>
                <input type="date" value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-slate-300">Account</label>
                <input type="text" value={formData.account}
                  onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-slate-300">Programme Ref</label>
                <input type="text" value={formData.programmeRef}
                  onChange={(e) => setFormData({ ...formData, programmeRef: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white" />
              </div>
              <div>
                <label className="block text-sm text-slate-300">Remarks</label>
                <input type="text" value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Memo Lines</h3>
              <Button type="button" variant="outline" onClick={addLine}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Line
              </Button>
            </div>

            {formData.lines.map((line: MemoLineFormData, index: number) => (
              <div key={index} className="border border-slate-700 rounded p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-400">Line {index + 1}</span>
                  <Button type="button" variant="ghost" size="sm"
                    onClick={() => removeLine(index)} disabled={formData.lines.length === 1}>
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-slate-300">Yarn Lot</label>
                    <select value={line.yarnLotId}
                      onChange={(e) => handleLineChange(index, 'yarnLotId', e.target.value)}
                      className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white">
                      <option value="">Select Lot...</option>
                      {lots.filter((l: YarnLot) => l.availableWeight > 0).map((l: YarnLot) => (
                        <option key={l.id} value={l.id}>{l.hfCode} ({l.availableWeight}kg)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300">Knitter</label>
                    <select value={line.knitterId}
                      onChange={(e) => handleLineChange(index, 'knitterId', e.target.value)}
                      className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white">
                      <option value="">Select Knitter...</option>
                      {knitters.map((k: Knitter) => (
                        <option key={k.id} value={k.id}>{k.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300">Fabric Name</label>
                    <input type="text" value={line.fabricName}
                      onChange={(e) => handleLineChange(index, 'fabricName', e.target.value)}
                      className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300">Fabric Colour</label>
                    <input type="text" value={line.fabricColour}
                      onChange={(e) => handleLineChange(index, 'fabricColour', e.target.value)}
                      className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300">Yarn Count</label>
                    <input type="text" value={line.yarnCount}
                      onChange={(e) => handleLineChange(index, 'yarnCount', e.target.value)}
                      className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300">Dia / GG</label>
                    <div className="flex gap-2">
                      <input type="text" value={line.dia} placeholder="DIA"
                        onChange={(e) => handleLineChange(index, 'dia', e.target.value)}
                        className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white" />
                      <input type="text" value={line.gg} placeholder="GG"
                        onChange={(e) => handleLineChange(index, 'gg', e.target.value)}
                        className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300">Loop Length</label>
                    <input type="text" value={line.loopLength}
                      onChange={(e) => handleLineChange(index, 'loopLength', e.target.value)}
                      className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300">Pre-Assigned Dyer</label>
                    <select value={line.preAssignedDyerId}
                      onChange={(e) => handleLineChange(index, 'preAssignedDyerId', e.target.value)}
                      className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white">
                      <option value="">None</option>
                      {dyers.map((d: Dyer) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300">Expected Rolls</label>
                    <input type="number" value={line.expectedRolls}
                      onChange={(e) => handleLineChange(index, 'expectedRolls', e.target.value)}
                      className="mt-1 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white" />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit">Create Memo</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
