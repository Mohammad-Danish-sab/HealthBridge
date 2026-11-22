import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  HeartPulse,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "PATIENT" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(form);
      navigate("/login");
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Unable to create account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 sm:grid sm:place-items-center">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl shadow-indigo-950/10 lg:grid-cols-[1.05fr_.95fr]">
        <aside className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute -right-20 top-28 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="relative">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-500">
              <HeartPulse className="h-6 w-6" />
            </div>
            <p className="mt-8 text-xs font-bold tracking-[0.2em] text-indigo-300">HEALTHBRIDGE</p>
            <h1 className="mt-3 max-w-sm text-4xl font-black leading-tight">
              Your care journey, connected.
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-slate-300">
              Create a secure space to connect with care teams and keep your health in reach.
            </p>
          </div>
          <div className="relative flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-300" />
            <p className="text-sm text-slate-300">Private by design. Built around your care.</p>
          </div>
        </aside>

        <form onSubmit={submit} className="p-6 sm:p-10">
          <div className="lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white">
              <HeartPulse className="h-5 w-5" />
            </div>
            <p className="mt-5 text-xs font-bold tracking-[0.18em] text-indigo-600">HEALTHBRIDGE</p>
          </div>
          <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950">Create your account</h2>
          <p className="mt-2 text-sm text-slate-500">A healthier, more connected experience starts here.</p>

          {error && (
            <div role="alert" className="mt-6 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          <div className="mt-7 space-y-5">
            <label className="block text-sm font-bold text-slate-700">
              Full name
              <div className="relative mt-2">
                <UserRound className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  required
                  autoComplete="name"
                  value={form.full_name}
                  onChange={(event) => setForm({ ...form, full_name: event.target.value })}
                  placeholder="Your full name"
                  className="w-full rounded-xl border border-slate-200 py-2.5 pr-3 pl-10 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </div>
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Email address
              <div className="relative mt-2">
                <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-200 py-2.5 pr-3 pl-10 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </div>
            </label>

            <label className="block text-sm font-bold text-slate-700">
              I am joining as
              <div className="relative mt-2">
                <Stethoscope className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <select
                  value={form.role}
                  onChange={(event) => setForm({ ...form, role: event.target.value })}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pr-3 pl-10 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                >
                  <option value="PATIENT">Patient</option>
                  <option value="DOCTOR">Healthcare professional</option>
                </select>
              </div>
            </label>

            <label className="block text-sm font-bold text-slate-700">
              Password
              <div className="relative mt-2">
                <LockKeyhole className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  required
                  minLength={8}
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl border border-slate-200 py-2.5 pr-3 pl-10 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
              </div>
              <span className="mt-2 block text-xs font-normal text-slate-500">Use at least 8 characters.</span>
            </label>
          </div>

          <button
            disabled={submitting}
            type="submit"
            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Creating your account…" : "Create account"}
            {!submitting && <ArrowRight className="h-4 w-4" />}
          </button>
          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account? <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-700">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
