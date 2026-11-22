import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, HeartPulse, LockKeyhole, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(email, password);
      navigate(user.role === "DOCTOR" ? "/doctor/dashboard" : user.role === "ADMIN" ? "/admin/dashboard" : "/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to sign in. Check your credentials and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 sm:grid sm:place-items-center">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl shadow-indigo-950/10 lg:grid-cols-[1.05fr_.95fr]">
        <aside className="hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div><div className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-500"><HeartPulse className="h-6 w-6" /></div><p className="mt-8 text-xs font-bold tracking-[0.2em] text-indigo-300">HEALTHBRIDGE</p><h1 className="mt-3 text-4xl font-black leading-tight">Care, made more connected.</h1><p className="mt-5 max-w-sm text-sm leading-6 text-slate-300">A secure space for patients, clinicians, and care teams to stay on the same page.</p></div>
          <p className="text-sm text-slate-400">Private by design. Built around your care journey.</p>
        </aside>
        <form onSubmit={submit} className="p-6 sm:p-10">
          <div className="lg:hidden"><div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white"><HeartPulse className="h-5 w-5" /></div><p className="mt-5 text-xs font-bold tracking-[0.18em] text-indigo-600">HEALTHBRIDGE</p></div>
          <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950">Welcome back</h2><p className="mt-2 text-sm text-slate-500">Sign in to continue to your secure health space.</p>
          {error && <div role="alert" className="mt-6 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}
          <div className="mt-7 space-y-5">
            <label className="block text-sm font-bold text-slate-700">Email address<div className="relative mt-2"><Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="w-full rounded-xl border border-slate-200 py-2.5 pr-3 pl-10 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" /></div></label>
            <label className="block text-sm font-bold text-slate-700">Password<div className="relative mt-2"><LockKeyhole className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-200 py-2.5 pr-3 pl-10 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" /></div></label>
          </div>
          <button disabled={submitting} type="submit" className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70">{submitting ? "Signing in…" : "Sign in"}<ArrowRight className="h-4 w-4" /></button>
          <p className="mt-6 text-center text-sm text-slate-600">New to HealthBridge? <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-700">Create an account</Link></p>
        </form>
      </div>
    </div>
  );
}
