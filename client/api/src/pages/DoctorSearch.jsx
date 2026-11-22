import React, { useCallback, useEffect, useState } from "react";
import { CalendarDays, Search, ShieldCheck, Stethoscope } from "lucide-react";
import { doctorService } from "../services/doctorService";
import { appointmentService } from "../services/appointmentService";

const tomorrow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date;
};

const formatDate = (date) => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

export default function DoctorSearch() {
  const [doctors, setDoctors] = useState([]);
  const [specialization, setSpecialization] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState(null);

  const load = useCallback(async (query = "") => {
    setLoading(true);
    try {
      setDoctors(await doctorService.searchDoctors(query ? { specialization: query } : {}));
    } catch (err) {
      setMessage(err.response?.data?.detail || "We couldn't load doctors right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const book = async (doctorId) => {
    setMessage("");
    setBookingId(doctorId);
    try {
      const date = tomorrow();
      let slot = null;
      let appointmentDate = null;
      for (let offset = 0; offset < 14 && !slot; offset += 1) {
        const targetDate = new Date(date);
        targetDate.setDate(date.getDate() + offset);
        const slots = await appointmentService.getAvailableSlots(doctorId, formatDate(targetDate));
        slot = slots.find((item) => item.is_available);
        appointmentDate = slot ? formatDate(targetDate) : null;
      }
      if (!slot || !appointmentDate) {
        setMessage("This clinician has no open appointments in the next 14 days.");
        return;
      }
      await appointmentService.bookAppointment({
        doctor_id: doctorId,
        appointment_date: appointmentDate,
        start_time: slot.start_time,
        end_time: slot.end_time,
        reason: "General consultation",
      });
      setMessage(`Your consultation request for ${appointmentDate} was sent.`);
    } catch (err) {
      setMessage(err.response?.data?.detail || "Unable to book an appointment.");
    } finally {
      setBookingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <section className="rounded-3xl bg-slate-950 px-6 py-8 text-white shadow-xl shadow-slate-900/10 sm:px-10 sm:py-10">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold tracking-wide text-indigo-100"><ShieldCheck className="h-3.5 w-3.5" /> VERIFIED CARE</span>
          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Find care that fits your life.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">Connect with verified specialists and request your next consultation in seconds.</p>
        </div>
      </section>

      <div className="-mt-5 mx-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg shadow-slate-200/60 sm:mx-6 sm:flex sm:items-center sm:p-4">
        <div className="flex flex-1 items-center gap-3 px-2"><Search className="h-5 w-5 text-slate-400" /><input value={specialization} onChange={(event) => setSpecialization(event.target.value)} onKeyDown={(event) => event.key === "Enter" && load(specialization)} placeholder="Search by specialty, e.g. Cardiology" className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-slate-400" /></div>
        <button onClick={() => load(specialization)} className="mt-2 w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 sm:mt-0 sm:w-auto">Search doctors</button>
      </div>

      {message && <div role="status" className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-800">{message}</div>}
      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {doctors.map((doctor) => (
          <article key={doctor.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70">
            <div className="flex items-start justify-between gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600"><Stethoscope className="h-6 w-6" /></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Verified</span></div>
            <h2 className="mt-5 text-lg font-extrabold text-slate-900">Dr. {doctor.user.full_name}</h2>
            <p className="mt-1 text-sm font-semibold text-indigo-600">{doctor.specialization}</p>
            <p className="mt-4 text-sm text-slate-500">{doctor.experience_years} years of clinical experience</p>
            <button onClick={() => book(doctor.id)} disabled={bookingId === doctor.id} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"><CalendarDays className="h-4 w-4" /> {bookingId === doctor.id ? "Checking availability..." : "Request consultation"}</button>
          </article>
        ))}
      </div>
      {!loading && doctors.length === 0 && <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No verified doctors match that search. Try a broader specialty.</div>}
      {loading && <div className="mt-8 grid place-items-center py-12 text-sm font-medium text-slate-500">Finding verified clinicians…</div>}
    </div>
  );
}
