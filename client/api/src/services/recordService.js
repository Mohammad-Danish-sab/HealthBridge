import api from "./api";

export const recordService = {
  createPrescription: async (prescriptionData) => {
    const response = await api.post("/records/prescriptions", prescriptionData);
    return response.data;
  },

  getPatientPrescriptions: async (patientId) => {
    const response = await api.get(
      `/records/prescriptions/patient/${patientId}`,
    );
    return response.data;
  },

  createLabReport: async (reportData) => {
    const response = await api.post("/records/lab-reports", reportData);
    return response.data;
  },

  getPatientLabReports: async (patientId) => {
    const response = await api.get(`/records/lab-reports/patient/${patientId}`);
    return response.data;
  },
};
