import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { recordService } from "../../services/recordService";
import { FileText, Plus, Trash2, CheckCircle } from "lucide-react";

const PrescriptionWriter = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([
    {
      medicine_name: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: "",
    },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      {
        medicine_name: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
      },
    ]);
  };

  const removeItemRow = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await recordService.createPrescription({
        appointment_id: parseInt(appointmentId),
        diagnosis,
        notes,
        items,
      });
      alert("Digital prescription issued successfully!");
      navigate("/doctor/appointments");
    } catch (err) {
      console.error("Failed to issue prescription:", err);
      alert("Error issuing prescription. Please check inputs.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-emerald-600" />
        <h1 className="text-3xl font-black text-gray-900">
          Issue Digital Prescription
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6"
      >
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Diagnosis
          </label>
          <input
            type="text"
            required
            placeholder="e.g., Acute Bronchitis"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Prescription Items / Medicines
          </label>
          <div className="space-y-4">
            {items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-1 sm:grid-cols-6 gap-3 p-4 bg-gray-50 rounded-xl relative"
              >
                <input
                  type="text"
                  placeholder="Medicine Name"
                  required
                  value={item.medicine_name}
                  onChange={(e) =>
                    handleItemChange(index, "medicine_name", e.target.value)
                  }
                  className="sm:col-span-2 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                />
                <input
                  type="text"
                  placeholder="Dosage (e.g. 500mg)"
                  required
                  value={item.dosage}
                  onChange={(e) =>
                    handleItemChange(index, "dosage", e.target.value)
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                />
                <input
                  type="text"
                  placeholder="Frequency"
                  required
                  value={item.frequency}
                  onChange={(e) =>
                    handleItemChange(index, "frequency", e.target.value)
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                />
                <input
                  type="text"
                  placeholder="Duration"
                  required
                  value={item.duration}
                  onChange={(e) =>
                    handleItemChange(index, "duration", e.target.value)
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Instructions"
                    value={item.instructions}
                    onChange={(e) =>
                      handleItemChange(index, "instructions", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  />
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItemRow(index)}
                      className="text-red-500 hover:text-red-700 p-1"
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
            onClick={addItemRow}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 hover:text-emerald-700"
          >
            <Plus className="h-4 w-4" /> Add Another Medicine
          </button>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Doctor Notes & Advice
          </label>
          <textarea
            rows="3"
            placeholder="Additional recommendations or precautions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition flex items-center justify-center gap-2"
        >
          <CheckCircle className="h-5 w-5" /> Save & Issue Prescription
        </button>
      </form>
    </div>
  );
};

export default PrescriptionWriter;
