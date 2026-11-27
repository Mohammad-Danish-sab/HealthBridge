import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle, ShieldAlert, UserPlus, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { adminService } from "../../services/adminService";

const emptyForm = {
  full_name: "",
  email: "",
  password: "",
  role: "PATIENT",
};

const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(emptyForm);

  const fetchUsers = useCallback(async () => {
    try {
      setUsers(await adminService.getUsers());
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          "Unable to load user accounts. Please retry.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    adminService
      .getUsers()
      .then((data) => {
        if (active) setUsers(data);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError.response?.data?.detail ||
              "Unable to load user accounts. Please retry.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const createUser = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await adminService.createUser(form);
      setForm(emptyForm);
      setSuccess("Account created successfully.");
      await fetchUsers();
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          "Unable to create the account. Check the details and retry.",
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (account) => {
    const action = account.is_active ? "deactivate" : "reactivate";
    if (!window.confirm(`${action[0].toUpperCase()}${action.slice(1)} ${account.full_name}'s account?`)) {
      return;
    }
    setWorkingId(account.id);
    setError("");
    setSuccess("");
    try {
      await adminService.toggleUserStatus(account.id);
      setSuccess(`Account ${action}d. Existing clinical and audit records are retained.`);
      await fetchUsers();
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          "Unable to update account status. Please retry.",
      );
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-7 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
          <Users className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            User management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create accounts and safely manage access without deleting care history.
          </p>
        </div>
      </header>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
          <button type="button" className="ml-3 font-bold underline" onClick={() => { setError(""); setLoading(true); fetchUsers(); }}>
            Retry
          </button>
        </div>
      )}
      {success && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {success}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700">
            <UserPlus className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-bold text-slate-900">Add an account</h2>
            <p className="text-xs text-slate-500">
              Doctors are created from Doctor verification to include their clinical profile.
            </p>
          </div>
        </div>
        <form onSubmit={createUser} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-bold text-slate-600">
            Full name
            <input
              required
              maxLength={200}
              value={form.full_name}
              onChange={(event) => setForm({ ...form, full_name: event.target.value })}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-900"
              autoComplete="name"
            />
          </label>
          <label className="text-xs font-bold text-slate-600">
            Email
            <input
              required
              type="email"
              maxLength={320}
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-900"
              autoComplete="email"
            />
          </label>
          <label className="text-xs font-bold text-slate-600">
            Temporary password
            <input
              required
              type="password"
              minLength={8}
              maxLength={128}
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-900"
              autoComplete="new-password"
            />
          </label>
          <div className="flex items-end gap-2">
            <label className="min-w-0 flex-1 text-xs font-bold text-slate-600">
              Role
              <select
                value={form.role}
                onChange={(event) => setForm({ ...form, role: event.target.value })}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900"
              >
                <option value="PATIENT">Patient</option>
                <option value="ADMIN">Admin</option>
              </select>
            </label>
            <button
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
        <p className="mt-3 text-xs text-amber-700">
          Share temporary passwords securely. Never use a default password such as “ADMIN”.
        </p>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-bold text-slate-900">Accounts</h2>
            <p className="text-xs text-slate-500">{users.length} total</p>
          </div>
          <button type="button" onClick={() => { setError(""); setLoading(true); fetchUsers(); }} className="rounded-lg px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50">
            Refresh
          </button>
        </div>
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">Loading accounts…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-bold">Account</th>
                  <th className="px-5 py-3 font-bold">Role</th>
                  <th className="px-5 py-3 font-bold">Status</th>
                  <th className="px-5 py-3 text-right font-bold">Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((account) => (
                  <tr key={account.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900">{account.full_name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{account.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700">{account.role}</span>
                    </td>
                    <td className="px-5 py-4">
                      {account.is_active ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                          <CheckCircle className="h-4 w-4" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700">
                          <ShieldAlert className="h-4 w-4" /> Deactivated
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        disabled={workingId === account.id || account.id === currentUser?.id}
                        title={account.id === currentUser?.id ? "You cannot deactivate your own account" : undefined}
                        onClick={() => toggleStatus(account)}
                        className={`rounded-lg px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 ${
                          account.is_active
                            ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        {workingId === account.id ? "Updating…" : account.is_active ? "Deactivate" : "Reactivate"}
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan="4" className="px-5 py-12 text-center text-sm text-slate-500">No accounts found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminUsers;
