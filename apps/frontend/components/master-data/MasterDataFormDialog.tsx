"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

export type FormField = {
  name: string;
  label: string;
  type: "text" | "number";
  required: boolean;
  validation?: {
    pattern: string;
    message: string;
  };
};

type MasterDataFormDialogProps = {
  title: string;
  fields: FormField[];
  openLabel: string;
  submitLabel: string;
  defaultValues?: Record<string, unknown>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (values: Record<string, unknown>) => void;
};

function getSchema(fields: FormField[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) {
    let schema: z.ZodTypeAny;
    
    if (field.type === "number") {
      schema = field.required
        ? z.coerce.number()
        : z.union([z.coerce.number(), z.literal("")]).optional();
    } else {
      let strSchema: z.ZodTypeAny = z.string();
      if (field.required) {
        strSchema = (strSchema as z.ZodString).min(1, `${field.label} is required`);
      } else {
        strSchema = strSchema.optional().or(z.literal(""));
      }

      if (field.validation?.pattern) {
        const regex = new RegExp(field.validation.pattern);
        schema = strSchema.refine(
          (val) => !val || regex.test(val as string),
          { message: field.validation!.message }
        );
      } else {
        schema = strSchema;
      }
    }
    shape[field.name] = schema;
  }
  return z.object(shape);
}

export default function MasterDataFormDialog({
  title,
  fields,
  openLabel,
  submitLabel,
  defaultValues,
  open: controlledOpen,
  onOpenChange,
  onSubmit,
}: MasterDataFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const schema = useMemo(() => getSchema(fields), [fields]);
  const form = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues ?? {},
  });

  useEffect(() => {
    form.reset(defaultValues ?? {});
  }, [defaultValues, form, open]);

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit(values);
    setOpen(false);
    form.reset({});
  });

  return (
    <>
      {!onOpenChange && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mb-4 rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          {openLabel}
        </button>
      )}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-lg border border-slate-700 bg-slate-950 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{title}</h2>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-400">
                Close
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {fields.map((field) => (
                <div key={field.name} className="space-y-1">
                  <label className="text-sm text-slate-300" htmlFor={field.name}>
                    {field.label}
                  </label>
                  <input
                    id={field.name}
                    type={field.type}
                    {...form.register(field.name)}
                    className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                  />
                  {form.formState.errors[field.name] && (
                    <p className="text-xs text-red-400">
                      {form.formState.errors[field.name]?.message?.toString() || `Invalid ${field.label.toLowerCase()}`}
                    </p>
                  )}
                </div>
              ))}
              <button
                type="submit"
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
              >
                {submitLabel}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
