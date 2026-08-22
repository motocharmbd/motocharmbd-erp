'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const [atSorting, setAtSorting] = useState(0);
  const [inTransit, setInTransit] = useState(0);
  const [atHub, setAtHub] = useState(0);
  const [assigned, setAssigned] = useState(0);
  const [onHold, setOnHold] = useState(0);

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800 font-sans">
      
      {/* বাম পাশের সাইডবার (যেখানে Income & Expense যোগ করা হয়েছে) */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col shrink-0">
        <div className="p-5 flex items-center gap-3 border-b border-gray-100">
          <div className="bg-red-600 text-white font-bold p-2 rounded-lg text-lg">MC</div>
          <span className="font-bold text-xl text-red-600 tracking-wide">Moto Charm</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 text-sm font-medium">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 bg-red-50 text-red-600 rounded-lg font-semibold">
            <span>🏠</span> Dashboard
          </Link>
          <Link href="/new-order" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg">
            <span>📦</span> New Delivery
          </Link>
          <Link href="/invoices" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg">
            <span>📄</span> Invoices
          </Link>
          <Link href="/stores" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg">
            <span>🏪</span> Stores
          </Link>
          
          {/* নতুন যোগ করা Income & Expense অপশন */}
          <Link href="/expense-planner" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition">
            <span>📊</span> Income & Expense
          </Link>

          <Link href="/help-center" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg">
            <span>💬</span> Help Center
          </Link>
        </nav>
      </aside>

      {/* মূল ড্যাশবোর্ড কন্টেন্ট */}
      <main className="flex-1 p-8">
        
        {/* টপ হেডার */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-xl font-bold text-gray-800">Moto Charm BD ERP</h1>
          <Link href="/new-order" className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-lg text-sm shadow-sm transition flex items-center gap-2">
            <span>+</span> New Delivery
          </Link>
        </div>

        {/* সামারি সেকশন */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-800 text-base">Summary</h2>
            <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">Updated just now</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-gray-50/60 border border-gray-100 p-4 rounded-xl text-center">
              <p className="text-xs text-gray-500 mb-1">At sorting</p>
              <h3 className="text-xl font-bold text-gray-800">{atSorting}</h3>
            </div>
            <div className="bg-gray-50/60 border border-gray-100 p-4 rounded-xl text-center">
              <p className="text-xs text-gray-500 mb-1">In transit</p>
              <h3 className="text-xl font-bold text-blue-600">{inTransit}</h3>
            </div>
            <div className="bg-gray-50/60 border border-gray-100 p-4 rounded-xl text-center">
              <p className="text-xs text-gray-500 mb-1">At delivery hub</p>
              <h3 className="text-xl font-bold text-purple-600">{atHub}</h3>
            </div>
            <div className="bg-gray-50/60 border border-gray-100 p-4 rounded-xl text-center">
              <p className="text-xs text-gray-500 mb-1">Assigned for delivery</p>
              <h3 className="text-xl font-bold text-orange-600">{assigned}</h3>
            </div>
            <div className="bg-gray-50/60 border border-gray-100 p-4 rounded-xl text-center">
              <p className="text-xs text-gray-500 mb-1">On hold</p>
              <h3 className="text-xl font-bold text-red-600">{onHold}</h3>
            </div>
          </div>
        </div>

        {/* নিচের গ্রিড অংশ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="font-bold text-gray-800 text-base border-b border-gray-100 pb-3">Cash on Delivery (COD) Details</h2>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Last invoice date</span>
                <span className="font-medium text-gray-800">--</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-50">
                <span className="text-gray-500">Payment sent to you</span>
                <span className="font-semibold text-green-600">৳ 0</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Lifetime earning</span>
                <span className="font-semibold text-gray-800">৳ 0</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <h2 className="font-bold text-gray-800 text-base mb-4">Quick Actions</h2>
            <div className="bg-red-50/40 border border-red-100 p-4 rounded-xl flex items-center justify-between">
              <div>
                <h4 className="font-bold text-gray-800 text-sm">Create New Order</h4>
                <p className="text-xs text-gray-500 mt-0.5">Add a new delivery request instantly</p>
              </div>
              <Link href="/new-order" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-sm">
                Create
              </Link>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}