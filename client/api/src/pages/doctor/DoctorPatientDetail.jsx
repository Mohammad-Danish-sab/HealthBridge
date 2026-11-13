import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { recordService } from "../../services/recordService";
import { appointmentService } from "../../services/appointmentService";
import {
  User,
  FileText,
  Pill,
  Activity,
  Calendar,
  ArrowLeft,
  Download,
} from "lucide-react";

const DoctorPatientDetail = () => {
  const { patientId } = useParams();
  const [prescriptions, setPrescriptions] = useState([]);
  const [labReports, setLabReports] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        const [rxData, labData, apptData] = await Promise.all([
          recordService.getPatientPrescriptions(patientId),
          recordService.getPatientLabReports(patientId),
          appointmentService.getMyAppointments(),
        ]);
        setPrescriptions(rxData);
        setLabReports(labData);
        setAppointments(
          apptData.filter((a) => a.patient_id === parseInt(patientId)),
        );
      } catch (err) {
        console.error("Failed to load patient detail records:", err);
      } finally {
        setLoading(false);
      }
    };
    if (patientId) fetchPatientData();
  }, [patientId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const patientInfo = prescriptions[0]?.patient ||
    appointments[0]?.patient || { full_name: `Patient #${patientId}` };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Link
        to="/doctor/patients"
        className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Patients List
      </Link>

      {/* Patient Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-black text-2xl">
          {patientInfo.full_name.charAt(0)}
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">
            {patientInfo.full_name}
          </h1>
          <p className="text-sm text-gray-500">
            {patientInfo.email} |{" "}
            {patientInfo.phone_number || "No phone number"}
          </p>
        </div>
      </div>

      {/* Prescriptions Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Pill className="h-5 w-5 text-emerald-600" /> Prescription History (
          {prescriptions.length})
        </h2>
        {prescriptions.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">
            No prescriptions recorded for this patient.
          </p>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((rx) => (
              <div key={rx.id} className="p-4 bg-gray-50 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">
                    Diagnosis: {rx.diagnosis}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(rx.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead>
                      <tr>
                        <th className="px-3 py-1.5 text-left font-semibold text-gray-500">
                          Medicine
                        </th>
                        <th className="px-3 py-1.5 text-left font-semibold text-gray-500">
                          Dosage
                        </th>
                        <th className="px-3 py-1.5 text-left font-semibold text-gray-500">
                          Frequency
                        </th>
                        <th className="px-3 py-1.5 text-left font-semibold text-gray-500">
                          Duration
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {rx.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-1.5 font-bold text-gray-900">
                            {item.medicine_name}
                          </td>
                          <td className="px-3 py-1.5 text-gray-600">
                            {item.dosage}
                          </td>
                          <td className="px-3 py-1.5 text-gray-600">
                            {item.frequency}
                          </td>
                          <td className="px-3 py-1.5 text-gray-600">
                            {item.duration}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lab Reports Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Activity className="h-5 w-5 text-indigo-600" /> Lab Reports (
          {labReports.length})
        </h2>
        {labReports.length === 0 ? (
          <p className="text-sm text-gray-500 py-4">No lab reports on file.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {labReports.map((report) => (
              <div
                key={report.id}
                className="p-4 bg-gray-50 rounded-xl space-y-2"
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-gray-900">
                    {report.test_name}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {report.test_date}
                  </span>
                </div>
                {report.summary && (
                  <p className="text-xs text-gray-600">{report.summary}</p>
                )}
                <a
                  href={report.report_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 pt-1"
                >
                  <Download className="h-3.5 w-3.5" /> View Document
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorPatientDetail;
