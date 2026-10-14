import React, { useState, useEffect } from "react";
import { recordService } from "../services/recordService";
import { useAuth } from "../context/AuthContext";
import { FileText, Pill, Activity, Calendar, Download } from "lucide-react";

const MedicalRecords = () => {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [labReports, setLabReports] = useState([]);
  const [activeTab, setActiveTab] = useState("prescriptions");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRecords();
    }
  }, [user]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const [rxData, labData] = await Promise.all([
        recordService.getPatientPrescriptions(user.id),
        recordService.getPatientLabReports(user.id),
      ]);
      setPrescriptions(rxData);
      setLabReports(labData);
    } catch (error) {
      console.error("Failed to fetch EMR timeline:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Medical History Timeline
        </h1>

        {/* Tab Controls */}
        <div className="flex border-b border-gray-200 mb-8 bg-white rounded-t-xl px-4 pt-2">
          <button
            onClick={() => setActiveTab("prescriptions")}
            className={`flex items-center gap-2 py-4 px-6 border-b-2 font-medium text-sm transition ${
              activeTab === "prescriptions"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Pill className="h-4 w-4" /> Digital Prescriptions (
            {prescriptions.length})
          </button>
          <button
            onClick={() => setActiveTab("labs")}
            className={`flex items-center gap-2 py-4 px-6 border-b-2 font-medium text-sm transition ${
              activeTab === "labs"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Activity className="h-4 w-4" /> Lab Reports ({labReports.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        ) : activeTab === "prescriptions" ? (
          <div className="space-y-6">
            {prescriptions.length === 0 ? (
              <div className="bg-white p-8 rounded-xl shadow-sm text-center text-gray-500">
                No prescription history found.
              </div>
            ) : (
              prescriptions.map((rx) => (
                <div
                  key={rx.id}
                  className="bg-white p-6 rounded-xl shadow-sm space-y-4"
                >
                  <div className="flex justify-between items-start border-b pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Dr. {rx.doctor.user.full_name}
                      </h3>
                      <p className="text-sm text-indigo-600 font-medium">
                        {rx.doctor.specialization}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />{" "}
                      {new Date(rx.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Diagnosis
                    </h4>
                    <p className="text-gray-800 font-medium mt-1">
                      {rx.diagnosis}
                    </p>
                  </div>

                  {/* Medicines Table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                            Medicine
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                            Dosage
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                            Frequency
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                            Duration
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                            Instructions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 text-sm">
                        {rx.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-2 font-semibold text-gray-900">
                              {item.medicine_name}
                            </td>
                            <td className="px-4 py-2 text-gray-600">
                              {item.dosage}
                            </td>
                            <td className="px-4 py-2 text-gray-600">
                              {item.frequency}
                            </td>
                            <td className="px-4 py-2 text-gray-600">
                              {item.duration}
                            </td>
                            <td className="px-4 py-2 text-gray-500 italic">
                              {item.instructions || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {rx.notes && (
                    <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600">
                      <strong>Doctor Notes:</strong> {rx.notes}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {labReports.length === 0 ? (
              <div className="col-span-2 bg-white p-8 rounded-xl shadow-sm text-center text-gray-500">
                No lab reports on file.
              </div>
            ) : (
              labReports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white p-6 rounded-xl shadow-sm space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-indigo-600" />{" "}
                      {report.test_name}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {report.test_date}
                    </span>
                  </div>
                  {report.summary && (
                    <p className="text-sm text-gray-600">{report.summary}</p>
                  )}
                  <a
                    href={report.report_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition pt-2"
                  >
                    <Download className="h-4 w-4" /> View Full Report Document
                  </a>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalRecords;
