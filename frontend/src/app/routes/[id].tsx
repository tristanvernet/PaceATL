import { useLocalSearchParams } from "expo-router";
import RouteDetailScreen from "../../features/routes/RouteDetailScreen";

export default function RouteDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <RouteDetailScreen key={id} routeId={Number(id)} />;
}
