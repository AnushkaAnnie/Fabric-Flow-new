import MasterDataEntityPage from "@/components/master-data/MasterDataEntityPage";
import { masterDataConfig } from "@/lib/master-data-config";

export default function YarnQualitiesPage() {
  const config = masterDataConfig.find((item) => item.entity === "yarn-qualities");
  if (!config) return null;
  return <MasterDataEntityPage {...config} />;
}
