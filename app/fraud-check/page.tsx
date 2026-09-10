"use client";

import { useState } from "react";
import { Search, Activity, ArrowRight, AlertTriangle, TrendingUp, TrendingDown, Clock } from "lucide-react";

interface CourierStats {
  name: string;
  logo?: string;
  total_parcel: number;
  success_parcel: number;
  cancelled_parcel: number;
  pending?: number;
  success_ratio?: number;
  configured?: boolean;
  source?: string;
}

interface Summary {
  total_parcel: number;
  success_parcel: number;
  cancelled_parcel: number;
  success_ratio?: number;
}

interface FraudReport {
  courierLogo?: string;
  courierName?: string;
  name?: string;
  details?: string;
  reason?: string;
  date?: string;
}

interface SearchResponse {
  success?: boolean;
  phone?: string;
  score?: number;
  data?: {
    summary?: Summary;
    [key: string]: any;
  };
  reports?: FraudReport[];
  error?: string;
  message?: string;
}

export default function FraudCheckPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);

  const allowedCouriers = ["steadfast", "carrybee", "pathao"];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;

    setLoading(true);
    setSearchResult(null);
    setError(null);
    setResponseTime(null);

    const startTime = Date.now();

    fetch("/api/fraud-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber }),
    })
      .then((res) => res.json())
      .then((data: SearchResponse) => {
        const endTime = Date.now();
        setResponseTime(endTime - startTime);
        
        if (data.error || !data.success) {
          setError(data.error || data.message || "Failed to fetch data");
        } else {
          setSearchResult(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Network error occurred");
        setLoading(false);
      });
  };

  const responseData = searchResult?.data || searchResult;
  const courierData = responseData?.data || responseData;
  const summary = courierData?.summary;

  const couriersList = courierData
    ? Object.entries(courierData)
        .filter(([key]) => allowedCouriers.includes(key.toLowerCase()))
        .map(([key, value]) => ({
          key: key.toLowerCase(),
          name: key,
          ...(typeof value === "object" ? value : {})
        } as CourierStats))
    : [];

  const reports = searchResult?.reports || responseData?.reports || searchResult?.data?.reports || [];

  const getStatusColor = (successRatio?: number): string => {
    if (!successRatio) return "text-gray-500";
    if (successRatio >= 80) return "text-emerald-600";
    if (successRatio >= 50) return "text-amber-600";
    return "text-red-600";
  };

  const getStatusBg = (successRatio?: number): string => {
    if (!successRatio) return "bg-gray-50";
    if (successRatio >= 80) return "bg-emerald-50";
    if (successRatio >= 50) return "bg-amber-50";
    return "bg-red-50";
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Customer Fraud & Risk Intelligence
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Verify customer reliability via BD Courier network in real-time
        </p>
      </div>

      <form
        onSubmit={handleSearch}
        className="flex items-center bg-white rounded-2xl shadow-xl shadow-gray-100 border border-gray-200 overflow-hidden p-2 mb-10"
      >
        <div className="pl-4 text-gray-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Enter mobile number (e.g. 017XXXXXXXX)"
          className="w-full px-4 py-3 text-gray-800 text-sm focus:outline-none bg-transparent font-medium"
          required
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-[#00B074] hover:bg-[#009c66] disabled:bg-gray-400 text-white font-semibold px-7 py-3 rounded-xl transition-all flex items-center gap-2 text-sm shadow-lg shadow-[#00B074]/20"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <>
              <span>Verify</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Error</p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Initial State */}
      {!searchResult && !loading && !error && (
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

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-[#00B074] rounded-full animate-spin mx-auto"></div>
            <p className="text-sm text-gray-600 font-medium">Analyzing customer data...</p>
            <p className="text-xs text-gray-500">Checking all courier networks</p>
          </div>
        </div>
      )}

      {/* Results */}
      {searchResult && !loading && (
        <div className="space-y-6">
          {/* Response Info */}
          {responseTime && (
            <div className="flex justify-between items-center text-xs text-gray-500 px-2">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Response time: {responseTime}ms
              </span>
              <span>Phone: {searchResult.phone}</span>
            </div>
          )}

          {/* Fraud Reports */}
          {reports.length > 0 ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="text-sm font-extrabold uppercase tracking-wider">
                  ⚠️ Fraud / Scam Reports Found ({reports.length})
                </h3>
              </div>
              <div className="space-y-3">
                {reports.map((rep, idx) => (
                  <div
                    key={idx}
                    className="bg-white p-4 rounded-xl border border-red-100 text-xs shadow-sm"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      {rep.courierLogo && (
                        <img
                          src={rep.courierLogo}
                          alt={rep.courierName}
                          className="w-5 h-5 object-contain"
                        />
                      )}
                      <div>
                        <p className="font-bold text-gray-800">
                          {rep.courierName || rep.name || "Unknown Courier"}
                        </p>
                        <p className="text-red-600 font-medium mt-1">
                          {rep.details || rep.reason || "Fraud reported"}
                        </p>
                        {rep.date && <p className="text-gray-500 text-xs mt-1">{rep.date}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-emerald-800 text-xs font-semibold shadow-sm">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                ✓
              </div>
              <span>No fraud or scam reports found for this number across any courier network.</span>
            </div>
          )}

          {/* Summary Stats */}
          {summary && (
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Orders</p>
                <h3 className="text-3xl font-black text-gray-800 mt-2">{summary.total_parcel}</h3>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm text-center">
                <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Successful</p>
                <h3 className="text-3xl font-black text-emerald-600 mt-2">{summary.success_parcel}</h3>
              </div>
              <div className="p-4 bg-red-50 rounded-2xl border border-red-100 shadow-sm text-center">
                <p className="text-xs text-red-500 font-bold uppercase tracking-wider">Cancelled</p>
                <h3 className="text-3xl font-black text-red-500 mt-2">{summary.cancelled_parcel}</h3>
              </div>
            </div>
          )}

          {/* Courier Breakdown */}
          {couriersList.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                📦 Multi-Courier Performance Breakdown
              </h3>
              <div className="space-y-3">
                {couriersList.map((courier) => {
                  const total = (courier.total_parcel || 0) + (courier.pending || 0);
                  const delivered = courier.success_parcel || 0;
                  const cancelled = courier.cancelled_parcel || 0;
                  const ratio = total > 0 ? (delivered / (total - (courier.pending || 0))) * 100 : 0;

                  return (
                    <div
                      key={courier.key}
                      className={`${getStatusBg(ratio)} p-4 rounded-xl border border-gray-200 transition-all hover:shadow-md`}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {courier.logo && (
                            <img
                              src={courier.logo}
                              alt={courier.name}
                              className="w-6 h-6 object-contain"
                            />
                          )}
                          <div>
                            <p className="font-bold text-gray-800 capitalize">{courier.name}</p>
                            <p className="text-xs text-gray-500">{courier.source || "API"}</p>
                          </div>
                        </div>
                        <div className={`text-right ${getStatusColor(ratio)}`}>
                          <p className="text-lg font-black">{ratio.toFixed(1)}%</p>
                          <p className="text-xs font-semibold">Success Rate</p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div className="bg-white/50 p-2 rounded border border-gray-200">
                          <p className="text-gray-500 font-semibold">Total</p>
                          <p className="text-gray-800 font-bold text-sm">{courier.total_parcel || 0}</p>
                        </div>
                        <div className="bg-emerald-100/50 p-2 rounded border border-emerald-200">
                          <p className="text-emerald-600 font-semibold">Delivered</p>
                          <p className="text-emerald-700 font-bold text-sm">{courier.success_parcel || 0}</p>
                        </div>
                        <div className="bg-red-100/50 p-2 rounded border border-red-200">
                          <p className="text-red-600 font-semibold">Cancelled</p>
                          <p className="text-red-700 font-bold text-sm">{courier.cancelled_parcel || 0}</p>
                        </div>
                        {courier.pending ? (
                          <div className="bg-amber-100/50 p-2 rounded border border-amber-200">
                            <p className="text-amber-600 font-semibold">Pending</p>
                            <p className="text-amber-700 font-bold text-sm">{courier.pending}</p>
                          </div>
                        ) : null}
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full transition-all"
                          style={{ width: `${Math.min(ratio, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* No Couriers Found */}
          {couriersList.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center text-amber-800 text-xs">
              <p className="font-semibold">No courier data available for this customer.</p>
              <p className="text-amber-600 mt-1">This customer may have no orders in the system.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
