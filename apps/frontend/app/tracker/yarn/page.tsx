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
import { Package2, ArrowRightLeft } from 'lucide-react';
import { YarnLotForm } from '@/components/yarn/YarnLotForm';
import { IssueForm } from '@/components/yarn/IssueForm';

export default function YarnPage() {
  const queryClient = useQueryClient();
  const [selectedLot, setSelectedLot] = useState<any>(null);
  const [issueOpen, setIssueOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editLot, setEditLot] = useState<any>(null);

  const { data: lots = [], isLoading } = useQuery({
    queryKey: ['yarn-lots'],
    queryFn: async () => {
      const { data } = await api.get('/yarn-lots');
      return data;
    },
  });

  const { data: mills = [] } = useQuery({
    queryKey: ['mills'],
    queryFn: async () => {
      const { data } = await api.get('/mills');
      return data;
    },
  });

  const { data: knitters = [] } = useQuery({
    queryKey: ['knitters'],
    queryFn: async () => {
      const { data } = await api.get('/knitters');
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (form: any) => api.post('/yarn-lots', form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yarn-lots'] });
      toast.success('Yarn lot created');
      setCreateOpen(false);
    },
    onError: () => toast.error('Failed to create yarn lot'),
  });

  const issueMutation = useMutation({
    mutationFn: ({ id, ...body }: any) =>
      api.post(`/yarn-lots/${id}/issue`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yarn-lots'] });
      toast.success('Yarn issued to knitter');
      setIssueOpen(false);
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Issue failed'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: any) => api.patch(`/yarn-lots/${id}`, body),
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

      <Card>
        <CardHeader>
          <CardTitle>All Yarn Lots</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>HF Code</TableHead>
                <TableHead>Mill</TableHead>
                <TableHead>Total (kg)</TableHead>
                <TableHead>Available (kg)</TableHead>
                <TableHead>Bags</TableHead>
                <TableHead>Rate/kg</TableHead>
                <TableHead>Total Cost</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lots.map((lot: any) => (
                <TableRow key={lot.id}>
                  <TableCell className="font-medium">{lot.hfCode}</TableCell>
                  <TableCell>{lot.mill?.name}</TableCell>
                  <TableCell>{lot.totalWeight}</TableCell>
                  <TableCell>{lot.availableWeight}</TableCell>
                  <TableCell>{lot.numBags}</TableCell>
                  <TableCell>₹{lot.ratePerKg}</TableCell>
                  <TableCell>₹{lot.totalCost}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedLot(lot);
                        setIssueOpen(true);
                      }}
                      disabled={lot.availableWeight <= 0}
                    >
                      <ArrowRightLeft className="mr-1 h-3 w-3" /> Issue
                    </Button>
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) setEditLot(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editLot ? 'Edit Yarn Lot' : 'Add New Yarn Lot'}</DialogTitle>
          </DialogHeader>
          <YarnLotForm
            initial={editLot}
            mills={mills}
            onSubmit={(data) => {
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

      {/* Issue to Knitter Dialog */}
      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue Yarn to Knitter</DialogTitle>
          </DialogHeader>
          {selectedLot && (
            <IssueForm
              lot={selectedLot}
              knitters={knitters}
              onSubmit={(data) =>
                issueMutation.mutate({ id: selectedLot.id, ...data })
              }
              isSubmitting={issueMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
