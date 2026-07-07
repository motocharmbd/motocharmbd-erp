"use client";

import { useState } from "react";
import ItemModal from "../components/ItemModal";

export default function ItemsPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Items Master</h1>

        <button
          onClick={() => setOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
        >
          + New Item
        </button>
      </div>

      <div className="bg-white rounded-xl shadow mt-6">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-4">Item</th>
              <th className="text-left p-4">Unit</th>
              <th className="text-left p-4">Default Price</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Action</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td colSpan={5} className="text-center py-8 text-gray-500">
                No Items Found
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <ItemModal
        open={open}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}