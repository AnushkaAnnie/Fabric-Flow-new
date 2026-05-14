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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function GreyFabricInwardPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    receiptDate: '',
    supplierName: '',
    fabricType: '',
    colour: '',
    totalWeight: '',
    rollCount: '',
    ratePerKg: '',
    purchaseAccount: 'C.N.T.LLP',
    remarks: '',
  });

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['grey-fabric-inward'],
    queryFn: async () => {
      const { data } = await api.get('/grey-fabric-inward');
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: (body: any) => api.post('/grey-fabric-inward', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grey-fabric-inward'] });
      toast.success('Grey fabric inward recorded');
      setOpen(false);
      setForm({
        receiptDate: '',
        supplierName: '',
        fabricType: '',
        colour: '',
        totalWeight: '',
        rollCount: '',
        ratePerKg: '',
        purchaseAccount: 'C.N.T.LLP',
        remarks: '',
      });
    },
    onError: () => toast.error('Failed to save inward record'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      receiptDate: form.receiptDate,
      supplierName: form.supplierName,
      fabricType: form.fabricType,
      colour: form.colour,
      totalWeight: Number(form.totalWeight),
      rollCount: form.rollCount ? Number(form.rollCount) : undefined,
      ratePerKg: form.ratePerKg ? Number(form.ratePerKg) : undefined,
      purchaseAccount: form.purchaseAccount,
      remarks: form.remarks,
    });
  };

  const totalCost =
    Number(form.totalWeight || 0) * Number(form.ratePerKg || 0);

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Grey Fabric Inward</h1>
        <Button onClick={() => setOpen(true)}>Add Inward Record</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Inward Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Fabric Type</TableHead>
                <TableHead>Colour</TableHead>
                <TableHead>Weight (kg)</TableHead>
                <TableHead>Rolls</TableHead>
                <TableHead>Rate/kg</TableHead>
                <TableHead>Total Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell>{r.id}</TableCell>
                  <TableCell>{new Date(r.receiptDate).toLocaleDateString()}</TableCell>
                  <TableCell>{r.supplierName}</TableCell>
                  <TableCell>{r.fabricType}</TableCell>
                  <TableCell>{r.colour}</TableCell>
                  <TableCell>{r.totalWeight}</TableCell>
                  <TableCell>{r.rollCount}</TableCell>
                  <TableCell>₹{r.ratePerKg}</TableCell>
                  <TableCell>₹{r.totalCost}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Grey Fabric Inward</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="date">Receipt Date</Label>
              <Input
                id="date"
                type="date"
                value={form.receiptDate}
                onChange={(e) => setForm({ ...form, receiptDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="supplier">Supplier Name *</Label>
              <Input
                id="supplier"
                value={form.supplierName}
                onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fabricType">Fabric Type</Label>
                <Input
                  id="fabricType"
                  value={form.fabricType}
                  onChange={(e) => setForm({ ...form, fabricType: e.target.value })}
                  placeholder="e.g. INTERLOCK"
                />
              </div>
              <div>
                <Label htmlFor="colour">Colour</Label>
                <Input
                  id="colour"
                  value={form.colour}
                  onChange={(e) => setForm({ ...form, colour: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weight">Total Weight (kg) *</Label>
                <Input
                  id="weight"
                  type="number"
                  value={form.totalWeight}
                  onChange={(e) => setForm({ ...form, totalWeight: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="rolls">Roll Count</Label>
                <Input
                  id="rolls"
                  type="number"
                  value={form.rollCount}
                  onChange={(e) => setForm({ ...form, rollCount: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="rate">Rate per Kg (₹)</Label>
              <Input
                id="rate"
                type="number"
                value={form.ratePerKg}
                onChange={(e) => setForm({ ...form, ratePerKg: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="account">Purchase Account</Label>
              <Input
                id="account"
                value={form.purchaseAccount}
                onChange={(e) => setForm({ ...form, purchaseAccount: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="remarks">Remarks</Label>
              <Input
                id="remarks"
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              />
            </div>
            <div className="flex justify-between text-sm bg-muted p-3 rounded">
              <span>
                Total Cost: <strong>₹{totalCost}</strong>
              </span>
            </div>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Create Inward'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
