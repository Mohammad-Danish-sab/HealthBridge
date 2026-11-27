import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Bell, HeartPulse, LogOut, Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { chatService } from "../services/chatService";

const pageTitles = {
  "/dashboard": "Patient workspace",
  "/doctors": "Find a doctor",
  "/appointments": "Appointments",
  "/medical-records": "Medical records",
  "/prescriptions": "Prescriptions",
  "/pharmacy": "Pharmacy",
  "/ai-assistant": "AI health assistant",
  "/support": "Help & support",
  "/doctor/dashboard": "Doctor workspace",
  "/doctor/appointments": "Appointments",
  "/doctor/patients": "My patients",
  "/doctor/availability": "Availability",
  "/admin/dashboard": "Platform overview",
  "/admin/users": "User management",
  "/admin/pharmacy": "Pharmacy management",
  "/admin/doctors": "Doctor verification",
  "/admin/complaints": "Support requests",
  "/admin/audit": "Audit activity",
  "/notifications": "Notifications",
};

const roleLabels = {
  PATIENT: "Patient portal",
  DOCTOR: "Doctor portal",
  ADMIN: "Administration",
};

export const Navbar = ({ onMenuClick, menuOpen }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationLoadError, setNotificationLoadError] = useState(false);
  const notificationIds = useRef(new Set());

  useEffect(() => {
    let active = true;
    notificationIds.current.clear();
    chatService
      .getNotifications()
      .then((items) => {
        if (!active) return;
        notificationIds.current = new Set(
          items.filter((item) => !item.is_read).map((item) => item.id),
        );
        setUnreadCount(notificationIds.current.size);
        setNotificationLoadError(false);
      })
      .catch(() => {
        if (active) {
          setUnreadCount(0);
          setNotificationLoadError(true);
        }
      });

    const token = localStorage.getItem("hb_access_token");
    const socket = token
      ? chatService.connectWebSocket(token, (event) => {
          if (event.type !== "NOTIFICATION") return;
          const notificationId = event.data.id;
          if (notificationIds.current.has(notificationId)) return;
          notificationIds.current.add(notificationId);
          setUnreadCount((count) => count + 1);
        })
      : null;

    const handleNotificationRead = (event) => {
      notificationIds.current.delete(event.detail.id);
      setUnreadCount(notificationIds.current.size);
    };
    window.addEventListener("healthbridge:notification-read", handleNotificationRead);

    return () => {
      active = false;
      socket?.close();
      window.removeEventListener(
        "healthbridge:notification-read",
        handleNotificationRead,
      );
    };
  }, [user]);

  if (!user) return null;

  const title =
    pageTitles[location.pathname] ??
    (location.pathname.startsWith("/doctor/patients/")
      ? "Patient overview"
      : location.pathname.startsWith("/doctor/prescribe/")
        ? "Create prescription"
        : "HealthBridge");
  const initials = user.full_name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3 sm:gap-5">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
            aria-label="Open workspace navigation"
            aria-controls="primary-sidebar"
            aria-expanded={menuOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2.5 text-slate-950"
            aria-label="HealthBridge home"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
              <HeartPulse className="h-5 w-5" />
            </span>
            <span className="hidden text-[15px] font-extrabold tracking-tight sm:inline">
              HealthBridge
            </span>
          </Link>
          <span className="hidden h-7 w-px bg-slate-200 sm:block" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">{title}</p>
            <p className="hidden text-[11px] font-medium text-slate-500 sm:block">
              {roleLabels[user.role] ?? "Secure healthcare workspace"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          <NavLink
            to="/notifications"
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : notificationLoadError ? ", unread count unavailable" : ""}`}
            title={notificationLoadError ? "Unread notification count unavailable" : undefined}
            className={({ isActive }) =>
              `relative rounded-xl p-2.5 transition ${
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
              }`
            }
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </NavLink>

          <div className="hidden items-center gap-2.5 border-l border-slate-200 pl-3 sm:flex">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-indigo-50 text-xs font-extrabold text-indigo-700">
              {initials || "HB"}
            </span>
            <div className="max-w-36">
              <p className="truncate text-xs font-bold text-slate-900">
                {user.full_name}
              </p>
              <p className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {user.role}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-xl p-2.5 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
