import api from "./api";

export const complaintService = {
  create: async (subject, description) => {
    const response = await api.post("/complaints", { subject, description });
    return response.data;
  },

  getMyComplaints: async () => {
    const response = await api.get("/complaints/my");
    return response.data;
  },
};
