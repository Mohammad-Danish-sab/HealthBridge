import api from "./api";

export const chatService = {
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

  connectWebSocket: (token, onMessageCallback) => {
    const wsUrl = `ws://localhost:8000/api/v1/communication/ws?token=${token}`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => console.log("Connected to HealthBridge WebSocket");
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessageCallback(data);
    };
    socket.onerror = (err) => console.error("WebSocket Error:", err);
    socket.onclose = () => console.log("WebSocket Disconnected");

    return socket;
  },
};
