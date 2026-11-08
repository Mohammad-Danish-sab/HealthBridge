import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { appointmentService } from "../services/appointmentService";
import { recordService } from "../services/recordService";
import { pharmacyService } from "../services/pharmacyService";
import {
  Calendar,
  Stethoscope,
  Pill,
  Activity,
  ShoppingBag,
  ArrowRight,
  PlusCircle,
} from "lucide-react";

const PatientDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [apptsData, rxData, ordersData] = await Promise.all([
          appointmentService.getMyAppointments(),
          recordService.getPatientPrescriptions(user.id),
          pharmacyService.getMyOrders(),
        ]);
        setAppointments(apptsData);
        setPrescriptions(rxData);
        setOrders(ordersData);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) loadDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const upcomingAppointments = appointments.filter(
    (a) => a.status === "CONFIRMED" || a.status === "PENDING",
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black">
            Welcome back, {user.full_name}!
          </h1>
          <p className="text-indigo-100 mt-1">
            Manage your appointments, prescriptions, and health timeline from
            one secure dashboard.
          </p>
        </div>
        <Link
          to="/doctors"
          className="bg-white text-indigo-600 font-bold px-6 py-3 rounded-xl shadow hover:bg-indigo-50 transition flex items-center gap-2"
        >
          <PlusCircle className="h-5 w-5" /> Book Consultation
        </Link>
      </div>

      {/* Grid Quick Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upcoming Appointments */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" /> Upcoming Visits
            </h3>
            <Link
              to="/appointments"
              className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {upcomingAppointments.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              No active appointments scheduled.
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.slice(0, 2).map((appt) => (
                <div
                  key={appt.id}
                  className="p-4 bg-gray-50 rounded-xl space-y-1"
                >
                  <div className="font-semibold text-gray-900">
                    Dr. {appt.doctor.user.full_name}
                  </div>
                  <div className="text-xs text-indigo-600">
                    {appt.doctor.specialization}
                  </div>
                  <div className="text-xs text-gray-500">
                    {appt.appointment_date} at {appt.start_time}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Prescriptions */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Pill className="h-5 w-5 text-green-600" /> Active Prescriptions
            </h3>
            <Link
              to="/prescriptions"
              className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {prescriptions.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              No prescriptions found.
            </p>
          ) : (
            <div className="space-y-3">
              {prescriptions.slice(0, 2).map((rx) => (
                <div
                  key={rx.id}
                  className="p-4 bg-gray-50 rounded-xl space-y-1"
                >
                  <div className="font-semibold text-gray-900">
                    Dr. {rx.doctor.user.full_name}
                  </div>
                  <div className="text-xs text-green-600 font-medium">
                    Diagnosis: {rx.diagnosis}
                  </div>
                  <div className="text-xs text-gray-500">
                    {rx.items.length} medicines prescribed
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pharmacy Orders */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-orange-600" /> Medicine
              Orders
            </h3>
            <Link
              to="/orders"
              className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
            >
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {orders.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              No recent medicine orders.
            </p>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 2).map((ord) => (
                <div
                  key={ord.id}
                  className="p-4 bg-gray-50 rounded-xl space-y-1"
                >
                  <div className="font-semibold text-gray-900">
                    Order #{ord.id}
                  </div>
                  <div className="text-xs font-semibold text-orange-600">
                    Status: {ord.status}
                  </div>
                  <div className="text-xs text-gray-500">
                    Total: ${ord.total_amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
