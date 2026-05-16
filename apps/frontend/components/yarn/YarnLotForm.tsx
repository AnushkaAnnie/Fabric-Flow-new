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
    totalWeight: '',
    ratePerKg: '',
    description: '',
    count: '',
  });

  useEffect(() => {
    if (initial) {
      setForm({
        hfCode: initial.hfCode || '',
        millId: String(initial.millId || ''),
        totalWeight: String(initial.totalWeight || ''),
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
      totalWeight: Number(form.totalWeight),
      ratePerKg: Number(form.ratePerKg),
      description: form.description,
      count: form.count,
    });
  };

  const totalCost = (Number(form.totalWeight) || 0) * (Number(form.ratePerKg) || 0);

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
          <Label htmlFor="totalWeight">Total Weight (kg) *</Label>
          <Input
            id="totalWeight"
            type="number"
            step="any"
            value={form.totalWeight}
            onChange={(e) => setForm({ ...form, totalWeight: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="ratePerKg">Rate per Kg (₹) *</Label>
          <Input
            id="ratePerKg"
            type="number"
            step="any"
            value={form.ratePerKg}
            onChange={(e) => setForm({ ...form, ratePerKg: e.target.value })}
            required
          />
        </div>
        <div className="col-span-2">
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
          Total Cost: <strong>₹{totalCost.toFixed(2)}</strong>
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
