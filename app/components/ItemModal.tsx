"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function ItemModal({ open, onClose }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("PCS");
  const [defaultPrice, setDefaultPrice] = useState("");

  if (!open) return null;

  const handleSave = async () => {
    const { error } = await supabase.from("items").insert([
      {
        name,
        category,
        unit,
        default_price: Number(defaultPrice),
        status: true,
      },
    ]);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Item Saved Successfully");

    setName("");
    setCategory("");
    setUnit("PCS");
    setDefaultPrice("");

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl w-[450px]">
        <h2 className="text-2xl font-bold mb-4">
          Add New Item
        </h2>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="Item Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border p-2 rounded"
          />

          <input
            type="text"
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border p-2 rounded"
          />

          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="PCS">PCS</option>
            <option value="Box">Box</option>
            <option value="Set">Set</option>
            <option value="Pair">Pair</option>
          </select>

          <input
            type="number"
            placeholder="Default Price"
            value={defaultPrice}
            onChange={(e) => setDefaultPrice(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="mt-6 flex gap-2">
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Save
          </button>

          <button
            onClick={onClose}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}