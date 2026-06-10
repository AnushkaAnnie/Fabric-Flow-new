import MasterDataEntityPage from "@/components/master-data/MasterDataEntityPage";
import { masterDataConfig } from "@/lib/master-data-config";

export default function WashTypesPage() {
  const config = masterDataConfig.find((item) => item.entity === "wash-types");
  if (!config) return null;
  return <MasterDataEntityPage {...config} />;
}
