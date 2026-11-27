import React, { useEffect, useState } from "react";
import { AlertCircle, Bot, CheckCircle, LifeBuoy } from "lucide-react";
import { adminService } from "../../services/adminService";

const statusStyles = {
  OPEN: "bg-amber-100 text-amber-800",
  IN_PROGRESS: "bg-sky-100 text-sky-800",
  RESOLVED: "bg-emerald-100 text-emerald-800",
  CLOSED: "bg-slate-100 text-slate-700",
};

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workingId, setWorkingId] = useState(null);
  const [summaries, setSummaries] = useState({});

  const loadComplaints = async () => {
    setLoading(true);
    setError("");
    try {
      setComplaints(await adminService.getComplaints());
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          "Unable to load support complaints.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const updateStatus = async (complaintId, status) => {
    setWorkingId(complaintId);
    setError("");
    try {
      const updated = await adminService.updateComplaint(complaintId, status);
      setComplaints((current) =>
        current.map((complaint) =>
          complaint.id === complaintId ? updated : complaint,
        ),
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          "Unable to update the complaint.",
      );
    } finally {
      setWorkingId(null);
    }
  };

  const summarize = async (complaintId) => {
    setWorkingId(complaintId);
    setError("");
    try {
      const summary = await adminService.summarizeComplaint(complaintId);
      setSummaries((current) => ({
        ...current,
        [complaintId]: summary,
      }));
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          "Unable to generate the AI triage summary.",
      );
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <LifeBuoy className="h-8 w-8 text-purple-600" />
        <div>
          <h1 className="text-3xl font-black text-slate-950">
            Support Complaints
          </h1>
          <p className="text-sm text-slate-500">
            Review reports and use AI for objective triage drafts.
          </p>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <p className="py-12 text-center text-sm text-slate-500">
          Loading complaints...
        </p>
      ) : complaints.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No support complaints have been submitted.
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map((complaint) => {
            const summary = summaries[complaint.id];
            return (
              <article
                key={complaint.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-slate-950">
                        {complaint.subject}
                      </h2>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[complaint.status]}`}
                      >
                        {complaint.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      {complaint.description}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      Complaint #{complaint.id} ·{" "}
                      {new Date(complaint.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => summarize(complaint.id)}
                      disabled={workingId === complaint.id}
                      className="inline-flex items-center gap-2 rounded-xl border border-violet-200 px-3 py-2 text-xs font-bold text-violet-700 hover:bg-violet-50 disabled:opacity-60"
                    >
                      <Bot className="h-4 w-4" />
                      AI triage
                    </button>
                    {complaint.status !== "RESOLVED" &&
                      complaint.status !== "CLOSED" && (
                        <button
                          type="button"
                          onClick={() =>
                            updateStatus(
                              complaint.id,
                              complaint.status === "OPEN"
                                ? "IN_PROGRESS"
                                : "RESOLVED",
                            )
                          }
                          disabled={workingId === complaint.id}
                          className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                        >
                          <CheckCircle className="h-4 w-4" />
                          {complaint.status === "OPEN"
                            ? "Start review"
                            : "Mark resolved"}
                        </button>
                      )}
                  </div>
                </div>

                {summary && (
                  <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-4">
                    <p className="text-sm font-bold text-violet-950">
                      {summary.main_issue}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-violet-700">
                      Category: {summary.category}
                    </p>
                    {summary.important_details.length > 0 && (
                      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-violet-900">
                        {summary.important_details.map((detail, index) => (
                          <li key={`${detail}-${index}`}>{detail}</li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-3 text-xs text-violet-800">
                      <strong>Requested resolution:</strong>{" "}
                      {summary.requested_resolution}
                    </p>
                    <p className="mt-3 rounded-lg bg-white p-3 text-sm text-slate-700">
                      {summary.draft_response}
                    </p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
