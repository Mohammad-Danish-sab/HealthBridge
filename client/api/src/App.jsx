import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Navbar } from "./components/Navbar";

import Login from "./pages/Login";
import Register from "./pages/Register";
import PatientDashboard from "./pages/PatientDashboard";
import DoctorSearch from "./pages/DoctorSearch";
import MedicalRecords from "./pages/MedicalRecords";
import PharmacyCatalog from "./pages/PharmacyCatalog";
import Notifications from "./pages/Notifications";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/unauthorized"
                element={
                  <div className="p-12 text-center text-xl font-bold">
                    Unauthorized Access
                  </div>
                }
              />

              {/* Patient Protected Routes */}
              <Route element={<ProtectedRoute allowedRoles={["PATIENT"]} />}>
                <Route path="/dashboard" element={<PatientDashboard />} />
                <Route path="/doctors" element={<DoctorSearch />} />
                <Route path="/medical-records" element={<MedicalRecords />} />
                <Route path="/pharmacy" element={<PharmacyCatalog />} />
                <Route path="/notifications" element={<Notifications />} />
              </Route>

              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
