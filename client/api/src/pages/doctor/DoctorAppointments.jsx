import React, { useState, useEffect } from "react";
import { appointmentService } from "../../services/appointmentService";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  RotateCw,
} from "lucide-react";
import { Link } from "react-router-dom";

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const fetchAppointments = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await appointmentService.getMyAppointments();
      setAppointments(data);
    } catch {
      setError("Unable to load appointments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    setUpdatingId(id);
    setError("");
    setNotice("");
    try {
      const updatedAppointment = await appointmentService.updateStatus(id, status);
      setAppointments((current) =>
        current.map((appointment) =>
          appointment.id === id ? updatedAppointment : appointment,
        ),
      );
      setNotice(
        status === "CONFIRMED"
          ? "Appointment accepted."
          : status === "COMPLETED"
            ? "Appointment marked as completed."
            : "Appointment declined.",
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          "Unable to update this appointment. Please try again.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <h1 className="text-3xl font-black text-gray-900">
        Appointment Management
      </h1>

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
            onClick={fetchAppointments}
            disabled={loading || updatingId !== null}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-rose-300 px-3 py-2 font-semibold transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RotateCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Retry
          </button>
        </div>
      )}
      {notice && (
        <p
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800"
        >
          {notice}
        </p>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center text-gray-500">
          No appointments found in schedule.
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => (
            <div
              key={appt.id}
              className="bg-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-gray-900 text-lg">
                    {appt.patient.full_name}
                  </h3>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      appt.status === "CONFIRMED"
                        ? "bg-green-100 text-green-800"
                        : appt.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : appt.status === "COMPLETED"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-red-100 text-red-800"
                    }`}
                  >
                    {appt.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" /> {appt.appointment_date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" /> {appt.start_time} -{" "}
                    {appt.end_time}
                  </span>
                </div>
                {appt.reason && (
                  <p className="text-sm text-gray-600 italic">
                    "Reason: {appt.reason}"
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                {updatingId === appt.id && (
                  <span className="text-sm font-medium text-slate-500">
                    Updating...
                  </span>
                )}
                {appt.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(appt.id, "CONFIRMED")}
                      disabled={updatingId !== null}
                      className="bg-emerald-600 text-white font-semibold px-4 py-2 rounded-xl text-sm hover:bg-emerald-700 transition"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(appt.id, "CANCELLED")}
                      disabled={updatingId !== null}
                      className="bg-red-50 text-red-600 font-semibold px-4 py-2 rounded-xl text-sm hover:bg-red-100 transition disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </>
                )}
                {appt.status === "CONFIRMED" && (
                  <Link
                    to={`/doctor/prescribe/${appt.id}`}
                    className="bg-indigo-600 text-white font-semibold px-4 py-2 rounded-xl text-sm hover:bg-indigo-700 transition flex items-center gap-1.5"
                  >
                    <FileText className="h-4 w-4" /> Issue Prescription
                  </Link>
                )}
                {appt.status === "CONFIRMED" && (
                  <button
                    onClick={() => handleStatusUpdate(appt.id, "COMPLETED")}
                    disabled={updatingId !== null}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Mark complete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;
