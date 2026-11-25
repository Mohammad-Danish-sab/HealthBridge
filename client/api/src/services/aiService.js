import api from "./api";

export const aiService = {
  chat: async (message, history = []) => {
    const response = await api.post("/ai/chat", { message, history });
    return response.data;
  },

  summarizeReport: async (reportText, reportType = "Lab Report") => {
    const response = await api.post("/ai/reports/summarize", {
      report_text: reportText,
      report_type: reportType,
    });
    return response.data;
  },

  explainPrescription: async (prescriptionId) => {
    const response = await api.post("/ai/prescription/explain", {
      prescription_id: prescriptionId,
    });
    return response.data;
  },

  summarizeHistory: async (patientId) => {
    const response = await api.post(`/ai/history/summarize/${patientId}`);
    return response.data;
  },
};
