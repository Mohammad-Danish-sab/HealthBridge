import React, { useCallback, useEffect, useState } from "react";
import { AlertCircle, Bell, Check, RotateCw } from "lucide-react";
import { chatService } from "../services/chatService";

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await chatService.getNotifications());
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          "Unable to load notifications. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const token = localStorage.getItem("hb_access_token");
    const socket = token
      ? chatService.connectWebSocket(token, (event) => {
          if (event.type !== "NOTIFICATION") return;
          setItems((current) =>
            current.some((item) => item.id === event.data.id)
              ? current
              : [{ ...event.data, is_read: false }, ...current],
          );
        })
      : null;
    return () => {
      socket?.close();
    };
  }, [loadNotifications]);

  const read = async (id) => {
    setUpdatingId(id);
    setError("");
    try {
      const updated = await chatService.markNotificationRead(id);
      setItems((current) =>
        current.map((item) => (item.id === id ? updated : item)),
      );
      window.dispatchEvent(
        new CustomEvent("healthbridge:notification-read", { detail: { id } }),
      );
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          "Unable to update this notification. Please try again.",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <Bell className="h-7 w-7 text-indigo-600" />
        <h1 className="text-3xl font-black">Notifications</h1>
      </div>
      {error && (
        <div
          role="alert"
          className="mb-4 flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
          <button
            type="button"
            onClick={loadNotifications}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-rose-300 px-3 py-2 font-semibold hover:bg-rose-100 disabled:opacity-60"
          >
            <RotateCw className="h-4 w-4" /> Retry
          </button>
        </div>
      )}
      {loading ? (
        <p className="py-12 text-center text-sm text-gray-500">
          Loading notifications...
        </p>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
          No notifications yet.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <article
              key={item.id}
              className={`flex items-start justify-between gap-4 rounded-xl border p-4 ${
                item.is_read
                  ? "border-gray-200 bg-white"
                  : "border-indigo-200 bg-indigo-50"
              }`}
            >
              <div>
                <h2 className="font-bold">{item.title}</h2>
                <p className="mt-1 text-sm text-gray-600">{item.message}</p>
                <p className="mt-2 text-xs text-gray-500">
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </div>
              {!item.is_read && (
                <button
                  type="button"
                  onClick={() => read(item.id)}
                  disabled={updatingId !== null}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 disabled:opacity-60"
                >
                  <Check className="h-4 w-4" />
                  {updatingId === item.id ? "Saving..." : "Mark read"}
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
