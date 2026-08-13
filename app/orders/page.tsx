"use client";

import { useState, useEffect } from "react";
import { Save, PlusCircle } from "lucide-react";
import { supabase } from "@/lib/supabase"; // আপনার প্রজেক্টের পাথ অনুযায়ী Supabase ক্লায়েন্ট ইম্পোর্ট করুন

export default function OrderHistoryPage() {
  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    address: "",
    size: "11 Inch",
    quantity: 1,
    totalAmount: 150, 
    advancedPaid: 0,
    productCost: 0,
    deliveryCharge: 60,
    boostCost: 0,
  });

  const [loading, setLoading] = useState(false);

  // সাইজ, কোয়ান্টিটি, ডেলিভারি চার্জ এবং অ্যাডভান্স পেমেন্ট অনুযায়ী Total (Due/COD) অ্যামাউন্ট অটো ক্যালকুলেট হবে
  useEffect(() => {
    const unitPrice = formData.size === "15 Inch" ? 170 : 150;
    const productTotalPrice = unitPrice * Number(formData.quantity);
    const delivery = Number(formData.deliveryCharge) || 0;
    const advance = Number(formData.advancedPaid) || 0;

    const calculatedTotal = (productTotalPrice + delivery) - advance;
    
    setFormData((prev) => ({
      ...prev,
      totalAmount: calculatedTotal > 0 ? calculatedTotal : 0,
    }));
  }, [formData.size, formData.quantity, formData.deliveryCharge, formData.advancedPaid]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const currentDate = new Date().toISOString().split("T")[0]; // আজকের তারিখ (যেমন: 2026-08-13)
    
    // Supabase টেবিলের কলামগুলোর সাথে ফর্মের ফিল্ড হুবহু ম্যাপ করা হলো
    const finalOrderData = { 
      customer_name: formData.customerName,
      phone: formData.phone,
      address: formData.address,
      size: formData.size,
      qty: Number(formData.quantity),
      total_amount: Number(formData.totalAmount),
      advance_amount: Number(formData.advancedPaid),
      product_cost: Number(formData.productCost),
      delivery_charge: Number(formData.deliveryCharge),
      boost_cost: Number(formData.boostCost),
      order_date: currentDate
    };

    try {
      const { error } = await supabase
        .from("orders")
        .insert([finalOrderData]);

      if (error) throw error;

      alert("Order saved successfully to Supabase!");
      
      // ফর্ম রিসেট করা
      setFormData({
        customerName: "",
        phone: "",
        address: "",
        size: "11 Inch",
        quantity: 1,
        totalAmount: 150,
        advancedPaid: 0,
        productCost: 0,
        deliveryCharge: 60,
        boostCost: 0,
      });

      window.location.reload();

    } catch (error) {
      console.error("Error saving order:", error);
      alert("Failed to save order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 space-y-8 bg-gray-50/50 min-h-screen">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Order History & Management</h1>
        <p className="text-xs text-gray-600 mt-0.5">Create and manage all orders directly from here.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-[#00B074]" />
          <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Create New Order (Smart Due Calculation)</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">Customer Name</label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                placeholder="Customer name"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#00B074] shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">Phone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Phone number"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#00B074] shadow-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Delivery address"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#00B074] shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">Size</label>
              <select
                name="size"
                value={formData.size}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#00B074] shadow-sm"
              >
                <option value="11 Inch">11 Inch (৳150)</option>
                <option value="15 Inch">15 Inch (৳170)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">Quantity (Qty)</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                min="1"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#00B074] shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">Total Due / COD Amount (৳) - Auto</label>
              <input
                type="number"
                name="totalAmount"
                value={formData.totalAmount}
                readOnly
                className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-300 rounded-xl text-sm font-extrabold text-green-700 focus:outline-none shadow-sm cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">Advanced Paid (৳)</label>
              <input
                type="number"
                name="advancedPaid"
                value={formData.advancedPaid}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#00B074] shadow-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">Product Cost (৳)</label>
              <input
                type="number"
                name="productCost"
                value={formData.productCost}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#00B074] shadow-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">Delivery Charge (৳)</label>
              <input
                type="number"
                name="deliveryCharge"
                value={formData.deliveryCharge}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#00B074] shadow-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">Boost Cost (৳)</label>
              <input
                type="number"
                name="boostCost"
                value={formData.boostCost}
                onChange={handleInputChange}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-[#00B074] shadow-sm"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading}
              className="px-7 py-3 rounded-xl bg-[#00B074] hover:bg-[#009c66] text-white text-xs font-extrabold shadow-lg shadow-[#00B074]/20 flex items-center gap-2 transition-all uppercase tracking-wider disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {loading ? "Saving..." : "Save Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}