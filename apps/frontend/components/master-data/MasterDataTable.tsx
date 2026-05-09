"use client";

type Column = {
  key: string;
  header: string;
};

type RowData = {
  id: string;
  [key: string]: unknown;
};

type MasterDataTableProps = {
  columns: Column[];
  data: RowData[];
  isLoading?: boolean;
  onEdit: (id: string, values: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
};

export default function MasterDataTable({
  columns,
  data,
  isLoading,
  onEdit,
  onDelete,
}: MasterDataTableProps) {
  if (isLoading) {
    return <div className="rounded-lg border border-slate-800 p-4 text-slate-400">Loading...</div>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-800">
      <table className="w-full text-sm">
        <thead className="bg-slate-900/80">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-3 text-left font-medium text-slate-300">
                {column.header}
              </th>
            ))}
            <th className="px-4 py-3 text-left font-medium text-slate-300">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="px-4 py-6 text-center text-slate-500">
                No records found
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={row.id} className="border-t border-slate-800">
                {columns.map((column) => (
                  <td key={`${row.id}-${column.key}`} className="px-4 py-3 text-slate-200">
                    {String(row[column.key] ?? "")}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(row.id, row)}
                      className="rounded border border-blue-600/40 px-3 py-1 text-blue-300 hover:bg-blue-600/10"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(row.id)}
                      className="rounded border border-red-600/40 px-3 py-1 text-red-300 hover:bg-red-600/10"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
