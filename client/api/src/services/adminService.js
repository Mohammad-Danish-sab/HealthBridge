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

  createUser: async (user) => {
    const response = await api.post("/admin/users", user);
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

  createDoctor: async (doctor) => {
    const response = await api.post("/admin/doctors", doctor);
    return response.data;
  },

  updateDoctor: async (doctorId, profile) => {
    const response = await api.patch(`/admin/doctors/${doctorId}`, profile);
    return response.data;
  },

  getDoctorAvailability: async (doctorId) => {
    const response = await api.get(`/admin/doctors/${doctorId}/availability`);
    return response.data;
  },

  setDoctorAvailability: async (doctorId, availability) => {
    const response = await api.put(
      `/admin/doctors/${doctorId}/availability`,
      availability,
    );
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
