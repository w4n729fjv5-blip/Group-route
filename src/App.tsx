import { Navigate, Route, Routes } from "react-router-dom";
import { isSupabaseConfigured } from "./lib/supabase";
import SetupNeeded from "./screens/SetupNeeded";
import RoutesList from "./screens/RoutesList";
import RouteEditor from "./screens/RouteEditor";
import StopEditor from "./screens/StopEditor";
import CatalogManager from "./screens/CatalogManager";

export default function App() {
  if (!isSupabaseConfigured) {
    return <SetupNeeded />;
  }

  return (
    <Routes>
      <Route path="/" element={<RoutesList />} />
      <Route path="/items" element={<CatalogManager />} />
      <Route path="/routes/:routeId" element={<RouteEditor />} />
      <Route path="/routes/:routeId/stops/:stopId" element={<StopEditor />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
