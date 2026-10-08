import api from "./api";

export const appointmentService = {
  getAvailableSlots: async (doctorId, targetDate) => {
    const response = await api.get("/appointments/slots", {
      params: { doctor_id: doctorId, target_date: targetDate },
    });
    return response.data;
  },

  bookAppointment: async (bookingData) => {
    const response = await api.post("/appointments/book", bookingData);
    return response.data;
  },

  getMyAppointments: async () => {
    const response = await api.get("/appointments/my-appointments");
    return response.data;
  },

  updateStatus: async (appointmentId, status, cancellationReason = null) => {
    const response = await api.patch(`/appointments/${appointmentId}/status`, {
      status,
      cancellation_reason: cancellationReason,
    });
    return response.data;
  },
};
