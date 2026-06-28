import { Navigate, Route, Routes } from "react-router-dom";
import RoutesList from "./screens/RoutesList";
import RouteEditor from "./screens/RouteEditor";
import StopEditor from "./screens/StopEditor";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RoutesList />} />
      <Route path="/routes/:routeId" element={<RouteEditor />} />
      <Route path="/routes/:routeId/stops/:stopId" element={<StopEditor />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
