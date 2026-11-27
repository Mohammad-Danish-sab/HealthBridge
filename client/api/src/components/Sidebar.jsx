import {
  Activity,
  Bot,
  CalendarDays,
  ClipboardList,
  FileClock,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  PackageOpen,
  Pill,
  ShieldCheck,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useEffect } from "react";

const navigationByRole = {
  PATIENT: [
    {
      label: "Overview",
      items: [["Dashboard", "/dashboard", LayoutDashboard]],
    },
    {
      label: "Your care",
      items: [
        ["Find a doctor", "/doctors", Stethoscope],
        ["Appointments", "/appointments", CalendarDays],
        ["Medical records", "/medical-records", FileText],
        ["Prescriptions", "/prescriptions", Pill],
        ["Pharmacy", "/pharmacy", PackageOpen],
      ],
    },
    {
      label: "More",
      items: [
        ["AI health assistant", "/ai-assistant", Bot],
        ["Help & support", "/support", LifeBuoy],
      ],
    },
  ],
  DOCTOR: [
    {
      label: "Overview",
      items: [["Dashboard", "/doctor/dashboard", LayoutDashboard]],
    },
    {
      label: "Practice",
      items: [
        ["Appointments", "/doctor/appointments", CalendarDays],
        ["My patients", "/doctor/patients", Users],
        ["Availability", "/doctor/availability", Activity],
      ],
    },
  ],
  ADMIN: [
    {
      label: "Overview",
      items: [["Command center", "/admin/dashboard", LayoutDashboard]],
    },
    {
      label: "Operations",
      items: [
        ["User management", "/admin/users", Users],
        ["Doctor verification", "/admin/doctors", ShieldCheck],
        ["Pharmacy", "/admin/pharmacy", PackageOpen],
      ],
    },
    {
      label: "Oversight",
      items: [
        ["Support requests", "/admin/complaints", LifeBuoy],
        ["Audit activity", "/admin/audit", FileClock],
      ],
    },
  ],
};

const quickLinks = {
  PATIENT: { label: "Book an appointment", path: "/doctors", icon: CalendarDays },
  DOCTOR: { label: "View appointments", path: "/doctor/appointments", icon: ClipboardList },
  ADMIN: { label: "Review doctors", path: "/admin/doctors", icon: Stethoscope },
};

export const Sidebar = ({ role, open, onClose }) => {
  const location = useLocation();
  const sections = navigationByRole[role] ?? [];
  const quickLink = quickLinks[role];
  const QuickLinkIcon = quickLink?.icon;

  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);

  const linkClass = ({ isActive }) =>
    `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
      isActive
        ? "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-100"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
    }`;

  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-x-0 bottom-0 top-16 z-30 bg-slate-950/35 backdrop-blur-[2px] lg:hidden"
          aria-label="Close navigation menu"
          onClick={onClose}
        />
      )}
      <aside
        id="primary-sidebar"
        aria-label="Workspace navigation"
        className={`fixed bottom-0 left-0 top-16 z-40 flex h-[calc(100vh-4rem)] w-[min(18rem,88vw)] flex-col border-r border-slate-200/80 bg-white transition-transform duration-200 lg:sticky lg:bottom-auto lg:top-16 lg:z-0 lg:h-[calc(100vh-4rem)] lg:w-64 lg:translate-x-0 lg:transition-none ${
          open ? "translate-x-0 shadow-2xl lg:shadow-none" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 lg:hidden">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Activity className="h-4 w-4 text-indigo-600" />
            Workspace menu
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            onClick={onClose}
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-7 overflow-y-auto px-4 py-6" aria-label="Workspace">
          {sections.map((section) => (
            <section key={section.label}>
              <h2 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                {section.label}
              </h2>
              <div className="space-y-1">
                {section.items.map(([label, path, Icon]) => (
                  <NavLink
                    key={path}
                    to={path}
                    end={path === "/dashboard" || path === "/doctor/dashboard" || path === "/admin/dashboard"}
                    className={linkClass}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            </section>
          ))}
        </nav>
        {quickLink && QuickLinkIcon && (
          <div className="border-t border-slate-100 p-4">
            <NavLink
              to={quickLink.path}
              onClick={onClose}
              className="flex items-center gap-3 rounded-2xl bg-slate-900 p-4 text-white shadow-sm transition hover:bg-indigo-700"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10">
                <QuickLinkIcon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                  Quick action
                </span>
                <span className="mt-0.5 block truncate text-sm font-bold">
                  {quickLink.label}
                </span>
              </span>
            </NavLink>
            <p className="mt-4 px-1 text-[11px] leading-relaxed text-slate-400">
              Your care, connected and securely managed.
            </p>
          </div>
        )}
      </aside>
    </>
  );
};
