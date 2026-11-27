import api from "./api";

export const adminService = {
  getStats: async () => {
    const response = await api.get("/admin/stats");
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get("/admin/users");
    return response.data;
  },

  toggleUserStatus: async (userId) => {
    const response = await api.patch(`/admin/users/${userId}/toggle-status`);
    return response.data;
  },

  getDoctors: async () => {
    const response = await api.get("/admin/doctors");
    return response.data;
  },

  getAuditLogs: async (limit = 100) => {
    const response = await api.get("/admin/audit-logs", { params: { limit } });
    return response.data;
  },

  getComplaints: async () => {
    const response = await api.get("/admin/complaints");
    return response.data;
  },

  updateComplaint: async (complaintId, status, resolutionNotes = null) => {
    const response = await api.patch(
      `/admin/complaints/${complaintId}`,
      {
        status,
        resolution_notes: resolutionNotes,
      },
    );
    return response.data;
  },

  summarizeComplaint: async (complaintId) => {
    const response = await api.post("/ai/admin/complaints/summarize", {
      complaint_id: complaintId,
    });
    return response.data;
  },
};
