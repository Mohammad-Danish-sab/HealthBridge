import React, { useState } from "react";
import { doctorService } from "../../services/doctorService";
import { Clock, Plus, Trash2, CheckCircle } from "lucide-react";

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const AvailabilityManager = () => {
  const [slots, setSlots] = useState([
    {
      day_of_week: "MONDAY",
      start_time: "09:00:00",
      end_time: "17:00:00",
      slot_duration_minutes: 30,
    },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const handleSlotChange = (index, field, value) => {
    const updated = [...slots];
    updated[index][field] = value;
    setSlots(updated);
  };

  const addSlotRow = () => {
    setSlots([
      ...slots,
      {
        day_of_week: "MONDAY",
        start_time: "09:00:00",
        end_time: "17:00:00",
        slot_duration_minutes: 30,
      },
    ]);
  };

  const removeSlotRow = (index) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await doctorService.setAvailability(slots);
      alert("Availability schedule updated successfully!");
    } catch (err) {
      console.error("Failed to update availability:", err);
      alert("Error updating availability.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Clock className="h-8 w-8 text-emerald-600" />
        <h1 className="text-3xl font-black text-gray-900">
          Manage Availability Schedule
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6"
      >
        <div className="space-y-4">
          {slots.map((slot, index) => (
            <div
              key={index}
              className="grid grid-cols-1 sm:grid-cols-5 gap-3 p-4 bg-gray-50 rounded-xl items-center"
            >
              <select
                value={slot.day_of_week}
                onChange={(e) =>
                  handleSlotChange(index, "day_of_week", e.target.value)
                }
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white font-semibold"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">From:</span>
                <input
                  type="time"
                  required
                  value={slot.start_time.substring(0, 5)}
                  onChange={(e) =>
                    handleSlotChange(
                      index,
                      "start_time",
                      `${e.target.value}:00`,
                    )
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white w-full"
                />
              </div>

              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">To:</span>
                <input
                  type="time"
                  required
                  value={slot.end_time.substring(0, 5)}
                  onChange={(e) =>
                    handleSlotChange(index, "end_time", `${e.target.value}:00`)
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white w-full"
                />
              </div>

              <select
                value={slot.slot_duration_minutes}
                onChange={(e) =>
                  handleSlotChange(
                    index,
                    "slot_duration_minutes",
                    parseInt(e.target.value),
                  )
                }
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value={15}>15 mins</option>
                <option value={30}>30 mins</option>
                <option value={45}>45 mins</option>
                <option value={60}>60 mins</option>
              </select>

              <div className="flex justify-end">
                {slots.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSlotRow(index)}
                    className="text-red-500 hover:text-red-700 p-2"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addSlotRow}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 hover:text-emerald-700"
        >
          <Plus className="h-4 w-4" /> Add Schedule Window
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition flex items-center justify-center gap-2"
        >
          <CheckCircle className="h-5 w-5" /> Save Schedule
        </button>
      </form>
    </div>
  );
};

export default AvailabilityManager;
