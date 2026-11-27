import React, { useCallback, useEffect, useState } from "react";
import {
  Award,
  CalendarClock,
  CheckCircle,
  Clock,
  DollarSign,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  UserRoundPlus,
  X,
} from "lucide-react";
import { adminService } from "../../services/adminService";
import { doctorService } from "../../services/doctorService";

const blankDoctor = {
  full_name: "",
  email: "",
  password: "",
  specialization: "",
  license_number: "",
  qualifications: "",
  experience_years: 0,
  consultation_fee: 0,
  bio: "",
};

const days = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const blankAvailability = () => ({
  day_of_week: "MONDAY",
  start_time: "09:00",
  end_time: "17:00",
  slot_duration_minutes: 30,
});

const errorMessage = (error, fallback) =>
  error.response?.data?.detail || fallback;

const AdminDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingDoctor, setSavingDoctor] = useState(false);
  const [workingId, setWorkingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDoctor, setNewDoctor] = useState(blankDoctor);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [editProfile, setEditProfile] = useState(null);
  const [availabilityDoctorId, setAvailabilityDoctorId] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const fetchDoctors = useCallback(async () => {
    try {
      setDoctors(await adminService.getDoctors());
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to load doctor profiles."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    adminService
      .getDoctors()
      .then((data) => {
        if (active) setDoctors(data);
      })
      .catch((requestError) => {
        if (active) {
          setError(errorMessage(requestError, "Unable to load doctor profiles."));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const createDoctor = async (event) => {
    event.preventDefault();
    setSavingDoctor(true);
    setError("");
    setNotice("");
    try {
      await adminService.createDoctor({
        email: newDoctor.email,
        password: newDoctor.password,
        full_name: newDoctor.full_name,
        profile: {
          specialization: newDoctor.specialization,
          license_number: newDoctor.license_number,
          qualifications: newDoctor.qualifications,
          experience_years: Number(newDoctor.experience_years),
          consultation_fee: Number(newDoctor.consultation_fee),
          bio: newDoctor.bio || null,
        },
      });
      setNewDoctor(blankDoctor);
      setShowCreateForm(false);
      setNotice("Doctor account created. The profile is pending credential verification.");
      await fetchDoctors();
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to create the doctor account."));
    } finally {
      setSavingDoctor(false);
    }
  };

  const verifyDoctor = async (doctor) => {
    if (!window.confirm(`Approve credentials for Dr. ${doctor.user.full_name}?`)) return;
    setWorkingId(doctor.id);
    setError("");
    setNotice("");
    try {
      await doctorService.verifyDoctor(doctor.id);
      setNotice(`Dr. ${doctor.user.full_name} is now verified.`);
      await fetchDoctors();
    } catch (requestError) {
      setError(errorMessage(requestError, "Verification failed. Please retry."));
    } finally {
      setWorkingId(null);
    }
  };

  const toggleDoctorAccount = async (doctor) => {
    const action = doctor.user.is_active ? "deactivate" : "reactivate";
    if (!window.confirm(`${action[0].toUpperCase()}${action.slice(1)} Dr. ${doctor.user.full_name}'s account? Existing records will be retained.`)) return;
    setWorkingId(doctor.id);
    setError("");
    setNotice("");
    try {
      await adminService.toggleUserStatus(doctor.user_id);
      setNotice(`Doctor account ${action}d; medical and audit history is retained.`);
      await fetchDoctors();
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to update doctor access."));
    } finally {
      setWorkingId(null);
    }
  };

  const openEdit = (doctor) => {
    setEditingDoctor(doctor);
    setEditProfile({
      specialization: doctor.specialization,
      license_number: doctor.license_number,
      qualifications: doctor.qualifications || "",
      experience_years: doctor.experience_years,
      consultation_fee: doctor.consultation_fee,
      bio: doctor.bio || "",
    });
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setWorkingId(editingDoctor.id);
    setError("");
    try {
      await adminService.updateDoctor(editingDoctor.id, {
        ...editProfile,
        experience_years: Number(editProfile.experience_years),
        consultation_fee: Number(editProfile.consultation_fee),
        bio: editProfile.bio || null,
      });
      setEditingDoctor(null);
      setEditProfile(null);
      setNotice("Doctor profile updated.");
      await fetchDoctors();
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to update doctor profile."));
    } finally {
      setWorkingId(null);
    }
  };

  const toggleAvailability = async (doctorId) => {
    if (availabilityDoctorId === doctorId) {
      setAvailabilityDoctorId(null);
      return;
    }
    setAvailabilityDoctorId(doctorId);
    setLoadingAvailability(true);
    setError("");
    try {
      const current = await adminService.getDoctorAvailability(doctorId);
      setAvailability(
        current.map((item) => ({
          ...item,
          start_time: item.start_time.slice(0, 5),
          end_time: item.end_time.slice(0, 5),
        })),
      );
    } catch (requestError) {
      setAvailability([]);
      setError(errorMessage(requestError, "Unable to load doctor availability."));
    } finally {
      setLoadingAvailability(false);
    }
  };

  const saveAvailability = async (doctorId) => {
    setSavingAvailability(true);
    setError("");
    try {
      await adminService.setDoctorAvailability(doctorId, availability);
      setNotice("Doctor availability updated.");
      setAvailabilityDoctorId(null);
    } catch (requestError) {
      setError(errorMessage(requestError, "Unable to update availability."));
    } finally {
      setSavingAvailability(false);
    }
  };

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesStatus =
      filterStatus === "ALL" ||
      (filterStatus === "PENDING" && !doctor.is_verified) ||
      (filterStatus === "VERIFIED" && doctor.is_verified);
    const needle = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !needle ||
      doctor.user.full_name.toLowerCase().includes(needle) ||
      doctor.user.email.toLowerCase().includes(needle) ||
      doctor.specialization.toLowerCase().includes(needle) ||
      doctor.license_number.toLowerCase().includes(needle);
    return matchesStatus && matchesSearch;
  });
  const pendingCount = doctors.filter((doctor) => !doctor.is_verified).length;

  const updateNewDoctor = (field, value) =>
    setNewDoctor((current) => ({ ...current, [field]: value }));
  const updateEditProfile = (field, value) =>
    setEditProfile((current) => ({ ...current, [field]: value }));

  return (
    <div className="mx-auto max-w-7xl space-y-7 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Stethoscope className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Doctor management
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Create accounts, review credentials, edit profiles and manage schedules.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateForm((shown) => !shown)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
        >
          {showCreateForm ? <X className="h-4 w-4" /> : <UserRoundPlus className="h-4 w-4" />}
          {showCreateForm ? "Close form" : "Add doctor"}
        </button>
      </header>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
          <button type="button" className="ml-3 font-bold underline" onClick={() => { setError(""); setLoading(true); fetchDoctors(); }}>Retry</button>
        </div>
      )}
      {notice && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">{notice}</div>
      )}

      {showCreateForm && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-indigo-700"><Plus className="h-5 w-5" /></span>
            <div>
              <h2 className="font-bold text-slate-900">Create doctor account</h2>
              <p className="text-xs text-slate-500">New profiles remain hidden from patients until credentials are approved.</p>
            </div>
          </div>
          <form onSubmit={createDoctor} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["full_name", "Doctor name", "text"],
              ["email", "Email address", "email"],
              ["password", "Temporary password (8+ characters)", "password"],
              ["specialization", "Specialization", "text"],
              ["license_number", "License / registration number", "text"],
              ["qualifications", "Qualifications", "text"],
              ["experience_years", "Experience in years", "number"],
              ["consultation_fee", "Consultation fee", "number"],
            ].map(([field, label, type]) => (
              <label key={field} className="text-xs font-bold text-slate-600">
                {label}
                <input
                  required={field !== "qualifications"}
                  type={type}
                  min={type === "number" ? "0" : undefined}
                  minLength={field === "password" ? 8 : undefined}
                  maxLength={field === "password" ? 128 : field === "license_number" ? 100 : undefined}
                  value={newDoctor[field]}
                  onChange={(event) => updateNewDoctor(field, event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-900"
                  autoComplete={field === "email" ? "email" : field === "password" ? "new-password" : undefined}
                />
              </label>
            ))}
            <label className="text-xs font-bold text-slate-600 sm:col-span-2 lg:col-span-3">
              Profile bio
              <textarea
                rows={2}
                value={newDoctor.bio}
                onChange={(event) => updateNewDoctor("bio", event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-900"
              />
            </label>
            <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-3">
              <button disabled={savingDoctor} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60">
                {savingDoctor ? "Creating…" : "Create pending profile"}
              </button>
              <span className="text-xs text-amber-700">Use a unique temporary password and share it securely.</span>
            </div>
          </form>
        </section>
      )}

      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {[
            ["ALL", `All doctors · ${doctors.length}`],
            ["PENDING", `Pending · ${pendingCount}`],
            ["VERIFIED", `Verified · ${doctors.length - pendingCount}`],
          ].map(([filter, label]) => (
            <button
              type="button"
              key={filter}
              onClick={() => setFilterStatus(filter)}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                filterStatus === filter
                  ? "bg-slate-900 text-white"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="relative block sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search name, specialty or license"
            className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm"
          />
        </label>
      </section>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-14 text-center text-sm text-slate-500">Loading doctor profiles…</div>
      ) : filteredDoctors.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No doctor profiles match this filter.</div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {filteredDoctors.map((doctor) => (
            <article key={doctor.id} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-950">Dr. {doctor.user.full_name}</h2>
                  <p className="mt-0.5 text-xs text-slate-500">{doctor.user.email}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {doctor.is_verified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700"><CheckCircle className="h-3.5 w-3.5" /> Verified</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700"><Clock className="h-3.5 w-3.5" /> Pending review</span>
                  )}
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${doctor.user.is_active ? "bg-sky-50 text-sky-700" : "bg-rose-50 text-rose-700"}`}>
                    {doctor.user.is_active ? <CheckCircle className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                    {doctor.user.is_active ? "Account active" : "Deactivated"}
                  </span>
                </div>
              </div>

              <div className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="font-bold text-indigo-700">{doctor.specialization}</p>
                  <p className="mt-1 text-xs text-slate-500">Registration: {doctor.license_number}</p>
                </div>
                <div className="text-xs text-slate-600">
                  <p className="flex items-center gap-2"><Award className="h-4 w-4 text-slate-400" />{doctor.qualifications || "Qualifications not provided"}</p>
                  <p className="mt-1 flex items-center gap-2"><DollarSign className="h-4 w-4 text-slate-400" />Fee: {Number(doctor.consultation_fee).toFixed(2)}</p>
                  <p className="mt-1">{doctor.experience_years} years of experience</p>
                </div>
              </div>
              {doctor.bio && <p className="text-xs leading-relaxed text-slate-600">{doctor.bio}</p>}

              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                {!doctor.is_verified && (
                  <button type="button" disabled={workingId === doctor.id} onClick={() => verifyDoctor(doctor)} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50">
                    <ShieldCheck className="h-4 w-4" /> Verify credentials
                  </button>
                )}
                <button type="button" onClick={() => openEdit(doctor)} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200">Edit profile</button>
                <button type="button" disabled={workingId === doctor.id} onClick={() => toggleDoctorAccount(doctor)} className={`rounded-lg px-3 py-2 text-xs font-bold disabled:opacity-50 ${doctor.user.is_active ? "bg-rose-50 text-rose-700 hover:bg-rose-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}>
                  {doctor.user.is_active ? "Deactivate account" : "Reactivate account"}
                </button>
                <button type="button" onClick={() => toggleAvailability(doctor.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200">
                  <CalendarClock className="h-4 w-4" /> {availabilityDoctorId === doctor.id ? "Close schedule" : "Manage availability"}
                </button>
              </div>

              {availabilityDoctorId === doctor.id && (
                <section className="space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-bold text-slate-900">Weekly availability</h3>
                    <button type="button" onClick={() => setAvailability((items) => [...items, blankAvailability()])} className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900"><Plus className="h-4 w-4" /> Add time block</button>
                  </div>
                  {loadingAvailability ? (
                    <p className="text-xs text-slate-500">Loading schedule…</p>
                  ) : (
                    <>
                      {availability.length === 0 && <p className="text-xs text-slate-500">No weekly schedule saved. Add time blocks below.</p>}
                      {availability.map((item, index) => (
                        <div key={`${doctor.id}-${index}`} className="grid gap-2 sm:grid-cols-[1.2fr_1fr_1fr_.8fr_auto]">
                          <select aria-label="Day of week" value={item.day_of_week} onChange={(event) => setAvailability((items) => items.map((row, i) => i === index ? { ...row, day_of_week: event.target.value } : row))} className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs">
                            {days.map((day) => <option key={day} value={day}>{day}</option>)}
                          </select>
                          <input aria-label="Start time" type="time" value={item.start_time} onChange={(event) => setAvailability((items) => items.map((row, i) => i === index ? { ...row, start_time: event.target.value } : row))} className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs" />
                          <input aria-label="End time" type="time" value={item.end_time} onChange={(event) => setAvailability((items) => items.map((row, i) => i === index ? { ...row, end_time: event.target.value } : row))} className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs" />
                          <input aria-label="Slot duration in minutes" type="number" min="5" max="240" value={item.slot_duration_minutes} onChange={(event) => setAvailability((items) => items.map((row, i) => i === index ? { ...row, slot_duration_minutes: Number(event.target.value) } : row))} className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs" />
                          <button type="button" aria-label="Remove time block" onClick={() => setAvailability((items) => items.filter((_, i) => i !== index))} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><X className="h-4 w-4" /></button>
                        </div>
                      ))}
                      <button type="button" disabled={savingAvailability} onClick={() => saveAvailability(doctor.id)} className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50">{savingAvailability ? "Saving…" : "Save weekly schedule"}</button>
                    </>
                  )}
                </section>
              )}
            </article>
          ))}
        </div>
      )}

      {editingDoctor && editProfile && (
        <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" aria-labelledby="edit-doctor-title" className="my-auto w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 id="edit-doctor-title" className="text-xl font-black text-slate-950">Edit doctor profile</h2>
                <p className="mt-1 text-sm text-slate-500">Dr. {editingDoctor.user.full_name}</p>
              </div>
              <button type="button" onClick={() => setEditingDoctor(null)} aria-label="Close edit profile" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2">
              {[
                ["specialization", "Specialization", "text"],
                ["license_number", "License / registration", "text"],
                ["qualifications", "Qualifications", "text"],
                ["experience_years", "Experience in years", "number"],
                ["consultation_fee", "Consultation fee", "number"],
              ].map(([field, label, type]) => (
                <label key={field} className="text-xs font-bold text-slate-600">
                  {label}
                  <input required={field === "specialization" || field === "license_number"} type={type} min={type === "number" ? "0" : undefined} value={editProfile[field]} onChange={(event) => updateEditProfile(field, event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-900" />
                </label>
              ))}
              <label className="text-xs font-bold text-slate-600 sm:col-span-2">
                Bio
                <textarea rows={3} value={editProfile.bio} onChange={(event) => updateEditProfile("bio", event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-900" />
              </label>
              <div className="flex justify-end gap-2 sm:col-span-2">
                <button type="button" onClick={() => setEditingDoctor(null)} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button disabled={workingId === editingDoctor.id} className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50">{workingId === editingDoctor.id ? "Saving…" : "Save profile"}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};

export default AdminDoctors;
