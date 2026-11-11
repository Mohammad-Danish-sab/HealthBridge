import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { appointmentService } from "../../services/appointmentService";
import {
  Calendar,
  Users,
  Clock,
  CheckCircle,
  ArrowRight,
  FileText,
  PlusCircle,
} from "lucide-react";

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const data = await appointmentService.getMyAppointments();
        setAppointments(data);
      } catch (err) {
        console.error("Failed to load appointments:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchAppointments();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const todaysAppointments = appointments.filter(
    (a) => a.appointment_date === todayStr,
  );
  const pendingAppointments = appointments.filter(
    (a) => a.status === "PENDING",
  );
  const uniquePatients = [...new Set(appointments.map((a) => a.patient_id))];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black">Dr. {user.full_name}'s Portal</h1>
          <p className="text-emerald-100 mt-1">
            Manage your schedule, consult patients, and issue digital
            prescriptions securely.
          </p>
        </div>
        <Link
          to="/doctor/availability"
          className="bg-white text-emerald-600 font-bold px-6 py-3 rounded-xl shadow hover:bg-emerald-50 transition flex items-center gap-2"
        >
          <Clock className="h-5 w-5" /> Manage Availability
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Today's Visits</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {todaysAppointments.length}
            </h3>
          </div>
          <Calendar className="h-10 w-10 text-emerald-500 p-2 bg-emerald-50 rounded-xl" />
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Pending Requests
            </p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {pendingAppointments.length}
            </h3>
          </div>
          <Clock className="h-10 w-10 text-yellow-500 p-2 bg-yellow-50 rounded-xl" />
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Patients</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {uniquePatients.length}
            </h3>
          </div>
          <Users className="h-10 w-10 text-indigo-500 p-2 bg-indigo-50 rounded-xl" />
        </div>
      </div>

      {/* Recent Appointments & Actions */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-gray-900">
            Pending & Upcoming Consultation Requests
          </h3>
          <Link
            to="/doctor/appointments"
            className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
          >
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {pendingAppointments.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">
            No pending consultation requests.
          </p>
        ) : (
          <div className="space-y-3">
            {pendingAppointments.map((appt) => (
              <div
                key={appt.id}
                className="p-4 bg-gray-50 rounded-xl flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-gray-900">
                    {appt.patient.full_name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {appt.appointment_date} at {appt.start_time}
                  </div>
                  {appt.reason && (
                    <div className="text-xs text-indigo-600 mt-1">
                      "{appt.reason}"
                    </div>
                  )}
                </div>
                <Link
                  to="/doctor/appointments"
                  className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
                >
                  Review Request
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
