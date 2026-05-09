import type { FormField } from "@/components/master-data/MasterDataFormDialog";

export type MasterDataConfig = {
  entity: string;
  title: string;
  path: string;
  columns: { key: string; header: string }[];
  fields: FormField[];
};

const partyFields: FormField[] = [
  { name: "name", label: "Name", type: "text", required: true },
  { name: "code", label: "Code", type: "text", required: true },
  { name: "address", label: "Address", type: "text", required: false },
  { name: "contactPerson", label: "Contact Person", type: "text", required: false },
  { name: "email", label: "Email", type: "text", required: false },
  { name: "phone", label: "Phone", type: "text", required: false },
];

const partyColumns = [
  { key: "id", header: "ID" },
  { key: "name", header: "Name" },
  { key: "code", header: "Code" },
  { key: "contactPerson", header: "Contact Person" },
];

export const masterDataConfig: MasterDataConfig[] = [
  { entity: "mills", title: "Mills", path: "/tracker/master-data/mills", columns: partyColumns, fields: partyFields },
  { entity: "knitters", title: "Knitters", path: "/tracker/master-data/knitters", columns: partyColumns, fields: partyFields },
  { entity: "dyers", title: "Dyers", path: "/tracker/master-data/dyers", columns: partyColumns, fields: partyFields },
  { entity: "compacters", title: "Compacters", path: "/tracker/master-data/compacters", columns: partyColumns, fields: partyFields },
  {
    entity: "colours",
    title: "Colours",
    path: "/tracker/master-data/colours",
    columns: [
      { key: "id", header: "ID" },
      { key: "name", header: "Name" },
      { key: "code", header: "Code" },
      { key: "hexCode", header: "HEX" },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "code", label: "Code", type: "text", required: true },
      { name: "hexCode", label: "HEX Code", type: "text", required: false },
      { name: "description", label: "Description", type: "text", required: false },
    ],
  },
  {
    entity: "wash-types",
    title: "Wash Types",
    path: "/tracker/master-data/wash-types",
    columns: [
      { key: "id", header: "ID" },
      { key: "name", header: "Name" },
      { key: "code", header: "Code" },
      { key: "description", header: "Description" },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "code", label: "Code", type: "text", required: true },
      { name: "description", label: "Description", type: "text", required: false },
    ],
  },
  {
    entity: "yarn-qualities",
    title: "Yarn Qualities",
    path: "/tracker/master-data/yarn-qualities",
    columns: [
      { key: "id", header: "ID" },
      { key: "name", header: "Name" },
      { key: "code", header: "Code" },
      { key: "composition", header: "Composition" },
      { key: "count", header: "Count" },
    ],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "code", label: "Code", type: "text", required: true },
      { name: "composition", label: "Composition", type: "text", required: false },
      { name: "count", label: "Count", type: "text", required: false },
      { name: "description", label: "Description", type: "text", required: false },
    ],
  },
];
