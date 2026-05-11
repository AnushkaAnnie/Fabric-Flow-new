'use client';
import { useState } from 'react';
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

interface Knitter {
  id: number;
  name: string;
}

interface IssueFormProps {
  lot: {
    id: number;
    hfCode: string;
    availableWeight: number;
  };
  knitters: Knitter[];
  onSubmit: (data: { knitterId: number; weight: number }) => void;
  isSubmitting: boolean;
}

export function IssueForm({ lot, knitters, onSubmit, isSubmitting }: IssueFormProps) {
  const [knitterId, setKnitterId] = useState('');
  const [weight, setWeight] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      knitterId: Number(knitterId),
      weight: Number(weight),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Yarn Lot</Label>
        <p className="text-sm text-muted-foreground">
          {lot.hfCode} – Available: {lot.availableWeight} kg
        </p>
      </div>
      <div>
        <Label>Knitter *</Label>
        <Select value={knitterId} onValueChange={setKnitterId}>
          <SelectTrigger>
            <SelectValue placeholder="Select knitter" />
          </SelectTrigger>
          <SelectContent>
            {knitters.map((k) => (
              <SelectItem key={k.id} value={String(k.id)}>
                {k.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="weight">Weight to Issue (kg) *</Label>
        <Input
          id="weight"
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          max={lot.availableWeight}
          required
        />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Issue
      </Button>
    </form>
  );
}
