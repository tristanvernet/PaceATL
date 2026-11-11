import { useLocalSearchParams } from "expo-router";
import { ReportScreen } from "../features/reports/Reports";
import { ATLANTA } from "../features/routes/types";

const coordinate = (raw: string | undefined, limit: number) => {
  const value = Number(raw);
  return raw && Number.isFinite(value) && Math.abs(value) <= limit ? value : null;
};

export default function ReportRoute() {
  const params = useLocalSearchParams<{
    latitude?: string;
    longitude?: string;
    routeId?: string;
  }>();
  const latitude = coordinate(params.latitude, 90);
  const longitude = coordinate(params.longitude, 180);
  const routeId = Number(params.routeId);
  return (
    <ReportScreen
      location={latitude !== null && longitude !== null ? { latitude, longitude } : ATLANTA}
      routeId={Number.isInteger(routeId) && routeId > 0 ? routeId : null}
    />
  );
}
