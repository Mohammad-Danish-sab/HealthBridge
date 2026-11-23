import api from "./api";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export const chatService = {
  sendMessage: async (message) => {
    const response = await api.post("/communication/chat/send", message);
    return response.data;
  },

  getHistory: async (otherUserId) => {
    const response = await api.get(
      `/communication/chat/history/${otherUserId}`,
    );
    return response.data;
  },

  getNotifications: async () => {
    const response = await api.get("/communication/notifications");
    return response.data;
  },

  markNotificationRead: async (notifId) => {
    const response = await api.patch(
      `/communication/notifications/${notifId}/read`,
    );
    return response.data;
  },

  connectWebSocket: (token, onMessageCallback, onStatusChange = () => {}) => {
    const apiUrl = new URL(API_BASE_URL, window.location.origin);
    const protocol = apiUrl.protocol === "https:" ? "wss:" : "ws:";
    const basePath = apiUrl.pathname.replace(/\/$/, "");
    const wsUrl = new URL(
      `${protocol}//${apiUrl.host}${basePath}/communication/ws`,
    );
    wsUrl.searchParams.set("token", token);
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => onStatusChange("connected");
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessageCallback(data);
    };
    socket.onerror = () => onStatusChange("error");
    socket.onclose = () => onStatusChange("disconnected");

    return socket;
  },
};
