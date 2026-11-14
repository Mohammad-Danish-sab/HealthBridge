import React, { useState, useEffect } from "react";
import { pharmacyService } from "../../services/pharmacyService";
import { ShoppingBag, Plus, CheckCircle } from "lucide-react";

const AdminPharmacy = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "",
    manufacturer: "",
    description: "",
    unit_price: "",
    stock_quantity: "",
    requires_prescription: false,
  });

  const fetchMedicines = async () => {
    try {
      const data = await pharmacyService.getMedicines();
      setMedicines(data);
    } catch (err) {
      console.error("Failed to load medicines:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await pharmacyService.addMedicine({
        ...form,
        unit_price: parseFloat(form.unit_price),
        stock_quantity: parseInt(form.stock_quantity),
      });
      alert("Medicine added to catalog successfully!");
      setForm({
        name: "",
        manufacturer: "",
        description: "",
        unit_price: "",
        stock_quantity: "",
        requires_prescription: false,
      });
      fetchMedicines();
    } catch (err) {
      console.error("Failed to add medicine:", err);
      alert("Error adding medicine.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <ShoppingBag className="h-8 w-8 text-purple-600" />
        <h1 className="text-3xl font-black text-gray-900">
          Pharmacy & Inventory Management
        </h1>
      </div>

      {/* Add Medicine Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-4"
      >
        <h2 className="text-lg font-bold text-gray-900">Add New Medicine</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Medicine Name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-xl text-sm"
          />
          <input
            type="text"
            placeholder="Manufacturer"
            required
            value={form.manufacturer}
            onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-xl text-sm"
          />
          <input
            type="number"
            step="0.01"
            placeholder="Unit Price ($)"
            required
            value={form.unit_price}
            onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-xl text-sm"
          />
          <input
            type="number"
            placeholder="Stock Quantity"
            required
            value={form.stock_quantity}
            onChange={(e) =>
              setForm({ ...form, stock_quantity: e.target.value })
            }
            className="px-4 py-2 border border-gray-300 rounded-xl text-sm"
          />
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={form.requires_prescription}
              onChange={(e) =>
                setForm({ ...form, requires_prescription: e.target.checked })
              }
              className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
            />
            Requires Prescription
          </label>
        </div>
        <button
          type="submit"
          className="bg-purple-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-purple-700 transition flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Add Medicine
        </button>
      </form>

      {/* Medicines Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                Medicine
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                Manufacturer
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                Prescription
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {medicines.map((med) => (
              <tr key={med.id}>
                <td className="px-6 py-4 font-bold text-gray-900">
                  {med.name}
                </td>
                <td className="px-6 py-4 text-gray-600">{med.manufacturer}</td>
                <td className="px-6 py-4 text-gray-900 font-semibold">
                  ${med.unit_price.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {med.stock_quantity} units
                </td>
                <td className="px-6 py-4">
                  {med.requires_prescription ? (
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Required
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      OTC
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPharmacy;
