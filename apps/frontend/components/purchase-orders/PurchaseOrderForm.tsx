'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, FileText, Download } from 'lucide-react';
import PurchaseOrderPreview from './PurchaseOrderPreview';
import { generatePOPDF } from '@/lib/generatePOPDF';

interface POItem {
  description: string;
  count: string;
  quality: string;
  bags: number;
  bagWeight: number;
  totalWeight: number;
  rate: number;
  cgst: number;
  sgst: number;
}

interface POFormData {
  poNumber: string;
  hfCode: string;
  agent: string;
  date: string;
  deliveryDate: string;
  supplierName: string;
  supplierAddress: string;
  supplierGST: string;
  deliveryName: string;
  deliveryAddress: string;
  deliveryGST: string;
  items: POItem[];
}

const EMPTY_FORM: POFormData = {
  poNumber: '',
  hfCode: '',
  agent: '',
  date: new Date().toISOString().split('T')[0],
  deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  supplierName: '',
  supplierAddress: '',
  supplierGST: '',
  deliveryName: 'CHHAVI NEETU TEXTILES LLP',
  deliveryAddress: 'No. 789, Kallangayam, Andipalayam, Tirupur - 641601',
  deliveryGST: '33AATFC5860D1ZC',
  items: [
    {
      description: '',
      count: '',
      quality: '',
      bags: 0,
      bagWeight: 0,
      totalWeight: 0,
      rate: 0,
      cgst: 9,
      sgst: 9,
    },
  ],
};

export default function PurchaseOrderForm() {
  const queryClient = useQueryClient();
  const [previewOpen, setPreviewOpen] = useState(false);

  const form = useForm<POFormData>({
    defaultValues: EMPTY_FORM,
  });

  const { control, register, handleSubmit, watch, setValue, getValues } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  // Watch items to dynamically calculate totals and weights
  const watchedItems = watch('items');

  // Query existing POs for review and listing
  const { data: purchaseOrders = [] } = useQuery<any[]>({
    queryKey: ['purchase-orders'],
    queryFn: async () => {
      const response = await api.get('/purchase-orders');
      return response.data;
    },
  });

  // Create PO Mutation
  const createMutation = useMutation({
    mutationFn: async (data: POFormData) => {
      const response = await api.post('/purchase-orders', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Purchase Order saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      form.reset(EMPTY_FORM);
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('Failed to save Purchase Order to database');
    },
  });

  // Handle dynamic weight calculation when bags or bagWeight change
  const handleBagsOrWeightChange = (index: number) => {
    const item = getValues(`items.${index}`);
    const bags = Number(item.bags) || 0;
    const bagWeight = Number(item.bagWeight) || 0;
    setValue(`items.${index}.totalWeight`, Number((bags * bagWeight).toFixed(2)));
  };

  const addRow = () => {
    append({
      description: '',
      count: '',
      quality: '',
      bags: 0,
      bagWeight: 0,
      totalWeight: 0,
      rate: 0,
      cgst: 9,
      sgst: 9,
    });
  };

  const handleConfirm = async () => {
    const formData = getValues();
    
    // Save to the database
    await createMutation.mutateAsync(formData);

    // Generate and download the PDF using the exact template rendered in the DOM
    setTimeout(async () => {
      await generatePOPDF(formData.poNumber);
      setPreviewOpen(false);
    }, 500);
  };

  // Grand totals computed for display
  const grandTotal = watchedItems.reduce((acc, item) => {
    const tw = Number(item.totalWeight) || 0;
    const rate = Number(item.rate) || 0;
    const taxable = tw * rate;
    const cgst = taxable * ((Number(item.cgst) || 0) / 100);
    const sgst = taxable * ((Number(item.sgst) || 0) / 100);
    return acc + taxable + cgst + sgst;
  }, 0);

  return (
    <div className="space-y-8">
      <Card className="bg-slate-900 border-slate-800 text-white shadow-xl">
        <CardHeader className="border-b border-slate-800 pb-4">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <FileText className="text-primary w-6 h-6" /> Create Yarn Purchase Order
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(() => setPreviewOpen(true))} className="space-y-6">
            
            {/* HEADER GRID */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label className="text-slate-300 font-semibold text-xs uppercase tracking-wider">PO Number *</Label>
                <Input
                  className="bg-slate-800 border-slate-700 mt-1 text-white focus:ring-primary"
                  placeholder="e.g. PO-001"
                  required
                  {...register('poNumber')}
                />
              </div>
              <div>
                <Label className="text-slate-300 font-semibold text-xs uppercase tracking-wider">HF Code *</Label>
                <Input
                  className="bg-slate-800 border-slate-700 mt-1 text-white focus:ring-primary"
                  placeholder="e.g. HF-72"
                  required
                  {...register('hfCode')}
                />
              </div>
              <div>
                <Label className="text-slate-300 font-semibold text-xs uppercase tracking-wider">Agent</Label>
                <Input
                  className="bg-slate-800 border-slate-700 mt-1 text-white focus:ring-primary"
                  placeholder="e.g. Self / Agent Name"
                  {...register('agent')}
                />
              </div>
              <div>
                <Label className="text-slate-300 font-semibold text-xs uppercase tracking-wider">PO Date *</Label>
                <Input
                  type="date"
                  className="bg-slate-800 border-slate-700 mt-1 text-white focus:ring-primary"
                  required
                  {...register('date')}
                />
              </div>
              <div>
                <Label className="text-slate-300 font-semibold text-xs uppercase tracking-wider">Delivery Date *</Label>
                <Input
                  type="date"
                  className="bg-slate-800 border-slate-700 mt-1 text-white focus:ring-primary"
                  required
                  {...register('deliveryDate')}
                />
              </div>
            </div>

            {/* ADDRESS SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Supplier Info */}
              <Card className="bg-slate-800 border-slate-700 text-white shadow-md">
                <CardHeader className="border-b border-slate-700 py-3 bg-slate-900/50">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary">Supplier Details</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div>
                    <Label className="text-slate-300 font-semibold text-xs uppercase">Supplier Name *</Label>
                    <Input
                      className="bg-slate-900 border-slate-700 mt-1 text-white focus:ring-primary"
                      placeholder="e.g. ABC Spinning Mills"
                      required
                      {...register('supplierName')}
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 font-semibold text-xs uppercase">Supplier Address *</Label>
                    <textarea
                      rows={3}
                      className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 mt-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="e.g. 123 Textile Street, Tirupur"
                      required
                      {...register('supplierAddress')}
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 font-semibold text-xs uppercase">Supplier GSTIN *</Label>
                    <Input
                      className="bg-slate-900 border-slate-700 mt-1 text-white focus:ring-primary"
                      placeholder="e.g. 33AATFC5860D1ZC"
                      required
                      {...register('supplierGST')}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Info */}
              <Card className="bg-slate-800 border-slate-700 text-white shadow-md">
                <CardHeader className="border-b border-slate-700 py-3 bg-slate-900/50">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary">Delivery Address</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div>
                    <Label className="text-slate-300 font-semibold text-xs uppercase">Delivery Name *</Label>
                    <Input
                      className="bg-slate-900 border-slate-700 mt-1 text-white focus:ring-primary"
                      required
                      {...register('deliveryName')}
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 font-semibold text-xs uppercase">Delivery Address *</Label>
                    <textarea
                      rows={3}
                      className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 mt-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      required
                      {...register('deliveryAddress')}
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300 font-semibold text-xs uppercase">Delivery GSTIN *</Label>
                    <Input
                      className="bg-slate-900 border-slate-700 mt-1 text-white focus:ring-primary"
                      required
                      {...register('deliveryGST')}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* DYNAMIC ITEMS SECTION */}
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h3 className="text-base font-semibold uppercase tracking-wider text-slate-200">Particulars / Items</h3>
                <Button type="button" size="sm" className="bg-primary hover:bg-primary/90 text-white flex items-center gap-1 font-semibold" onClick={addRow}>
                  <Plus className="w-4 h-4" /> Add Row
                </Button>
              </div>

              <div className="overflow-x-auto rounded border border-slate-750">
                <Table className="text-slate-200 min-w-[900px]">
                  <TableHeader className="bg-slate-800/80 border-b border-slate-750">
                    <TableRow className="hover:bg-slate-800/80 border-slate-750">
                      <TableHead className="text-slate-300 font-semibold w-[22%]">Description</TableHead>
                      <TableHead className="text-slate-300 font-semibold w-[10%]">Count</TableHead>
                      <TableHead className="text-slate-300 font-semibold w-[10%]">Quality</TableHead>
                      <TableHead className="text-slate-300 font-semibold w-[8%] text-center">Bags</TableHead>
                      <TableHead className="text-slate-300 font-semibold w-[8%] text-center">Bag Wt (kg)</TableHead>
                      <TableHead className="text-slate-300 font-semibold w-[10%] text-center">Total Wt (kg)</TableHead>
                      <TableHead className="text-slate-300 font-semibold w-[10%] text-center">Rate / kg</TableHead>
                      <TableHead className="text-slate-300 font-semibold w-[6%] text-center">CGST (%)</TableHead>
                      <TableHead className="text-slate-300 font-semibold w-[6%] text-center">SGST (%)</TableHead>
                      <TableHead className="text-slate-300 font-semibold w-[10%] text-center">Total</TableHead>
                      <TableHead className="text-slate-300 font-semibold w-[5%] text-center"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-800">
                    {fields.map((field, index) => {
                      const item = watchedItems?.[index] || field;
                      const bags = Number(item.bags) || 0;
                      const bagWeight = Number(item.bagWeight) || 0;
                      const totalWeight = bags * bagWeight;
                      const rate = Number(item.rate) || 0;
                      const taxable = totalWeight * rate;
                      const cgstRate = Number(item.cgst) || 0;
                      const sgstRate = Number(item.sgst) || 0;
                      const cgstAmount = taxable * (cgstRate / 100);
                      const sgstAmount = taxable * (sgstRate / 100);
                      const total = taxable + cgstAmount + sgstAmount;

                      return (
                        <TableRow key={field.id} className="hover:bg-slate-800/40 border-slate-800 text-white font-medium">
                          {/* Description */}
                          <TableCell className="p-2">
                            <Input
                              className="bg-slate-900 border-slate-700 text-white text-xs"
                              placeholder="e.g. 30s Combed Cotton"
                              required
                              {...register(`items.${index}.description` as const)}
                            />
                          </TableCell>
                          {/* Count */}
                          <TableCell className="p-2">
                            <Input
                              className="bg-slate-900 border-slate-700 text-white text-xs"
                              placeholder="e.g. 30s"
                              required
                              {...register(`items.${index}.count` as const)}
                            />
                          </TableCell>
                          {/* Quality */}
                          <TableCell className="p-2">
                            <Input
                              className="bg-slate-900 border-slate-700 text-white text-xs"
                              placeholder="e.g. Combed"
                              required
                              {...register(`items.${index}.quality` as const)}
                            />
                          </TableCell>
                          {/* Bags */}
                          <TableCell className="p-2 text-center">
                            <Input
                              type="number"
                              className="bg-slate-900 border-slate-700 text-white text-xs text-center"
                              required
                              {...register(`items.${index}.bags` as const, {
                                valueAsNumber: true,
                                onChange: () => handleBagsOrWeightChange(index),
                              })}
                            />
                          </TableCell>
                          {/* Bag Weight */}
                          <TableCell className="p-2 text-center">
                            <Input
                              type="number"
                              step="0.01"
                              className="bg-slate-900 border-slate-700 text-white text-xs text-center"
                              required
                              {...register(`items.${index}.bagWeight` as const, {
                                valueAsNumber: true,
                                onChange: () => handleBagsOrWeightChange(index),
                              })}
                            />
                          </TableCell>
                          {/* Total Weight */}
                          <TableCell className="p-2 text-center">
                            <Input
                              type="number"
                              step="0.01"
                              className="bg-slate-900 border-slate-700 text-white text-xs text-center font-bold text-primary"
                              required
                              {...register(`items.${index}.totalWeight` as const, { valueAsNumber: true })}
                            />
                          </TableCell>
                          {/* Rate */}
                          <TableCell className="p-2 text-center">
                            <Input
                              type="number"
                              step="0.01"
                              className="bg-slate-900 border-slate-700 text-white text-xs text-center"
                              required
                              {...register(`items.${index}.rate` as const, { valueAsNumber: true })}
                            />
                          </TableCell>
                          {/* CGST */}
                          <TableCell className="p-2 text-center">
                            <Input
                              type="number"
                              step="0.1"
                              className="bg-slate-900 border-slate-700 text-white text-xs text-center"
                              required
                              {...register(`items.${index}.cgst` as const, { valueAsNumber: true })}
                            />
                          </TableCell>
                          {/* SGST */}
                          <TableCell className="p-2 text-center">
                            <Input
                              type="number"
                              step="0.1"
                              className="bg-slate-900 border-slate-700 text-white text-xs text-center"
                              required
                              {...register(`items.${index}.sgst` as const, { valueAsNumber: true })}
                            />
                          </TableCell>
                          {/* Calculated Row Total */}
                          <TableCell className="p-2 text-center font-bold text-sm text-green-400">
                            ₹{total.toFixed(2)}
                          </TableCell>
                          {/* Delete Row Action */}
                          <TableCell className="p-2 text-center">
                            {fields.length > 1 && (
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-slate-800"
                                onClick={() => remove(index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* GRAND TOTAL SUMMARY PANEL */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-800 p-4 rounded-lg border border-slate-700">
              <div className="text-sm font-semibold text-slate-300">
                Number of unique items: <span className="text-white text-lg font-bold ml-1">{fields.length}</span>
              </div>
              <div className="text-right">
                <span className="text-sm text-slate-300 font-semibold mr-2 uppercase tracking-wide">Grand Total:</span>
                <span className="text-2xl font-black text-green-400">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* PREVIEW SUBMIT BUTTON */}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="submit" size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold tracking-wider px-6 uppercase shadow-lg">
                Preview PO
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* HISTORICAL PURCHASE ORDERS LIST */}
      <Card className="bg-slate-900 border-slate-800 text-white shadow-xl mt-6">
        <CardHeader className="border-b border-slate-800 pb-4">
          <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-200">
            <Download className="text-primary w-5 h-5" /> Previously Generated Purchase Orders
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {purchaseOrders.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm italic border border-dashed border-slate-800 rounded">
              No historical purchase orders found in the database.
            </div>
          ) : (
            <div className="overflow-x-auto rounded border border-slate-800">
              <Table className="text-slate-200">
                <TableHeader className="bg-slate-800/50">
                  <TableRow className="hover:bg-slate-800/50 border-slate-800">
                    <TableHead className="text-slate-300 font-semibold">PO Number</TableHead>
                    <TableHead className="text-slate-300 font-semibold">HF Code</TableHead>
                    <TableHead className="text-slate-300 font-semibold">Supplier Name</TableHead>
                    <TableHead className="text-slate-300 font-semibold">Date</TableHead>
                    <TableHead className="text-slate-300 font-semibold">Agent</TableHead>
                    <TableHead className="text-slate-300 font-semibold text-center">No. of Items</TableHead>
                    <TableHead className="text-slate-300 font-semibold text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-800">
                  {purchaseOrders.map((po) => (
                    <TableRow key={po.id} className="hover:bg-slate-800/20 border-slate-800 text-white">
                      <TableCell className="font-semibold">{po.poNumber}</TableCell>
                      <TableCell>{po.hfCode}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{po.supplierName}</TableCell>
                      <TableCell>{new Date(po.date).toLocaleDateString()}</TableCell>
                      <TableCell>{po.agent || '—'}</TableCell>
                      <TableCell className="text-center font-bold">{po.items?.length || 0}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-primary hover:text-primary/80 hover:bg-slate-800 flex items-center gap-1 mx-auto"
                          onClick={async () => {
                            // Render exact HTML of item using template and download as PDF
                            const overlay = document.createElement('div');
                            overlay.style.position = 'fixed';
                            overlay.style.top = '-9999px';
                            overlay.style.left = '-9999px';
                            document.body.appendChild(overlay);

                            // We can render and print directly
                            const printContainer = document.createElement('div');
                            printContainer.id = 'po-print';
                            overlay.appendChild(printContainer);

                            // Render text content or invoke printer
                            toast.loading('Generating PDF for ' + po.poNumber + '...');
                            
                            // Recreate matching elements inside document to generate PDF
                            const content = document.getElementById(`po-pdf-overlay-${po.id}`);
                            if (content) {
                              const originalId = content.id;
                              content.id = 'po-print';
                              await generatePOPDF(po.poNumber);
                              content.id = originalId;
                              toast.dismiss();
                              toast.success('PDF generated successfully!');
                            } else {
                              toast.dismiss();
                              toast.error('Template rendering container not found.');
                            }
                          }}
                        >
                          <Download className="w-4 h-4" /> Download PDF
                        </Button>

                        {/* Hidden container specifically for exporting PDF of historical item */}
                        <div className="hidden">
                          <div id={`po-pdf-overlay-${po.id}`}>
                            <PurchaseOrderPreview
                              open={true}
                              onClose={() => {}}
                              data={po}
                              onConfirm={() => {}}
                            />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* RENDER PREVIEW MODAL */}
      <PurchaseOrderPreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        data={watchedItems ? { ...form.getValues(), items: watchedItems } : form.getValues()}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
