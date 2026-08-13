"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // লাইভ সুপাবেস টেবিল থেকে ইমেইল, পাসওয়ার্ড এবং রোল চেক করা
    const { data, error } = await supabase
      .from("moderators")
      .select("*")
      .eq("email", email)
      .eq("password", password)
      .single();

    setLoading(false);

    if (error || !data) {
      alert("দুঃখিত! ইমেইল অথবা পাসওয়ার্ড ভুল হয়েছে।");
    } else {
      // ইউজারের রোল লোকাল স্টোরেজে সেভ করে নেওয়া যাতে পেজে পারমিশন কন্ট্রোল করা যায়
      localStorage.setItem("userRole", data.role || "Viewer");
      localStorage.setItem("userEmail", data.email);

      router.push("/dashboard");
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-wide">
            Moto Charm BD
          </h1>
          <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">
            Live Secure ERP Dashboard
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
              Username / Email
            </label>
            <input
              type="text"
              placeholder="Enter username or email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 text-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-xl transition-all text-sm shadow-lg shadow-blue-600/30 disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Login to Dashboard"}
          </button>
        </form>
      </div>
    </main>
  );
}