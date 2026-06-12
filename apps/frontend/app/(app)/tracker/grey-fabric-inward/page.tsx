'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PlusCircle, Pencil, Trash2, Layers } from 'lucide-react';
import type { GreyFabricInward, GreyFabricInwardFormData } from '@/types/entities';
import { ProtectedRoute } from '@/components/auth/protected-route';

const SELECT_CLASS =
  'w-full rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all';

const EMPTY_FORM: GreyFabricInwardFormData = {
  receiptDate: new Date().toISOString().split('T')[0],
  supplierName: '',
  fabricType: '',
  colour: '',
  totalWeight: '',
  rollCount: '',
  ratePerKg: '',
  purchaseAccount: 'C.N.T.LLP',
  remarks: '',
};

const fmt = (v: number | null | undefined, prefix = '') =>
  v != null ? `${prefix}${Number(v).toFixed(2)}` : '–';

export default function FabricInventoryPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<GreyFabricInward | null>(null);
  const [form, setForm] = useState<GreyFabricInwardFormData>(EMPTY_FORM);

  const { data: records = [], isLoading } = useQuery<GreyFabricInward[]>({
    queryKey: ['grey-fabric-inward'],
    queryFn: async () => (await api.get<GreyFabricInward[]>('/grey-fabric-inward')).data,
  });

  const createMutation = useMutation<GreyFabricInward, Error, Record<string, unknown>>({
    mutationFn: (body) => api.post<GreyFabricInward>('/grey-fabric-inward', body).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grey-fabric-inward'] });
      toast.success('Fabric record created');
      closeDialogs();
    },
    onError: () => toast.error('Failed to create record'),
  });

  const updateMutation = useMutation<GreyFabricInward, Error, { id: number } & Record<string, unknown>>({
    mutationFn: ({ id, ...body }) => api.patch<GreyFabricInward>(`/grey-fabric-inward/${id}`, body).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grey-fabric-inward'] });
      toast.success('Fabric record updated');
      closeDialogs();
    },
    onError: () => toast.error('Failed to update record'),
  });

  const deleteMutation = useMutation<unknown, Error, number>({
    mutationFn: (id) => api.delete(`/grey-fabric-inward/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grey-fabric-inward'] });
      toast.success('Record deleted');
    },
    onError: () => toast.error('Failed to delete'),
  });

  const closeDialogs = () => {
    setCreateOpen(false);
    setEditRecord(null);
    setForm(EMPTY_FORM);
  };

  const openEdit = (r: GreyFabricInward) => {
    setEditRecord(r);
    setForm({
      receiptDate: r.receiptDate?.split('T')[0] ?? '',
      supplierName: r.supplierName,
      fabricType: r.fabricType ?? '',
      colour: r.colour ?? '',
      totalWeight: String(r.totalWeight),
      rollCount: r.rollCount != null ? String(r.rollCount) : '',
      ratePerKg: r.ratePerKg != null ? String(r.ratePerKg) : '',
      purchaseAccount: r.purchaseAccount ?? 'C.N.T.LLP',
      remarks: r.remarks ?? '',
    });
  };

  const confirmDelete = (id: number) => {
    if (window.confirm('Delete this fabric record?')) deleteMutation.mutate(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      receiptDate: form.receiptDate,
      supplierName: form.supplierName,
      fabricType: form.fabricType || undefined,
      colour: form.colour || undefined,
      totalWeight: Number(form.totalWeight),
      rollCount: form.rollCount ? Number(form.rollCount) : undefined,
      ratePerKg: form.ratePerKg ? Number(form.ratePerKg) : undefined,
      purchaseAccount: form.purchaseAccount || undefined,
      remarks: form.remarks || undefined,
    };
    if (editRecord) updateMutation.mutate({ id: editRecord.id, ...payload });
    else createMutation.mutate(payload);
  };

  const totalCost = Number(form.totalWeight || 0) * Number(form.ratePerKg || 0);
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <ProtectedRoute>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
              Fabric Inventory
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {isLoading ? 'Loading…' : `${records.length} record${records.length !== 1 ? 's' : ''} • Grey fabric purchases & stock`}
            </p>
          </div>
          <button
            onClick={() => { setEditRecord(null); setForm(EMPTY_FORM); setCreateOpen(true); }}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition-all duration-200"
          >
            <PlusCircle className="h-4 w-4" /> Add Fabric Inward
          </button>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 bg-slate-900/80 hover:bg-slate-900/80">
                  {['Date', 'Supplier', 'Fabric Type', 'Colour', 'Weight (kg)', 'Rolls', 'Rate/kg', 'Total Cost', 'Account', 'Actions'].map(h => (
                    <TableHead key={h} className="text-xs font-semibold uppercase tracking-widest text-slate-400">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-slate-800">
                      {Array.from({ length: 10 }).map((__, j) => (
                        <TableCell key={j}><div className="h-4 rounded bg-slate-800 animate-pulse" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-12 text-center text-sm text-slate-500">
                      No fabric records yet. Click &quot;Add Fabric Inward&quot; to create one.
                    </TableCell>
                  </TableRow>
                ) : records.map((r) => (
                  <TableRow key={r.id} className="border-slate-800/60 hover:bg-slate-800/20 transition-colors">
                    <TableCell className="text-slate-300 text-sm">{new Date(r.receiptDate).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell className="text-slate-200 font-medium">{r.supplierName}</TableCell>
                    <TableCell className="text-slate-300">{r.fabricType ?? '–'}</TableCell>
                    <TableCell className="text-slate-300">{r.colour ?? '–'}</TableCell>
                    <TableCell className="font-semibold text-slate-200">{fmt(r.totalWeight)} kg</TableCell>
                    <TableCell className="text-slate-300">{r.rollCount ?? '–'}</TableCell>
                    <TableCell className="text-slate-300">{fmt(r.ratePerKg, '₹')}</TableCell>
                    <TableCell className="font-semibold text-emerald-400">{fmt(r.totalCost, '₹')}</TableCell>
                    <TableCell className="text-slate-400 text-xs">{r.purchaseAccount ?? '–'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        <button title="Edit" onClick={() => openEdit(r)}
                          className="inline-flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-xs text-blue-300 hover:bg-blue-500/20 transition-all">
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button title="Delete" onClick={() => confirmDelete(r.id)} disabled={deleteMutation.isPending}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/20 transition-all disabled:opacity-50">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {records.length > 0 && !isLoading && (
            <div className="border-t border-slate-800/60 px-4 py-2.5 flex justify-between">
              <span className="text-xs text-slate-500">
                Total: <span className="text-slate-300 font-medium">{records.reduce((s, r) => s + Number(r.totalWeight), 0).toFixed(2)} kg</span> across {records.length} record{records.length !== 1 ? 's' : ''}
              </span>
              <span className="text-xs text-slate-500">{records.length} record{records.length !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Create / Edit Dialog */}
        <Dialog open={createOpen || editRecord !== null} onOpenChange={(open) => { if (!open) closeDialogs(); }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-slate-100 flex items-center gap-2">
                <Layers className="h-5 w-5 text-fuchsia-400" />
                {editRecord ? 'Edit Fabric Record' : 'New Grey Fabric Inward'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Receipt Date</Label>
                  <Input type="date" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={form.receiptDate} onChange={(e) => setForm({ ...form, receiptDate: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Supplier Name <span className="text-rose-400">*</span></Label>
                  <Input required placeholder="e.g. ABC Textiles" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={form.supplierName} onChange={(e) => setForm({ ...form, supplierName: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Fabric Type</Label>
                  <Input placeholder="e.g. INTERLOCK" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={form.fabricType} onChange={(e) => setForm({ ...form, fabricType: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Colour</Label>
                  <Input placeholder="e.g. Grey" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={form.colour} onChange={(e) => setForm({ ...form, colour: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Total Weight (kg) <span className="text-rose-400">*</span></Label>
                  <Input type="number" step="0.01" min="0" required className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={form.totalWeight} onChange={(e) => setForm({ ...form, totalWeight: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Roll Count</Label>
                  <Input type="number" min="0" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={form.rollCount} onChange={(e) => setForm({ ...form, rollCount: e.target.value })} />
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Rate per Kg (₹)</Label>
                <Input type="number" step="0.01" min="0" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                  value={form.ratePerKg} onChange={(e) => setForm({ ...form, ratePerKg: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Purchase Account</Label>
                  <Input placeholder="C.N.T.LLP" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={form.purchaseAccount} onChange={(e) => setForm({ ...form, purchaseAccount: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-400 mb-1.5 block">Remarks</Label>
                  <Input placeholder="Optional" className="bg-slate-800/80 border-slate-700/60 text-slate-200"
                    value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
                </div>
              </div>

              {/* Cost Summary */}
              <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Total Cost</span>
                  <span className="text-lg font-bold text-emerald-400">₹{totalCost.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={closeDialogs}
                  className="border-slate-700 hover:bg-slate-800 text-slate-300">
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}
                  className="flex-1 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-semibold disabled:opacity-60">
                  {isPending ? 'Saving…' : editRecord ? 'Update Record' : 'Create Record'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
