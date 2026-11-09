import { useRouter } from "expo-router";
import { SafetyReport } from "../features/reports/Reports";
export default function SafetyReportRoute() {
  const router = useRouter();
  return <SafetyReport visible onClose={() => router.back()} />;
}
