import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function Notifications() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    api.get("/communication/notifications").then((res) => setItems(res.data)).catch(() => setItems([]));
  }, []);
  const read = async (id) => {
    await api.patch(`/communication/notifications/${id}/read`);
    setItems((current) => current.map((item) => item.id === id ? { ...item, is_read: true } : item));
  };
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black mb-6">Notifications</h1>
      {items.length === 0 ? <p className="text-gray-500">No notifications.</p> : (
        <div className="space-y-3">{items.map((item) => (
          <button key={item.id} onClick={() => read(item.id)} className={`block w-full text-left p-4 rounded-xl border ${item.is_read ? "bg-white" : "bg-indigo-50 border-indigo-200"}`}>
            <div className="font-bold">{item.title}</div><div className="text-sm text-gray-600">{item.message}</div>
          </button>
        ))}</div>
      )}
    </div>
  );
}
