// Routes for the whole app.
// Each role app owns everything under its own path.
import { Routes, Route, Navigate } from "react-router-dom";
import RolePicker from "./shared/RolePicker.jsx";
import DispatcherApp from "./roles/dispatcher/DispatcherApp.jsx";
import LoaderApp from "./roles/loader/LoaderApp.jsx";
import DriverApp from "./roles/driver/DriverApp.jsx";
import StoreApp from "./roles/store/StoreApp.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RolePicker />} />
      <Route path="/dispatcher/*" element={<DispatcherApp />} />
      <Route path="/loader/*" element={<LoaderApp />} />
      <Route path="/driver/*" element={<DriverApp />} />
      <Route path="/store/*" element={<StoreApp />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
