import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { appointmentService } from "../../services/appointmentService";
import {
  Users,
  Search,
  ChevronRight,
  Calendar,
  Phone,
  Mail,
} from "lucide-react";

const DoctorPatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const appointments = await appointmentService.getMyAppointments();
        // Extract unique patients from appointments
        const patientMap = new Map();
        appointments.forEach((appt) => {
          if (appt.patient && !patientMap.has(appt.patient.id)) {
            patientMap.set(appt.patient.id, {
              ...appt.patient,
              last_visit: appt.appointment_date,
              total_visits: appointments.filter(
                (a) => a.patient_id === appt.patient.id,
              ).length,
            });
          }
        });
        setPatients(Array.from(patientMap.values()));
      } catch (err) {
        console.error("Failed to load patients:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(
    (p) =>
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-emerald-600" />
          <h1 className="text-3xl font-black text-gray-900">
            Authorized Patients
          </h1>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search patient name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center text-gray-500">
          No patients found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <div
              key={patient.id}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    {patient.full_name}
                  </h3>
                  <p className="text-xs text-emerald-600 font-semibold mt-0.5">
                    Patient ID: #{patient.id}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 border-t border-b border-gray-100 py-3">
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" /> {patient.email}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />{" "}
                  {patient.phone_number || "No phone on file"}
                </p>
                <p className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" /> Total Visits:{" "}
                  {patient.total_visits}
                </p>
              </div>

              <Link
                to={`/doctor/patients/${patient.id}`}
                className="w-full bg-emerald-50 text-emerald-700 font-semibold py-2.5 px-4 rounded-xl hover:bg-emerald-100 transition flex items-center justify-between text-sm"
              >
                <span>View Medical Records</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorPatients;
