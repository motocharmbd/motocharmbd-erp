"use client";

export default function MaterialsPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Materials</h1>

        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
          + Add Material
        </button>
      </div>

      <div className="mt-6 bg-white rounded-lg shadow border">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-3">Material</th>
              <th className="text-left p-3">Unit</th>
              <th className="text-left p-3">Default Price (BDT)</th>
              <th className="text-left p-3">Action</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td className="p-3 text-gray-500" colSpan={4}>
                No materials found
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}