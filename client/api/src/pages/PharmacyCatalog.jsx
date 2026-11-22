import React, { useCallback, useEffect, useState } from "react";
import { PackagePlus, Search, ShoppingBag } from "lucide-react";
import { pharmacyService } from "../services/pharmacyService";

export default function PharmacyCatalog() {
  const [medicines, setMedicines] = useState([]);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderingId, setOrderingId] = useState(null);

  const load = useCallback(async (query = "") => {
    setLoading(true);
    try {
      setMedicines(await pharmacyService.getMedicines(query));
    } catch (err) {
      setMedicines([]);
      setMessage({ type: "error", text: err.response?.data?.detail || "We couldn't load the pharmacy catalog." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const order = async (medicine) => {
    setMessage(null);
    setOrderingId(medicine.id);
    try {
      await pharmacyService.placeOrder({
        items: [{ medicine_id: medicine.id, quantity: 1 }],
        shipping_address: "Patient address",
      });
      setMessage({ type: "success", text: `${medicine.name} has been added to your order.` });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.detail || "Unable to place this order." });
    } finally {
      setOrderingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-xs font-bold tracking-[0.16em] text-indigo-600">HEALTHBRIDGE PHARMACY</p><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Your care, delivered.</h1><p className="mt-2 text-sm text-slate-500">Search available medicines and place an order securely.</p></div>
        <div className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700"><ShoppingBag className="h-4 w-4" /> Secure ordering</div>
      </div>

      <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row">
        <label className="flex flex-1 items-center gap-3 px-3"><Search className="h-5 w-5 text-slate-400" /><span className="sr-only">Search medicine</span><input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" && load(search)} placeholder="Search medicine or treatment" className="w-full py-2 text-sm outline-none placeholder:text-slate-400" /></label>
        <button onClick={() => load(search)} className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-600">Search catalog</button>
      </div>

      {message && <div role="status" className={`mt-5 rounded-xl border px-4 py-3 text-sm font-semibold ${message.type === "error" ? "border-rose-100 bg-rose-50 text-rose-700" : "border-emerald-100 bg-emerald-50 text-emerald-700"}`}>{message.text}</div>}
      {loading ? <div className="py-16 text-center text-sm font-medium text-slate-500">Loading medicines...</div> : medicines.length === 0 ? <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No medicines match your search. Try a different term.</div> : <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{medicines.map((medicine) => (
        <article key={medicine.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/70"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><PackagePlus className="h-5 w-5" /></div><h2 className="mt-5 text-lg font-extrabold text-slate-900">{medicine.name}</h2><p className="mt-2 flex-1 text-sm leading-6 text-slate-500">{medicine.description || "Medicine details are available from the pharmacy."}</p><div className="mt-6 flex items-center justify-between gap-3"><p className="text-lg font-black text-slate-900">${Number(medicine.unit_price).toFixed(2)}</p><button onClick={() => order(medicine)} disabled={orderingId === medicine.id} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">{orderingId === medicine.id ? "Adding..." : "Order"}</button></div></article>
      ))}</div>}
    </div>
  );
}
