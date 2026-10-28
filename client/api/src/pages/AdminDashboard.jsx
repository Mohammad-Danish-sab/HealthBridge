import React, { useState, useEffect } from "react";
import { adminService } from "../services/adminService";
import { doctorService } from "../services/doctorService";
import {
  Users,
  Stethoscope,
  ShoppingBag,
  DollarSign,
  CheckCircle,
  ShieldAlert,
} from "lucide-react";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData] = await Promise.all([
        adminService.getStats(),
        adminService.getUsers(),
      ]);
      setStats(statsData);
      setUsers(usersData);
    } catch (error) {
      console.error("Failed to load admin panel:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUser = async (userId) => {
    try {
      await adminService.toggleUserStatus(userId);
      fetchAdminData();
    } catch (error) {
      console.error("Failed to toggle user status:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Platform Analytics & Management
        </h1>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Patients
              </p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {stats?.total_patients}
              </h3>
            </div>
            <Users className="h-10 w-10 text-indigo-500 p-2 bg-indigo-50 rounded-lg" />
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Doctors (Verified)
              </p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {stats?.verified_doctors} / {stats?.total_doctors}
              </h3>
            </div>
            <Stethoscope className="h-10 w-10 text-green-500 p-2 bg-green-50 rounded-lg" />
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Pharmacy Orders
              </p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {stats?.total_orders}
              </h3>
            </div>
            <ShoppingBag className="h-10 w-10 text-orange-500 p-2 bg-orange-50 rounded-lg" />
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                ${stats?.total_revenue?.toFixed(2)}
              </h3>
            </div>
            <DollarSign className="h-10 w-10 text-emerald-500 p-2 bg-emerald-50 rounded-lg" />
          </div>
        </div>

        {/* User Management Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">
              User Accounts & Authorization
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">
                        {u.full_name}
                      </div>
                      <div className="text-gray-500 text-xs">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {u.phone_number || "-"}
                    </td>
                    <td className="px-6 py-4">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1 text-green-700 text-xs font-semibold">
                          <CheckCircle className="h-3 w-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-700 text-xs font-semibold">
                          <ShieldAlert className="h-3 w-3" /> Deactivated
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleUser(u.id)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                          u.is_active
                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                            : "bg-green-50 text-green-600 hover:bg-green-100"
                        }`}
                      >
                        {u.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
