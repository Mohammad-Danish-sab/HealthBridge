import React, { useEffect, useState } from "react";
import { pharmacyService } from "../services/pharmacyService";

export default function PharmacyCatalog() {
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => setMedicines(await pharmacyService.getMedicines(search));
  useEffect(() => { load(); }, []);

  const order = async (medicine) => {
    try {
      await pharmacyService.placeOrder({ items: [{ medicine_id: medicine.id, quantity: 1 }], shipping_address: "Patient address" });
      setMessage(`${medicine.name} ordered.`);
      await load();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Unable to place order.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-black mb-6">Pharmacy</h1>
      <div className="flex gap-3 mb-6"><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search medicine" className="border rounded-lg px-3 py-2" /><button onClick={load} className="bg-indigo-600 text-white px-5 rounded-lg font-bold">Search</button></div>
      {message && <p className="mb-4">{message}</p>}
      <div className="grid md:grid-cols-3 gap-5">{medicines.map((medicine) => (
        <div key={medicine.id} className="bg-white p-5 rounded-xl border"><h2 className="font-bold">{medicine.name}</h2><p className="text-sm text-gray-500">{medicine.description}</p><p className="mt-2 font-bold">${medicine.unit_price}</p><button onClick={() => order(medicine)} className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg font-bold">Order</button></div>
      ))}</div>
    </div>
  );
}
