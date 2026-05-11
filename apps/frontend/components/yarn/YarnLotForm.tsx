'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import type { YarnLot, YarnLotFormData, Mill } from '@/types/yarn';

interface YarnLotFormProps {
  initial?: YarnLot | null;
  mills: Mill[];
  onSubmit: (data: YarnLotFormData) => void;
  isSubmitting: boolean;
}

export function YarnLotForm({
  initial,
  mills,
  onSubmit,
  isSubmitting,
}: YarnLotFormProps) {
  const [form, setForm] = useState({
    hfCode: '',
    millId: '',
    numBags: '',
    bagWeight: '',
    ratePerKg: '',
    description: '',
    count: '',
  });

  useEffect(() => {
    if (initial) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        hfCode: initial.hfCode || '',
        millId: String(initial.millId || ''),
        numBags: String(initial.numBags || ''),
        bagWeight: String(initial.bagWeight || ''),
        ratePerKg: String(initial.ratePerKg || ''),
        description: initial.description || '',
        count: initial.count || '',
      });
    }
  }, [initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      hfCode: form.hfCode,
      millId: Number(form.millId),
      numBags: Number(form.numBags),
      bagWeight: Number(form.bagWeight),
      ratePerKg: Number(form.ratePerKg),
      description: form.description,
      count: form.count,
    });
  };

  const totalWeight =
    Number(form.numBags || 0) * Number(form.bagWeight || 0);
  const totalCost = totalWeight * Number(form.ratePerKg || 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="hfCode">HF Code *</Label>
          <Input
            id="hfCode"
            value={form.hfCode}
            onChange={(e) => setForm({ ...form, hfCode: e.target.value })}
            required
            placeholder="e.g. HF-001"
          />
        </div>
        <div>
          <Label>Mill *</Label>
          <Select
            value={form.millId}
            onValueChange={(v) => setForm({ ...form, millId: v || '' })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select mill" />
            </SelectTrigger>
            <SelectContent>
              {mills.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="numBags">Number of Bags *</Label>
          <Input
            id="numBags"
            type="number"
            value={form.numBags}
            onChange={(e) => setForm({ ...form, numBags: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="bagWeight">Bag Weight (kg) *</Label>
          <Input
            id="bagWeight"
            type="number"
            value={form.bagWeight}
            onChange={(e) => setForm({ ...form, bagWeight: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="ratePerKg">Rate per Kg (₹) *</Label>
          <Input
            id="ratePerKg"
            type="number"
            value={form.ratePerKg}
            onChange={(e) => setForm({ ...form, ratePerKg: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="count">Count</Label>
          <Input
            id="count"
            value={form.count}
            onChange={(e) => setForm({ ...form, count: e.target.value })}
          />
        </div>
      </div>
      <div className="flex justify-between text-sm bg-muted p-3 rounded">
        <span>
          Total Weight: <strong>{totalWeight} kg</strong>
        </span>
        <span>
          Total Cost: <strong>₹{totalCost}</strong>
        </span>
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        {initial ? 'Update Lot' : 'Create Lot'}
      </Button>
    </form>
  );
}
