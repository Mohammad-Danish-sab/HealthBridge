import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const user = await login(email, password);
      navigate(user.role === "DOCTOR" ? "/doctor/dashboard" : user.role === "ADMIN" ? "/admin/dashboard" : "/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to sign in.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-md bg-white p-8 rounded-2xl shadow border border-gray-100 space-y-5">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Welcome back</h1>
          <p className="text-gray-500 mt-1">Sign in to your HealthBridge account.</p>
        </div>
        {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
        <label className="block text-sm font-semibold text-gray-700">Email
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
        </label>
        <label className="block text-sm font-semibold text-gray-700">Password
          <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2" />
        </label>
        <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700">Sign in</button>
        <p className="text-center text-sm text-gray-600">New to HealthBridge? <Link to="/register" className="text-indigo-600 font-bold">Create account</Link></p>
      </form>
    </div>
  );
}
