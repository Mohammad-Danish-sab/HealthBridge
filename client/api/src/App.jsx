import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Navbar } from "./components/Navbar";
import "./App.css";

// Auth & Shared Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Notifications from "./pages/Notifications";

// Patient Pages
import PatientDashboard from "./pages/PatientDashboard";
import PatientAppointments from "./pages/PatientAppointments";
import DoctorSearch from "./pages/DoctorSearch";
import MedicalRecords from "./pages/MedicalRecords";
import PharmacyCatalog from "./pages/PharmacyCatalog";
import AIAssistant from "./pages/AIAssistant";

// Doctor Pages
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";
import DoctorPatients from "./pages/doctor/DoctorPatients";
import DoctorPatientDetail from "./pages/doctor/DoctorPatientDetail";
import PrescriptionWriter from "./pages/doctor/PrescriptionWriter";
import AvailabilityManager from "./pages/doctor/AvailabilityManager";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPharmacy from "./pages/admin/AdminPharmacy";

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "DOCTOR")
    return <Navigate to="/doctor/dashboard" replace />;
  if (user.role === "ADMIN") return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-shell flex flex-col">
          <Navbar />
          <main className="flex-1 page-enter">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<RootRedirect />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/unauthorized"
                element={
                  <div className="p-16 text-center space-y-2">
                    <h2 className="text-2xl font-black text-red-600">
                      403 - Unauthorized Access
                    </h2>
                    <p className="text-gray-500">
                      You do not have permission to view this portal.
                    </p>
                  </div>
                }
              />

              {/* Shared Authenticated Routes */}
              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={["PATIENT", "DOCTOR", "ADMIN"]}
                  />
                }
              >
                <Route path="/notifications" element={<Notifications />} />
              </Route>

              {/* Patient Protected Routes */}
              <Route element={<ProtectedRoute allowedRoles={["PATIENT"]} />}>
                <Route path="/dashboard" element={<PatientDashboard />} />
                <Route path="/doctors" element={<DoctorSearch />} />
                <Route path="/appointments" element={<PatientAppointments />} />
                <Route path="/medical-records" element={<MedicalRecords />} />
                <Route path="/prescriptions" element={<MedicalRecords />} />
                <Route path="/pharmacy" element={<PharmacyCatalog />} />
                <Route path="/ai-assistant" element={<AIAssistant />} />
              </Route>

              {/* Doctor Protected Routes */}
              <Route element={<ProtectedRoute allowedRoles={["DOCTOR"]} />}>
                <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
                <Route
                  path="/doctor/appointments"
                  element={<DoctorAppointments />}
                />
                <Route path="/doctor/patients" element={<DoctorPatients />} />
                <Route
                  path="/doctor/patients/:patientId"
                  element={<DoctorPatientDetail />}
                />
                <Route
                  path="/doctor/prescribe/:appointmentId"
                  element={<PrescriptionWriter />}
                />
                <Route
                  path="/doctor/availability"
                  element={<AvailabilityManager />}
                />
              </Route>

              {/* Admin Protected Routes */}
              <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/pharmacy" element={<AdminPharmacy />} />
              </Route>

              <Route path="*" element={<RootRedirect />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
