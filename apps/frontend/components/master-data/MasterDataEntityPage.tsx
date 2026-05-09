"use client";

import { useState } from "react";
import MasterDataFormDialog, { type FormField } from "./MasterDataFormDialog";
import MasterDataTable from "./MasterDataTable";
import { useMasterData } from "@/hooks/useMasterData";

type MasterDataEntityPageProps = {
  entity: string;
  title: string;
  columns: { key: string; header: string }[];
  fields: FormField[];
};

export default function MasterDataEntityPage({
  entity,
  title,
  columns,
  fields,
}: MasterDataEntityPageProps) {
  const { data, isLoading, createMutation, updateMutation, deleteMutation } = useMasterData(entity);
  const [editingRow, setEditingRow] = useState<Record<string, unknown> | null>(null);

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <MasterDataFormDialog
        title={`Create ${title.slice(0, -1)}`}
        openLabel={`Add ${title.slice(0, -1)}`}
        submitLabel="Create"
        fields={fields}
        onSubmit={(values) => createMutation.mutate(values)}
      />
      <MasterDataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        onEdit={(_, row) => setEditingRow(row)}
        onDelete={(id) => deleteMutation.mutate(id)}
      />
      <MasterDataFormDialog
        title={`Edit ${title.slice(0, -1)}`}
        openLabel=""
        submitLabel="Update"
        fields={fields}
        open={Boolean(editingRow)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingRow(null);
          }
        }}
        defaultValues={editingRow ?? {}}
        onSubmit={(values) => {
          if (!editingRow?.id || typeof editingRow.id !== "string") {
            return;
          }
          updateMutation.mutate({ id: editingRow.id, ...values });
          setEditingRow(null);
        }}
      />
    </div>
  );
}
