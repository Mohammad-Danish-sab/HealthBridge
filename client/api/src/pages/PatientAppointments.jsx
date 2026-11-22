import React, { useEffect, useState } from "react";
import { CalendarDays, Clock3, X } from "lucide-react";
import { appointmentService } from "../services/appointmentService";

const statusStyle = {
  PENDING: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-emerald-50 text-emerald-700",
  COMPLETED: "bg-sky-50 text-sky-700",
  CANCELLED: "bg-rose-50 text-rose-700",
};

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [message, setMessage] = useState("");

  const load = async () => {
    try {
      setAppointments(await appointmentService.getMyAppointments());
    } catch (err) {
      setMessage(err.response?.data?.detail || "Unable to load your appointments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const cancel = async (appointmentId) => {
    setUpdatingId(appointmentId);
    setMessage("");
    try {
      await appointmentService.updateStatus(appointmentId, "CANCELLED");
      await load();
      setMessage("Appointment cancelled.");
    } catch (err) {
      setMessage(err.response?.data?.detail || "Unable to cancel this appointment.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <p className="text-xs font-bold tracking-[0.16em] text-indigo-600">CARE SCHEDULE</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Your appointments</h1>
      <p className="mt-2 text-sm text-slate-500">Review upcoming consultations and manage your requests.</p>
      {message && <div role="status" className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-800">{message}</div>}
      {loading ? <div className="py-16 text-center text-sm font-medium text-slate-500">Loading appointments...</div> : appointments.length === 0 ? <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">You have no appointments yet.</div> : <div className="mt-8 space-y-4">{appointments.map((appointment) => (
        <article key={appointment.id} className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-4"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><CalendarDays className="h-5 w-5" /></div><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-extrabold text-slate-900">Dr. {appointment.doctor.user.full_name}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyle[appointment.status] || "bg-slate-100 text-slate-700"}`}>{appointment.status}</span></div><p className="mt-1 text-sm font-semibold text-indigo-600">{appointment.doctor.specialization}</p><p className="mt-3 flex items-center gap-1.5 text-sm text-slate-500"><Clock3 className="h-4 w-4" />{appointment.appointment_date} · {appointment.start_time}–{appointment.end_time}</p></div></div>
          {(appointment.status === "PENDING" || appointment.status === "CONFIRMED") && <button onClick={() => cancel(appointment.id)} disabled={updatingId === appointment.id} className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"><X className="h-4 w-4" />{updatingId === appointment.id ? "Cancelling..." : "Cancel"}</button>}
        </article>
      ))}</div>}
    </div>
  );
}
