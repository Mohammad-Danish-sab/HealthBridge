import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Bell, Bot, Calendar, FileText, LayoutDashboard, LifeBuoy, LogOut, Menu, PackageOpen, ShieldCheck, ShoppingBag, Stethoscope, Users, X } from "lucide-react";
import { chatService } from "../services/chatService";

const patientLinks = [
  ["Dashboard", "/dashboard", LayoutDashboard], ["Find care", "/doctors", Stethoscope],
  ["Appointments", "/appointments", Calendar], ["Records", "/medical-records", FileText], ["Pharmacy", "/pharmacy", ShoppingBag],
  ["AI Assistant", "/ai-assistant", Bot], ["Support", "/support", LifeBuoy],
];
const doctorLinks = [
  ["Dashboard", "/doctor/dashboard", LayoutDashboard], ["Appointments", "/doctor/appointments", Calendar],
  ["Patients", "/doctor/patients", Users], ["Availability", "/doctor/availability", Calendar],
];
const adminLinks = [
  ["Command center", "/admin/dashboard", LayoutDashboard], ["Users", "/admin/users", ShieldCheck], ["Pharmacy", "/admin/pharmacy", PackageOpen],
  ["Doctors", "/admin/doctors", Stethoscope], ["Complaints", "/admin/complaints", LifeBuoy], ["Audit logs", "/admin/audit", FileText],
];

export const Navbar = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationLoadError, setNotificationLoadError] = useState(false);
  const notificationIds = useRef(new Set());

  useEffect(() => {
    if (!user) {
      notificationIds.current.clear();
      setUnreadCount(0);
      return undefined;
    }

    let active = true;
    notificationIds.current.clear();
    chatService.getNotifications().then((items) => {
      if (!active) return;
      notificationIds.current = new Set(
        items.filter((item) => !item.is_read).map((item) => item.id),
      );
      setUnreadCount(notificationIds.current.size);
      setNotificationLoadError(false);
    }).catch(() => {
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
    window.addEventListener(
      "healthbridge:notification-read",
      handleNotificationRead,
    );

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

  const links = user.role === "DOCTOR" ? doctorLinks : user.role === "ADMIN" ? adminLinks : patientLinks;
  const home = links[0][1];
  const linkClass = ({ isActive }) => `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-6">
            <Link to={home} className="flex shrink-0 items-center gap-2 text-lg font-black tracking-tight text-slate-950"><span className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-600 text-sm text-white">H</span><span>HealthBridge</span></Link>
            <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
              {links.map(([label, path, Icon]) => <NavLink key={path} to={path} className={linkClass}><Icon className="h-4 w-4" />{label}</NavLink>)}
            </nav>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <NavLink to="/notifications" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : notificationLoadError ? ", unread count unavailable" : ""}`} title={notificationLoadError ? "Unread notification count unavailable" : undefined} className="relative rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-indigo-600"><Bell className="h-5 w-5" />{unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">{unreadCount > 99 ? "99+" : unreadCount}</span>}</NavLink>
            <div className="hidden border-l border-slate-200 pl-3 text-right sm:block"><p className="max-w-32 truncate text-sm font-bold text-slate-900">{user.full_name}</p><p className="text-[11px] font-bold tracking-wide text-indigo-600">{user.role}</p></div>
            <button onClick={logout} className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600" title="Sign out" aria-label="Sign out"><LogOut className="h-5 w-5" /></button>
            <button onClick={() => setOpen((value) => !value)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-expanded={open} aria-label="Toggle navigation">{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
          </div>
        </div>
      </div>
      {open && <nav className="border-t border-slate-200 bg-white px-4 py-3 shadow-lg lg:hidden" aria-label="Mobile navigation"><div className="mx-auto grid max-w-7xl gap-1">{links.map(([label, path, Icon]) => <NavLink key={path} to={path} onClick={() => setOpen(false)} className={linkClass}><Icon className="h-4 w-4" />{label}</NavLink>)}</div></nav>}
    </header>
  );
};
