"use client";

export default function ProductsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">
        Products
      </h1>

      <div className="bg-white p-6 rounded-2xl shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">
          Add Product
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Product Name"
            className="border p-3 rounded-xl"
          />

          <select className="border p-3 rounded-xl">
            <option value="">Select Size</option>
            <option value="11 Inch">11 Inch</option>
            <option value="15 Inch">15 Inch</option>
          </select>

          <input
            type="number"
            placeholder="Purchase Price"
            className="border p-3 rounded-xl"
          />

          <input
            type="number"
            placeholder="Selling Price"
            className="border p-3 rounded-xl"
          />

          <input
            type="number"
            placeholder="Stock Quantity"
            className="border p-3 rounded-xl"
          />
        </div>

        <button className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700">
          Add Product
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-md">
        <h2 className="text-xl font-semibold mb-4">
          Product List
        </h2>

        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Size</th>
              <th className="text-left p-3">Purchase</th>
              <th className="text-left p-3">Selling</th>
              <th className="text-left p-3">Stock</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td className="p-3">No Products Yet</td>
              <td className="p-3">-</td>
              <td className="p-3">-</td>
              <td className="p-3">-</td>
              <td className="p-3">-</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}