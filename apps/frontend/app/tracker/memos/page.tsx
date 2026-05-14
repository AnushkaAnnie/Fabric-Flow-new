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
import { PlusCircle, Trash2 } from 'lucide-react';

export default function MemosPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

  const [formData, setFormData] = useState<any>({
    issueDate: new Date().toISOString().split('T')[0],
    programmeRef: '',
    account: 'C.N.T.LLP',
    remarks: '',
    lines: [
      {
        yarnLotId: '',
        knitterId: '',
        yarnCount: '',
        dia: '',
        gg: '',
        loopLength: '',
        fabricName: '',
        fabricColour: '',
        expectedRolls: '',
        preAssignedDyerId: '',
      }
    ],
  });

  const { data: memos = [] } = useQuery<any[]>({
    queryKey: ['memos'],
    queryFn: async () => {
      const { data } = await api.get('/memos');
      return data;
    },
  });

  const { data: lots = [] } = useQuery<any[]>({
    queryKey: ['yarn-lots'],
    queryFn: async () => {
      const { data } = await api.get('/yarn-lots');
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

  const { data: dyers = [] } = useQuery<any[]>({
    queryKey: ['dyers'],
    queryFn: async () => {
      const { data } = await api.get('/dyers');
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (form: any) => api.post('/memos', form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memos'] });
      toast.success('Memo created successfully');
      setCreateOpen(false);
      setFormData({
        issueDate: new Date().toISOString().split('T')[0],
        programmeRef: '',
        account: 'C.N.T.LLP',
        remarks: '',
        lines: [
          {
            yarnLotId: '',
            knitterId: '',
            yarnCount: '',
            dia: '',
            gg: '',
            loopLength: '',
            fabricName: '',
            fabricColour: '',
            expectedRolls: '',
            preAssignedDyerId: '',
          }
        ],
      });
    },
    onError: () => toast.error('Failed to create memo'),
  });

  const handleLineChange = (index: number, field: string, value: string) => {
    const newLines = [...formData.lines];
    newLines[index][field] = value;
    setFormData({ ...formData, lines: newLines });
  };

  const addLine = () => {
    setFormData({
      ...formData,
      lines: [
        ...formData.lines,
        {
          yarnLotId: '',
          knitterId: '',
          yarnCount: '',
          dia: '',
          gg: '',
          loopLength: '',
          fabricName: '',
          fabricColour: '',
          expectedRolls: '',
          preAssignedDyerId: '',
        }
      ]
    });
  };

  const removeLine = (index: number) => {
    const newLines = formData.lines.filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, lines: newLines });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Process form data
    const payload = {
      ...formData,
      lines: formData.lines.map((l: any) => ({
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
      }))
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
        <CardHeader>
          <CardTitle>Dispatch Memos</CardTitle>
        </CardHeader>
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
              {memos.map((m: any) => (
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Memo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 text-slate-900">
            {/* Header section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-100 p-4 rounded text-sm">
              <div>
                <label className="block text-xs font-semibold mb-1">Issue Date</label>
                <input
                  type="date"
                  required
                  className="w-full border p-2 rounded"
                  value={formData.issueDate}
                  onChange={e => setFormData({ ...formData, issueDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Account</label>
                <input
                  type="text"
                  className="w-full border p-2 rounded"
                  value={formData.account}
                  onChange={e => setFormData({ ...formData, account: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Programme Ref</label>
                <input
                  type="text"
                  className="w-full border p-2 rounded"
                  value={formData.programmeRef}
                  onChange={e => setFormData({ ...formData, programmeRef: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Remarks</label>
                <input
                  type="text"
                  className="w-full border p-2 rounded"
                  value={formData.remarks}
                  onChange={e => setFormData({ ...formData, remarks: e.target.value })}
                />
              </div>
            </div>

            {/* Lines Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center text-white">
                <h3 className="font-semibold text-lg">Memo Lines</h3>
                <Button type="button" variant="outline" size="sm" onClick={addLine} className="text-black">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Line
                </Button>
              </div>

              {formData.lines.map((line: any, index: number) => (
                <div key={index} className="bg-slate-50 p-4 rounded border relative space-y-3 text-sm">
                  <div className="absolute top-2 right-2">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500 h-8 w-8"
                      onClick={() => removeLine(index)}
                      disabled={formData.lines.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pr-8">
                    <div>
                      <label className="block text-xs font-semibold mb-1">Yarn Lot</label>
                      <select
                        required
                        className="w-full border p-2 rounded"
                        value={line.yarnLotId}
                        onChange={e => handleLineChange(index, 'yarnLotId', e.target.value)}
                      >
                        <option value="">Select Lot...</option>
                        {lots.filter((l:any) => l.availableWeight > 0).map((l:any) => (
                          <option key={l.id} value={l.id}>{l.hfCode} ({l.availableWeight}kg)</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Knitter</label>
                      <select
                        required
                        className="w-full border p-2 rounded"
                        value={line.knitterId}
                        onChange={e => handleLineChange(index, 'knitterId', e.target.value)}
                      >
                        <option value="">Select Knitter...</option>
                        {knitters.map((k:any) => (
                          <option key={k.id} value={k.id}>{k.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Fabric Name</label>
                      <input
                        type="text"
                        placeholder="e.g. S/J"
                        className="w-full border p-2 rounded"
                        value={line.fabricName}
                        onChange={e => handleLineChange(index, 'fabricName', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Fabric Colour</label>
                      <input
                        type="text"
                        className="w-full border p-2 rounded"
                        value={line.fabricColour}
                        onChange={e => handleLineChange(index, 'fabricColour', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Yarn Count</label>
                      <input
                        type="text"
                        className="w-full border p-2 rounded"
                        value={line.yarnCount}
                        onChange={e => handleLineChange(index, 'yarnCount', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Dia / GG</label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="Dia"
                          className="w-full border p-2 rounded"
                          value={line.dia}
                          onChange={e => handleLineChange(index, 'dia', e.target.value)}
                        />
                        <input
                          type="text"
                          placeholder="GG"
                          className="w-full border p-2 rounded"
                          value={line.gg}
                          onChange={e => handleLineChange(index, 'gg', e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Loop Length</label>
                      <input
                        type="text"
                        className="w-full border p-2 rounded"
                        value={line.loopLength}
                        onChange={e => handleLineChange(index, 'loopLength', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Pre-Assigned Dyer</label>
                      <select
                        className="w-full border p-2 rounded"
                        value={line.preAssignedDyerId}
                        onChange={e => handleLineChange(index, 'preAssignedDyerId', e.target.value)}
                      >
                        <option value="">None</option>
                        {dyers.map((d:any) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1">Expected Rolls</label>
                      <input
                        type="number"
                        className="w-full border p-2 rounded"
                        value={line.expectedRolls}
                        onChange={e => handleLineChange(index, 'expectedRolls', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} className="text-black">
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                Create Memo
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
