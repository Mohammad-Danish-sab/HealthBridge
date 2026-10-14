import api from "./api";

export const doctorService = {
  searchDoctors: async (params = {}) => {
    const response = await api.get("/doctors/search", { params });
    return response.data;
  },

  createProfile: async (profileData) => {
    const response = await api.post("/doctors/profile", profileData);
    return response.data;
  },

  setAvailability: async (availabilityData) => {
    const response = await api.post("/doctors/availability", availabilityData);
    return response.data;
  },

  verifyDoctor: async (doctorId) => {
    const response = await api.patch(`/doctors/${doctorId}/verify`);
    return response.data;
  },
};
