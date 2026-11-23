import React, { useCallback, useState, useEffect } from "react";
import { adminService } from "../../services/adminService";
import {
  AlertCircle,
  CalendarDays,
  RotateCw,
  Users,
  Stethoscope,
  ShoppingBag,
  DollarSign,
} from "lucide-react";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setStats(await adminService.getStats());
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          "Unable to load platform analytics. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-700 rounded-2xl p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black">Admin Command Center</h1>
          <p className="text-purple-100 mt-1">
            Monitor platform health, verify doctors, and oversee healthcare
            operations.
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
          <button
            type="button"
            onClick={fetchStats}
            disabled={loading}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-rose-300 px-3 py-2 font-semibold transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RotateCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Retry
          </button>
        </div>
      )}

      {/* Metrics Grid */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Patients</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {stats.total_patients}
              </h3>
            </div>
            <Users className="h-10 w-10 text-indigo-500 p-2 bg-indigo-50 rounded-xl" />
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Verified Doctors
              </p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {stats.verified_doctors} / {stats.total_doctors}
              </h3>
            </div>
            <Stethoscope className="h-10 w-10 text-emerald-500 p-2 bg-emerald-50 rounded-xl" />
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pharmacy Orders</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {stats.total_orders}
              </h3>
            </div>
            <ShoppingBag className="h-10 w-10 text-orange-500 p-2 bg-orange-50 rounded-xl" />
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Appointments</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {stats.total_appointments}
              </h3>
            </div>
            <CalendarDays className="h-10 w-10 text-sky-500 p-2 bg-sky-50 rounded-xl" />
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                ${stats.total_revenue.toFixed(2)}
              </h3>
            </div>
            <DollarSign className="h-10 w-10 text-purple-500 p-2 bg-purple-50 rounded-xl" />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
