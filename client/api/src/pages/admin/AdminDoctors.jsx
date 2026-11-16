import React, { useState, useEffect } from "react";
import { adminService } from "../../services/adminService";
import { doctorService } from "../../services/doctorService";
import {
  Stethoscope,
  Search,
  CheckCircle,
  Clock,
  Award,
  DollarSign,
  ShieldCheck,
} from "lucide-react";

const AdminDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL"); // ALL | PENDING | VERIFIED
  const [searchQuery, setSearchQuery] = useState("");
  const [verifyingId, setVerifyingId] = useState(null);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const data = await adminService.getDoctors();
      setDoctors(data);
    } catch (err) {
      console.error("Failed to load doctors list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleVerify = async (doctorId, doctorName) => {
    if (
      !window.confirm(`Approve and verify credentials for Dr. ${doctorName}?`)
    )
      return;
    setVerifyingId(doctorId);
    try {
      await doctorService.verifyDoctor(doctorId);
      fetchDoctors();
    } catch (err) {
      console.error("Failed to verify doctor:", err);
      alert("Verification failed. Please try again.");
    } finally {
      setVerifyingId(null);
    }
  };

  const filteredDoctors = doctors.filter((doc) => {
    const matchesFilter =
      filterStatus === "ALL" ||
      (filterStatus === "PENDING" && !doc.is_verified) ||
      (filterStatus === "VERIFIED" && doc.is_verified);

    const matchesSearch =
      doc.user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.user.email.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const pendingCount = doctors.filter((d) => !d.is_verified).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <Stethoscope className="h-8 w-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-black text-gray-900">
              Doctor Directory & Verification
            </h1>
            <p className="text-sm text-gray-500">
              Review credentials and approve practitioner profiles
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search name or specialization..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 bg-white text-sm"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setFilterStatus("ALL")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
            filterStatus === "ALL"
              ? "bg-purple-600 text-white"
              : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
        >
          All Doctors ({doctors.length})
        </button>
        <button
          onClick={() => setFilterStatus("PENDING")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
            filterStatus === "PENDING"
              ? "bg-amber-500 text-white"
              : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
        >
          Pending Approval
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800 font-black">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilterStatus("VERIFIED")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
            filterStatus === "VERIFIED"
              ? "bg-emerald-600 text-white"
              : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
        >
          Verified ({doctors.length - pendingCount})
        </button>
      </div>

      {/* Doctors List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center text-gray-500">
          No doctor profiles match the selected filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      Dr. {doc.user.full_name}
                    </h3>
                    <p className="text-xs text-gray-500">{doc.user.email}</p>
                  </div>
                  {doc.is_verified ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 shrink-0">
                      <CheckCircle className="h-3.5 w-3.5" /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 shrink-0">
                      <Clock className="h-3.5 w-3.5" /> Pending
                    </span>
                  )}
                </div>

                <div className="text-sm font-semibold text-purple-600">
                  {doc.specialization}
                </div>

                <div className="space-y-1.5 text-xs text-gray-600 border-t border-gray-100 pt-3">
                  <p className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-gray-400" />
                    <span>
                      {doc.qualifications} ({doc.experience_years} yrs
                      experience)
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <span>
                      Consultation Fee: ${doc.consultation_fee.toFixed(2)}
                    </span>
                  </p>
                </div>

                {doc.bio && (
                  <p className="text-xs text-gray-500 line-clamp-2 bg-gray-50 p-2.5 rounded-lg">
                    {doc.bio}
                  </p>
                )}
              </div>

              {!doc.is_verified && (
                <button
                  onClick={() => handleVerify(doc.id, doc.user.full_name)}
                  disabled={verifyingId === doc.id}
                  className="w-full bg-purple-600 text-white font-bold py-2.5 px-4 rounded-xl text-sm hover:bg-purple-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ShieldCheck className="h-4 w-4" />
                  {verifyingId === doc.id
                    ? "Verifying..."
                    : "Approve & Verify Doctor"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDoctors;
