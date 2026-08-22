'use client';
import { useState, KeyboardEvent, useEffect } from 'react';
import Link from 'next/link';

interface TransactionItem {
  name: string;
  amount: string;
}

interface SavedRecord {
  id: number;
  month: string;
  date: string;
  day: string;
  type: 'Expense' | 'Income';
  items: TransactionItem[];
  total: number;
  notes: string;
}

export default function CompleteExpensePlanner() {
  const [selectedMonth, setSelectedMonth] = useState('August');
  const [selectedDate, setSelectedDate] = useState('2026-08-22');
  const [recordType, setRecordType] = useState<'Expense' | 'Income'>('Expense');
  const [notes, setNotes] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    if (selectedDate) {
      const dateObj = new Date(selectedDate);
      const monthName = dateObj.toLocaleString('en-US', { month: 'long' });
      setSelectedMonth(monthName);
    }
  }, [selectedDate]);

  const getDayName = (dateString: string) => {
    if (!dateString) return 'SATURDAY';
    const dateObj = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { weekday: 'long' };
    return dateObj.toLocaleDateString('en-US', options).toUpperCase();
  };

  const currentDay = getDayName(selectedDate);

  const [rows, setRows] = useState<TransactionItem[]>([
    { name: '', amount: '' },
    { name: '', amount: '' },
    { name: '', amount: '' },
    { name: '', amount: '' },
  ]);

  const [savedRecords, setSavedRecords] = useState<SavedRecord[]>([]);
  const [selectedRecordIds, setSelectedRecordIds] = useState<number[]>([]);

  const handleInputChange = (index: number, field: 'name' | 'amount', value: string) => {
    const updatedRows = [...rows];
    updatedRows[index][field] = value;
    setRows(updatedRows);
  };

  const addRow = () => {
    setRows([...rows, { name: '', amount: '' }]);
  };

  const totalAmount = rows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);

  const handleSaveRecord = () => {
    const validItems = rows.filter(row => row.name.trim() !== '' && !isNaN(parseFloat(row.amount)));
    if (validItems.length === 0) return;

    if (editingId !== null) {
      setSavedRecords(savedRecords.map(rec => rec.id === editingId ? {
        ...rec,
        month: selectedMonth,
        date: selectedDate,
        day: currentDay,
        type: recordType,
        items: validItems,
        total: totalAmount,
        notes: notes,
      } : rec));
      setEditingId(null);
    } else {
      const newRecord: SavedRecord = {
        id: Date.now(),
        month: selectedMonth,
        date: selectedDate,
        day: currentDay,
        type: recordType,
        items: validItems,
        total: totalAmount,
        notes: notes,
      };
      setSavedRecords([...savedRecords, newRecord]);
    }

    setRows([{ name: '', amount: '' }, { name: '', amount: '' }, { name: '', amount: '' }, { name: '', amount: '' }]);
    setNotes('');
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveRecord();
  };

  const handleDeleteRecord = (id: number) => {
    setSavedRecords(savedRecords.filter(r => r.id !== id));
    setSelectedRecordIds(selectedRecordIds.filter(itemId => itemId !== id));
  };

  const handleDeleteSelected = () => {
    if (selectedRecordIds.length === 0) {
      alert('Please select at least one record to delete!');
      return;
    }
    if (confirm('Are you sure you want to delete selected records?')) {
      setSavedRecords(savedRecords.filter(r => !selectedRecordIds.includes(r.id)));
      setSelectedRecordIds([]);
    }
  };

  const handleEditRecord = (record: SavedRecord) => {
    setEditingId(record.id);
    setSelectedMonth(record.month);
    setSelectedDate(record.date);
    setRecordType(record.type);
    setNotes(record.notes);
    
    const paddedItems = [...record.items];
    while (paddedItems.length < 4) {
      paddedItems.push({ name: '', amount: '' });
    }
    setRows(paddedItems);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const dateRecords = savedRecords.filter(r => r.date === selectedDate);

  const totalIncome = dateRecords.filter(r => r.type === 'Income').reduce((sum, r) => sum + r.total, 0);
  const totalExpense = dateRecords.filter(r => r.type === 'Expense').reduce((sum, r) => sum + r.total, 0);
  const netBalance = totalIncome - totalExpense;

  const handleToggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedRecordIds(dateRecords.map(r => r.id));
    else setSelectedRecordIds([]);
  };

  const handleToggleSelectRecord = (id: number) => {
    if (selectedRecordIds.includes(id)) setSelectedRecordIds(selectedRecordIds.filter(itemId => itemId !== id));
    else setSelectedRecordIds([...selectedRecordIds, id]);
  };

  const handleDownloadPDF = () => window.print();

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800 font-sans" onKeyDown={handleKeyDown}>
      {/* Print CSS Fix for background colors */}
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          tr.bg-green-50 {
            background-color: #f0fdf4 !important;
          }
          tr.bg-red-50 {
            background-color: #fef2f2 !important;
          }
        }
      `}</style>

      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col shrink-0 print:hidden">
        <div className="p-5 flex items-center gap-3 border-b border-gray-100">
          <div className="bg-red-600 text-white font-bold p-2 rounded-lg text-lg">MC</div>
          <span className="font-bold text-xl text-red-600 tracking-wide">Moto Charm</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 text-sm font-medium">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg">🏠 Dashboard</Link>
          <Link href="/expense-planner" className="flex items-center gap-3 px-4 py-3 bg-red-50 text-red-600 rounded-lg font-semibold">📊 Income & Expense</Link>
        </nav>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8 gap-4 print:hidden">
          <h1 className="text-2xl font-bold text-gray-800">
            {editingId !== null ? '✏️ Edit Record' : 'Income & Expense Planner'}
          </h1>
          <div className="flex gap-4">
             <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="border p-2 rounded text-xs bg-white">
               {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => <option key={m} value={m}>{m}</option>)}
             </select>
             <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="border p-2 rounded text-xs bg-white cursor-pointer" />
          </div>
        </div>

        <div className="max-w-2xl mx-auto space-y-6 mb-12 print:hidden">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className={`text-white font-bold text-center py-3 flex justify-between px-6 items-center ${recordType === 'Income' ? 'bg-green-600' : 'bg-red-600'}`}>
              <span>{currentDay} ({selectedDate})</span>
              <select value={recordType} onChange={(e) => setRecordType(e.target.value as any)} className="text-black text-xs p-1 rounded font-bold cursor-pointer">
                <option value="Expense">Expense</option>
                <option value="Income">Income</option>
              </select>
            </div>
            <div className="p-4 space-y-3">
              {rows.map((row, i) => (
                <div key={i} className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-2 text-center text-xs font-bold text-gray-500">{i + 1}</div>
                  <input type="text" value={row.name} onChange={(e) => handleInputChange(i, 'name', e.target.value)} placeholder="Item name" className="col-span-6 border rounded px-3 py-2 text-xs bg-gray-50/50" />
                  <input type="number" value={row.amount} onChange={(e) => handleInputChange(i, 'amount', e.target.value)} placeholder="0.00" className="col-span-4 border rounded px-2 py-2 text-xs text-center bg-gray-50/50" />
                </div>
              ))}
              <button onClick={addRow} className="w-full border-2 border-dashed border-gray-300 py-2 rounded-lg text-xs font-semibold text-gray-600">+ Add Row</button>
            </div>
            <div className="bg-gray-100 p-4 font-bold text-xs flex justify-between">
              <span>TOTAL {recordType.toUpperCase()}:</span>
              <span className={recordType === 'Income' ? 'text-green-600 text-sm' : 'text-red-600 text-sm'}>৳ {totalAmount.toFixed(2)}</span>
            </div>
          </div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Daily notes or remarks..." className="w-full p-3 border rounded-lg text-xs bg-gray-50/50" rows={3} />
          <button onClick={handleSaveRecord} className={`text-white px-8 py-3 rounded-xl text-sm w-full font-bold shadow-md transition ${editingId !== null ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-900 hover:bg-black'}`}>
            {editingId !== null ? 'Update Record' : 'Save Record'}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 print:hidden">
            <h2 className="text-xl font-bold text-gray-800">History for {selectedDate}</h2>
            <div className="flex gap-2">
              {selectedRecordIds.length > 0 && (
                <button onClick={handleDeleteSelected} className="bg-red-50 text-red-600 hover:bg-red-100 font-bold px-3 py-2 rounded-xl text-xs border border-red-200 transition">
                  🗑️ Delete Selected ({selectedRecordIds.length})
                </button>
              )}
              <button onClick={handleDownloadPDF} className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm">
                📥 Download PDF
              </button>
            </div>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b uppercase font-bold text-gray-600">
                <th className="p-3 print:hidden"><input type="checkbox" onChange={handleToggleSelectAll} checked={selectedRecordIds.length === dateRecords.length && dateRecords.length > 0} /></th>
                <th className="p-3">SL</th>
                <th className="p-3">Type</th>
                <th className="p-3">Item Name</th>
                <th className="p-3">Notes</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 text-center print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody>
              {dateRecords.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-6 text-gray-400">No records found.</td></tr>
              ) : (
                dateRecords.flatMap((rec) => 
                  rec.items.map((item, itemIdx) => {
                    const globalIdx = dateRecords.slice(0, dateRecords.indexOf(rec)).reduce((acc, curr) => acc + curr.items.length, 0) + itemIdx;
                    const rowBgClass = rec.type === 'Income' ? 'bg-green-50' : 'bg-red-50';

                    return (
                      <tr key={`${rec.id}-${itemIdx}`} className={`${rowBgClass} border-b border-white/50`}>
                        <td className="p-3 print:hidden align-top"><input type="checkbox" checked={selectedRecordIds.includes(rec.id)} onChange={() => handleToggleSelectRecord(rec.id)} /></td>
                        <td className="p-3 font-bold text-gray-500">{globalIdx + 1}</td>
                        <td className="p-3 font-bold">{rec.type}</td>
                        <td className="p-3 font-semibold text-gray-700">{item.name}</td>
                        <td className="p-3 text-gray-400 italic">{rec.notes || 'No notes'}</td>
                        <td className={`p-3 text-right font-bold ${rec.type === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
                          {rec.type === 'Income' ? '+' : '-'} ৳ {parseFloat(item.amount || '0').toFixed(2)}
                        </td>
                        <td className="p-3 text-center print:hidden space-x-2">
                          <button onClick={() => handleEditRecord(rec)} className="text-blue-600 font-bold">Edit</button>
                          <button onClick={() => handleDeleteRecord(rec.id)} className="text-red-600 font-bold">Delete</button>
                        </td>
                      </tr>
                    );
                  })
                )
              )}
            </tbody>
          </table>

          <div className="mt-6 border-t pt-4 flex flex-col items-end space-y-1 text-xs font-bold">
            <div className="text-green-600">Total Income: ৳ {totalIncome.toFixed(2)}</div>
            <div className="text-red-600">Total Expense: ৳ {totalExpense.toFixed(2)}</div>
            <div className="border-t pt-1 text-gray-900 text-sm">
              Net Balance: <span className={netBalance >= 0 ? 'text-green-600' : 'text-red-600'}>৳ {netBalance.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}