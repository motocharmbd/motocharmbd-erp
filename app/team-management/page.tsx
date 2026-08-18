"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Personnel = {
  id: string;
  email: string;
  access_type: string;
  created_date: string;
};

export default function TeamManagementPage() {
  const [personnelList, setPersonnelList] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const [currentUserRole, setCurrentUserRole] = useState<string>("Viewer");
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempRole, setTempRole] = useState<string>("");

  useEffect(() => {
    fetchUserDataAndPersonnel();
  }, []);

  async function fetchUserDataAndPersonnel() {
    setLoading(true);
    try {
      // ১. Supabase থেকে বর্তমান লগইন করা ইউজারের সেশন আনুন
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email || ""; 
      setCurrentUserEmail(email);

      // ২. সমস্ত পার্সোনেল লিস্ট ফেচ করুন
      const { data: list, error } = await supabase
        .from("authorized_personnel")
        .select("*");

      if (error) throw error;
      const fetchedList = list || [];
      setPersonnelList(fetchedList);

      // ৩. ডাটাবেসের লিস্ট থেকে বর্তমান ইউজারের রোল সরাসরি খুঁজে বের করুন
      const matchedUser = fetchedList.find(
        (p) => p.email.toLowerCase() === email.toLowerCase()
      );

      if (matchedUser) {
        setCurrentUserRole(matchedUser.access_type);
      } else {
        // যদি ডাটাবেস টেবিলে ইমেইলটি সরাসরি না পাওয়া যায়, তখন ফিক্সড অ্যাডমিন ইমেইল চেক করবে
        if (email.toLowerCase() === "motocharmbdofficial@gmail.com") {
          setCurrentUserRole("Full Admin");
        } else {
          setCurrentUserRole("Viewer");
        }
      }

    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateRole(id: string, newRole: string) {
    if (currentUserRole !== "Full Admin") {
      alert("Access Denied! Only Full Admins can modify roles.");
      return;
    }

    try {
      const { error } = await supabase
        .from("authorized_personnel")
        .update({ access_type: newRole })
        .eq("id", id);

      if (error) {
        alert(error.message);
        return;
      }

      setPersonnelList(prev =>
        prev.map(item => (item.id === id ? { ...item, access_type: newRole } : item))
      );
      setEditingId(null);
      alert("Role updated successfully!");
    } catch (err) {
      console.error("Update error:", err);
    }
  }

  async function handleRevoke(id: string) {
    if (currentUserRole !== "Full Admin") {
      alert("Access Denied! Only Full Admins can revoke access.");
      return;
    }

    if (!window.confirm("Are you sure you want to revoke access for this user?")) return;

    try {
      const { error } = await supabase
        .from("authorized_personnel")
        .delete()
        .eq("id", id);

      if (error) {
        alert(error.message);
        return;
      }

      setPersonnelList(prev => prev.filter(item => item.id !== id));
      alert("Access revoked successfully!");
    } catch (err) {
      console.error("Revoke error:", err);
    }
  }

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading authorized personnel...</div>;
  }

  return (
    <div className="p-6">
      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Authorized Personnel List</h2>
          <span className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-600">
            Logged in as: <strong>{currentUserEmail}</strong> ({currentUserRole})
          </span>
        </div>
        
        {currentUserRole !== "Full Admin" && (
          <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 border border-amber-200">
            ⚠️ You are logged in as <strong>{currentUserRole}</strong>. You have view-only access and cannot modify roles.
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-4">Username / Email</th>
                <th className="py-3 px-4">Access Type</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {personnelList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-400">No personnel found.</td>
                </tr>
              ) : (
                personnelList.map(person => {
                  const isEditing = editingId === person.id;
                  const isFullAdmin = currentUserRole === "Full Admin";

                  return (
                    <tr key={person.id} className="hover:bg-gray-50/50">
                      <td className="py-4 px-4 font-medium text-gray-800">{person.email}</td>
                      
                      <td className="py-4 px-4">
                        {isEditing ? (
                          <select
                            value={tempRole}
                            onChange={(e) => setTempRole(e.target.value)}
                            className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Full Admin">Full Admin</option>
                            <option value="Editor">Editor</option>
                            <option value="Viewer">Viewer</option>
                          </select>
                        ) : (
                          <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                            person.access_type === 'Full Admin' ? 'bg-purple-100 text-purple-700' :
                            person.access_type === 'Editor' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {person.access_type}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-gray-500">{person.created_date}</td>

                      <td className="py-4 px-4 text-right space-x-2">
                        {isFullAdmin ? (
                          isEditing ? (
                            <>
                              <button
                                onClick={() => handleUpdateRole(person.id, tempRole)}
                                className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="rounded-lg bg-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-300 transition"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingId(person.id);
                                  setTempRole(person.access_type);
                                }}
                                className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleRevoke(person.id)}
                                className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
                              >
                                Revoke
                              </button>
                            </>
                          )
                        ) : (
                          <span className="text-xs text-gray-400 italic">No permission</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
