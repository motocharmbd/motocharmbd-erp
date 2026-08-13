"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Moderator {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export default function SettingsPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Viewer");
  const [loading, setLoading] = useState(false);
  const [moderators, setModerators] = useState<Moderator[]>([]);

  const fetchModerators = async () => {
    const { data, error } = await supabase
      .from("moderators")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setModerators(data);
    }
  };

  useEffect(() => {
    fetchModerators();
  }, []);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    const { error } = await supabase
      .from("moderators")
      .insert([{ email, password, role }]);

    setLoading(false);

    if (error) {
      alert("Error: " + error.message);
    } else {
      setEmail("");
      setPassword("");
      setRole("Viewer");
      fetchModerators();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to revoke access?")) return;

    const { error } = await supabase
      .from("moderators")
      .delete()
      .eq("id", id);

    if (!error) {
      fetchModerators();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          System Settings & Access Control
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage live credentials and restrict moderator permissions.
        </p>
      </div>

      {/* Create ID Card with Access Type */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-base font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
          Create New Moderator ID & Access Type
        </h2>

        <form onSubmit={handleCreateAccount} className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Username / Email
            </label>
            <input
              type="text"
              placeholder="Enter username or email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-3 rounded-xl focus:outline-none focus:border-blue-600 focus:bg-white text-sm transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-3 rounded-xl focus:outline-none focus:border-blue-600 focus:bg-white text-sm transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Access Type / Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 px-4 py-3 rounded-xl focus:outline-none focus:border-blue-600 focus:bg-white text-sm transition-all cursor-pointer"
            >
              <option value="Viewer">Viewer (Read Only)</option>
              <option value="Editor">Editor (Can Manage Data)</option>
              <option value="Full Admin">Full Access (Admin)</option>
            </select>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all text-sm shadow-md shadow-blue-600/20 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Create Login ID"}
            </button>
          </div>
        </form>
      </div>

      {/* Personnel List Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">
            Authorized Personnel List
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400 bg-slate-50/50">
                <th className="py-3.5 px-6 font-bold">Username / Email</th>
                <th className="py-3.5 px-6 font-bold">Access Type</th>
                <th className="py-3.5 px-6 font-bold">Created Date</th>
                <th className="py-3.5 px-6 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {moderators.map((mod) => (
                <tr key={mod.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-800">
                    {mod.email}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                      mod.role === 'Full Admin' 
                        ? 'bg-purple-50 text-purple-600 border border-purple-100' 
                        : mod.role === 'Editor'
                        ? 'bg-blue-50 text-blue-600 border border-blue-100'
                        : 'bg-amber-50 text-amber-600 border border-amber-100'
                    }`}>
                      {mod.role || 'Viewer'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-500 text-xs">
                    {new Date(mod.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => handleDelete(mod.id)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-medium text-xs px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
              {moderators.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 text-sm">
                    No authorized accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}