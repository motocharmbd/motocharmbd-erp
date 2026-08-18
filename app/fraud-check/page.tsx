"use client";

import { useState } from "react";
import { Search, Activity, ArrowRight, AlertTriangle } from "lucide-react";

export default function FraudCheckPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;

    setLoading(true);
    setSearchResult(null);

    fetch('/api/fraud-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber }),
    })
      .then((res) => res.json())
      .then((data) => {
        setSearchResult(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  const responseData = searchResult?.data || searchResult;
  const courierData = responseData?.data || responseData;
  const summary = courierData?.summary;
  const couriersList = courierData ? Object.entries(courierData).filter(([key]) => key !== 'summary' && key !== 'reports' && key !== 'status' && key !== 'data') : [];
  const reports = searchResult?.reports || responseData?.reports || searchResult?.data?.reports || [];

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Customer Fraud & Risk Intelligence</h1>
        <p className="text-xs text-gray-500 mt-1">Verify customer reliability via BD Courier network in real-time</p>
      </div>

      <form onSubmit={handleSearch} className="flex items-center bg-white rounded-2xl shadow-xl shadow-gray-100 border border-gray-200 overflow-hidden p-2 mb-10">
        <div className="pl-4 text-gray-400"><Search className="w-5 h-5" /></div>
        <input
          type="text"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Enter mobile number (e.g. 017XXXXXXXX)"
          className="w-full px-4 py-3 text-gray-800 text-sm focus:outline-none bg-transparent font-medium"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-[#00B074] hover:bg-[#009c66] text-white font-semibold px-7 py-3 rounded-xl transition-all flex items-center gap-2 text-sm shadow-lg shadow-[#00B074]/20"
        >
          {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : <><span>Verify</span><ArrowRight className="w-4 h-4" /></>}
        </button>
      </form>

      {!searchResult && !loading && (
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-10 text-center shadow-sm space-y-4">
          <div className="w-14 h-14 bg-emerald-50 text-[#00B074] rounded-2xl mx-auto flex items-center justify-center shadow-inner">
            <Activity className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">Ready to Analyze</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Input any customer phone number above to inspect full delivery behavior and return ratios via BD Courier.
            </p>
          </div>
        </div>
      )}

      {searchResult && (
        <div className="space-y-6">
          {reports.length > 0 ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="text-sm font-extrabold uppercase tracking-wider">Fraud / Scam Reports Found ({reports.length})</h3>
              </div>
              <div className="space-y-3">
                {reports.map((rep: any, idx: number) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-red-100 flex items-start justify-between gap-4 text-xs shadow-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {rep.courierLogo && <img src={rep.courierLogo} alt={rep.courierName} className="w-5 h-5 object-contain" />}
                        <span className="font-bold text-gray-800">{rep.courierName || rep.name || "Unknown Courier"}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500">{rep.name}</span>
                      </div>
                      <p className="text-red-600 font-medium">{rep.details || rep.reason || "Fraud reported"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-emerald-800 text-xs font-semibold shadow-sm">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">✓</div>
              <span>No fraud or scam reports found for this number across any courier network.</span>
            </div>
          )}

          {summary && (
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Orders</p>
                <h3 className="text-2xl font-black text-gray-800 mt-1">{summary.total_parcel}</h3>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-emerald-100 shadow-sm">
                <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Successful</p>
                <h3 className="text-2xl font-black text-emerald-600 mt-1">{summary.success_parcel}</h3>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-red-100 shadow-sm">
                <p className="text-xs text-red-500 font-bold uppercase tracking-wider">Cancelled</p>
                <h3 className="text-2xl font-black text-red-500 mt-1">{summary.cancelled_parcel}</h3>
              </div>
            </div>
          )}

          {couriersList.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Multi-Courier Breakdown</h3>
              <div className="space-y-3">
                {couriersList.map(([key, courier]: [string, any]) => (
                  <div key={key} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                    <div className="flex items-center gap-3">
                      {courier.logo && <img src={courier.logo} alt={courier.name} className="w-6 h-6 object-contain" />}
                      <span className="font-bold text-gray-700">{courier.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-500">Total: <b className="text-gray-800">{courier.total_parcel}</b></span>
                      <span className="text-emerald-600">Delivered: <b className="text-emerald-700">{courier.success_parcel}</b></span>
                      <span className="text-red-500">Cancelled: <b className="text-red-600">{courier.cancelled_parcel}</b></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}