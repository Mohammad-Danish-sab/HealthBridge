import api from "./api";

export const pharmacyService = {
  getMedicines: async (search = "") => {
    const response = await api.get("/pharmacy/medicines", {
      params: { search },
    });
    return response.data;
  },

  addMedicine: async (medData) => {
    const response = await api.post("/pharmacy/medicines", medData);
    return response.data;
  },

  placeOrder: async (orderData) => {
    const response = await api.post("/pharmacy/orders", orderData);
    return response.data;
  },

  getMyOrders: async () => {
    const response = await api.get("/pharmacy/orders/my-orders");
    return response.data;
  },

  updateOrderStatus: async (orderId, status) => {
    const response = await api.patch(`/pharmacy/orders/${orderId}/status`, {
      status,
    });
    return response.data;
  },
};
