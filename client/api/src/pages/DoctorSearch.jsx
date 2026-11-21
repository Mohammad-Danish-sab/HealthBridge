import React, { useEffect, useState } from "react";
import { doctorService } from "../services/doctorService";
import { appointmentService } from "../services/appointmentService";

export default function DoctorSearch() {
  const [doctors, setDoctors] = useState([]);
  const [specialization, setSpecialization] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    setDoctors(await doctorService.searchDoctors(specialization ? { specialization } : {}));
  };
  useEffect(() => { load(); }, []);

  const book = async (doctorId) => {
    setMessage("");
    try {
      await appointmentService.bookAppointment({
        doctor_id: doctorId,
        appointment_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        start_time: "09:00:00",
        end_time: "09:30:00",
        reason: "General consultation",
      });
      setMessage("Appointment booked.");
    } catch (err) {
      setMessage(err.response?.data?.detail || "Unable to book appointment.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black mb-6">Find a doctor</h1>
      <div className="flex gap-3 mb-6">
        <input value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="Specialization" className="border rounded-lg px-3 py-2" />
        <button onClick={load} className="bg-indigo-600 text-white px-5 rounded-lg font-bold">Search</button>
      </div>
      {message && <div className="mb-4 text-sm font-semibold">{message}</div>}
      <div className="grid md:grid-cols-3 gap-5">
        {doctors.map((doctor) => (
          <div key={doctor.id} className="bg-white p-5 rounded-xl border shadow-sm">
            <h2 className="font-bold text-lg">Dr. {doctor.user.full_name}</h2>
            <p className="text-indigo-600">{doctor.specialization}</p>
            <p className="text-sm text-gray-500 mt-2">{doctor.experience_years} years experience</p>
            <button onClick={() => book(doctor.id)} className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-lg font-bold">Book tomorrow</button>
          </div>
        ))}
      </div>
      {doctors.length === 0 && <p className="text-gray-500">No verified doctors found.</p>}
    </div>
  );
}
