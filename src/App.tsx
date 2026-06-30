import { Navigate, Route, Routes } from "react-router-dom";
import RoutesList from "./screens/RoutesList";
import RouteEditor from "./screens/RouteEditor";
import StopEditor from "./screens/StopEditor";
import ManageItems from "./screens/ManageItems";
import AddressBook from "./screens/AddressBook";

// The app works out of the box using local (on-device) storage. Supabase is an
// optional cloud-sync backend; see src/lib/supabase.ts and the README. There's
// no setup gate anymore — it just runs.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RoutesList />} />
      <Route path="/routes/:routeId" element={<RouteEditor />} />
      <Route path="/routes/:routeId/stops/:stopId" element={<StopEditor />} />
      <Route path="/items" element={<ManageItems />} />
      <Route path="/addresses" element={<AddressBook />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
