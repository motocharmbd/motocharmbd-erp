"use client";

import { useState } from "react";
import { ShieldCheck, UserPlus, Lock, Mail, CheckCircle2, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  // 🔑 এখানে আপনার নিজের ইচ্ছেমতো অ্যাডমিন পাসওয়ার্ড সেট করে নিন
  const MY_ADMIN_PASSWORD = "my_secure_password_123"; 

  const [password, setPassword] = useState("");
  const [moderatorEmail, setModeratorEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAddModerator = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    setTimeout(() => {
      if (password !== MY_ADMIN_PASSWORD) {
        setErrorMessage("ভুল অ্যাডমিন পাসওয়ার্ড! সঠিক পাসওয়ার্ড দিন।");
        setIsLoading(false);
        return;
      }

      if (!moderatorEmail) {
        setErrorMessage("দয়া করে মডারেটরের ইমেল দিন।");
        setIsLoading(false);
        return;
      }

      // এখানে সফলভাবে মডারেটর ডেটাবেজে যোগ করার লজিক হবে
      setSuccessMessage(`সফলভাবে ${moderatorEmail} কে মডারেটর হিসেবে যুক্ত করা হয়েছে!`);
      setModeratorEmail("");
      setPassword("");
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-slate-800 p-6 text-white flex items-center gap-3">
          <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
            <ShieldCheck className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide">Access Control & Security</h1>
            <p className="text-xs text-gray-400 mt-0.5">Manage administrative privileges and moderators</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleAddModerator} className="p-8 space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
              Moderator Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={moderatorEmail}
                onChange={(e) => setModeratorEmail(e.target.value)}
                placeholder="moderator@gmail.com"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
              Admin Master Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Lock className="v-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="আপনার অ্যাডমিন পাসওয়ার্ড দিন"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Authorize Moderator</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}