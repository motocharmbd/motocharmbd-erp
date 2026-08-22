'use client';
import { useState } from 'react';

const DROPDOWN_COLUMNS = ['itemType', 'storeName'];

export default function BulkOrderPage() {
  const [rows, setRows] = useState(
    Array.from({ length: 14 }, (_, i) => ({
      id: i + 1,
      itemType: 'Parcel',
      storeName: 'Moto Charm BD',
      merchantOrderId: '',
      recipientName: '',
      recipientPhone: '',
      recipientAddress: '',
      recipientCity: '',
      recipientZone: '',
      recipientArea: '',
      amountToCollect: '',
      itemQuantity: '1',
      itemWeight: '0.5',
      itemDesc: '',
      specialInstruction: ''
    }))
  );

  const handleInputChange = (id: number, field: string, value: string) => {
    setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      
      {/* বাম পাশে ফিক্সড সাইডবার */}
      <aside className="w-64 bg-white border-r border-gray-200 p-5 shrink-0">
        <div className="font-bold text-xl text-gray-800 mb-8">Moto Charm</div>
        <nav className="space-y-4">
          <div className="text-sm font-semibold text-gray-600">Dashboard</div>
          <div className="text-sm font-semibold text-gray-600">Deliveries</div>
          <div className="text-sm font-semibold text-gray-600">Invoices</div>
          <div className="text-sm font-semibold text-red-600 border-l-4 border-red-600 pl-2">Bulk Delivery</div>
          <div className="text-sm font-semibold text-gray-600">Create Store</div>
        </nav>
      </aside>

      {/* ডান পাশে মূল কন্টেন্ট এবং টেবিল */}
      <main className="flex-1 p-8 overflow-x-hidden">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Create Bulk Order</h1>

        {/* ট্যাব বাটন */}
        <div className="flex gap-4 mb-6">
          <button className="px-4 py-2 text-sm font-semibold text-gray-500">Single Order</button>
          <button className="px-4 py-2 text-sm font-semibold text-red-600 border-b-2 border-red-600">Bulk Order</button>
        </div>

        {/* টেবিল */}
        <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 text-[11px] uppercase tracking-wider">
                  <th className="p-3 border-r border-gray-200">#</th>
                  {Object.keys(rows[0]).filter(k => k !== 'id').map(key => (
                    <th key={key} className="p-3 border-r border-gray-200 whitespace-nowrap">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100">
                    <td className="p-2 border-r border-gray-200 text-center font-bold text-gray-400 bg-gray-50">{row.id}</td>
                    
                    {Object.keys(row).filter(key => key !== 'id').map((key) => (
                      <td key={key} className="border-r border-gray-200 relative">
                        {DROPDOWN_COLUMNS.includes(key) ? (
                          <div className="relative w-full">
                            <select
                              value={(row as any)[key]}
                              onChange={(e) => handleInputChange(row.id, key, e.target.value)}
                              className="w-full px-2 py-3 text-sm appearance-none bg-transparent focus:outline-none cursor-pointer pr-6"
                            >
                              <option>{(row as any)[key]}</option>
                              <option>Option 2</option>
                            </select>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
                            </div>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={(row as any)[key]}
                            onChange={(e) => handleInputChange(row.id, key, e.target.value)}
                            className="w-full px-2 py-3 text-sm focus:outline-none focus:bg-blue-50/30 bg-transparent"
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* বটম বাটন */}
        <div className="mt-6 flex gap-3">
          <button className="bg-red-600 text-white px-6 py-2 rounded font-semibold text-sm hover:bg-red-700">Confirm Orders</button>
          <button className="border border-gray-300 bg-white px-6 py-2 rounded font-semibold text-sm text-gray-700">Reset Table</button>
          <button className="text-red-600 px-6 py-2 rounded font-semibold text-sm hover:bg-red-50">Go to Error</button>
        </div>
      </main>
    </div>
  );
}