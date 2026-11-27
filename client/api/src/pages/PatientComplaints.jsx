import React, { useEffect, useState } from "react";
import { AlertCircle, LifeBuoy, Send } from "lucide-react";
import { complaintService } from "../services/complaintService";

const statusStyles = {
  OPEN: "bg-amber-100 text-amber-800",
  IN_PROGRESS: "bg-sky-100 text-sky-800",
  RESOLVED: "bg-emerald-100 text-emerald-800",
  CLOSED: "bg-slate-100 text-slate-700",
};

export default function PatientComplaints() {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [complaints, setComplaints] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadComplaints = async () => {
    try {
      setComplaints(await complaintService.getMyComplaints());
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          "Unable to load your support requests.",
      );
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      await complaintService.create(subject, description);
      setSubject("");
      setDescription("");
      setNotice("Your support request was submitted.");
      await loadComplaints();
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          "Unable to submit your support request.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <LifeBuoy className="h-8 w-8 text-indigo-600" />
        <div>
          <h1 className="text-3xl font-black text-slate-950">Support</h1>
          <p className="text-sm text-slate-500">
            Report an issue or request help from the HealthBridge team.
          </p>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          {notice}
        </p>
      )}

      <form
        onSubmit={submit}
        className="mb-8 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Subject
          </label>
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            minLength={3}
            maxLength={200}
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-700">
            Description
          </label>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            minLength={10}
            maxLength={4000}
            rows={5}
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          {submitting ? "Submitting..." : "Submit support request"}
        </button>
      </form>

      <div className="space-y-3">
        {complaints.map((complaint) => (
          <article
            key={complaint.id}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold text-slate-950">{complaint.subject}</h2>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[complaint.status]}`}
              >
                {complaint.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {complaint.description}
            </p>
            {complaint.resolution_notes && (
              <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                <strong>Resolution:</strong> {complaint.resolution_notes}
              </p>
            )}
          </article>
        ))}
        {complaints.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            You have no support requests.
          </p>
        )}
      </div>
    </div>
  );
}
