import { Navigate, Route, Routes } from "react-router-dom";
import Schedule from "./screens/Schedule";
import DeliveryEditor from "./screens/DeliveryEditor";
import Materials from "./screens/Materials";
import Addresses from "./screens/Addresses";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Schedule />} />
      <Route path="/delivery/:id" element={<DeliveryEditor />} />
      <Route path="/materials" element={<Materials />} />
      <Route path="/addresses" element={<Addresses />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
