import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Stethoscope,
  Calendar,
  FileText,
  ShoppingBag,
  Bell,
  LogOut,
  Users,
  Clock,
  ShieldCheck,
  LayoutDashboard,
} from "lucide-react";

export const Navbar = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const getHomeRoute = () => {
    if (user.role === "DOCTOR") return "/doctor/dashboard";
    if (user.role === "ADMIN") return "/admin/dashboard";
    return "/dashboard";
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link
              to={getHomeRoute()}
              className="text-2xl font-black text-indigo-600 tracking-tight"
            >
              HealthBridge
            </Link>

            {/* Patient Links */}
            {user.role === "PATIENT" && (
              <div className="hidden md:flex space-x-4">
                <Link
                  to="/dashboard"
                  className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5"
                >
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
                <Link
                  to="/doctors"
                  className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5"
                >
                  <Stethoscope className="h-4 w-4" /> Find Doctors
                </Link>
                <Link
                  to="/appointments"
                  className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5"
                >
                  <Calendar className="h-4 w-4" /> Appointments
                </Link>
                <Link
                  to="/medical-records"
                  className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5"
                >
                  <FileText className="h-4 w-4" /> Records
                </Link>
                <Link
                  to="/pharmacy"
                  className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5"
                >
                  <ShoppingBag className="h-4 w-4" /> Pharmacy
                </Link>
              </div>
            )}

            {/* Doctor Links */}
            {user.role === "DOCTOR" && (
              <div className="hidden md:flex space-x-4">
                <Link
                  to="/doctor/dashboard"
                  className="text-gray-600 hover:text-emerald-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5"
                >
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
                <Link
                  to="/doctor/appointments"
                  className="text-gray-600 hover:text-emerald-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5"
                >
                  <Calendar className="h-4 w-4" /> Appointments
                </Link>
                <Link
                  to="/doctor/patients"
                  className="text-gray-600 hover:text-emerald-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5"
                >
                  <Users className="h-4 w-4" /> Patients
                </Link>
                <Link
                  to="/doctor/availability"
                  className="text-gray-600 hover:text-emerald-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5"
                >
                  <Clock className="h-4 w-4" /> Availability
                </Link>
              </div>
            )}

            {/* Admin Links */}
            {user.role === "ADMIN" && (
              <div className="hidden md:flex space-x-4">
                <Link
                  to="/admin/dashboard"
                  className="text-gray-600 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5"
                >
                  <LayoutDashboard className="h-4 w-4" /> Command Center
                </Link>
                <Link
                  to="/admin/users"
                  className="text-gray-600 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5"
                >
                  <ShieldCheck className="h-4 w-4" /> Users & Verification
                </Link>
                <Link
                  to="/admin/pharmacy"
                  className="text-gray-600 hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1.5"
                >
                  <ShoppingBag className="h-4 w-4" /> Pharmacy Inventory
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/notifications"
              className="text-gray-500 hover:text-indigo-600 p-2 rounded-full hover:bg-gray-100"
            >
              <Bell className="h-5 w-5" />
            </Link>
            <div className="flex items-center space-x-3 border-l pl-4 border-gray-200">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-gray-900">
                  {user.full_name}
                </div>
                <div className="text-xs text-indigo-600 font-semibold">
                  {user.role}
                </div>
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
