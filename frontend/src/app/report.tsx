import { useRouter } from "expo-router";
import { SafetyReport } from "../features/reports/Reports";
import { Screen } from "../components/ui";
export default function SafetyReportRoute() {
  const router = useRouter();

  return (
    <Screen>
      <SafetyReport 
      visible={true} 
      onClose={() => router.back()}
       />
    </Screen>
  );
}