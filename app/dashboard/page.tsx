export default function DashboardPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Good Evening, Admin 👋
        </h1>

        <p className="text-gray-500 mt-2">
          Here's your business overview today
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-blue-500 text-white p-6 rounded-2xl shadow-lg">
          <h2 className="text-lg">Products</h2>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>

        <div className="bg-green-500 text-white p-6 rounded-2xl shadow-lg">
          <h2 className="text-lg">Purchase Cost</h2>
          <p className="text-3xl font-bold mt-2">৳0</p>
        </div>

        <div className="bg-purple-500 text-white p-6 rounded-2xl shadow-lg">
          <h2 className="text-lg">Orders</h2>
          <p className="text-3xl font-bold mt-2">0</p>
        </div>

        <div className="bg-orange-500 text-white p-6 rounded-2xl shadow-lg">
          <h2 className="text-lg">Profit</h2>
          <p className="text-3xl font-bold mt-2">৳0</p>
        </div>
      </div>
    </div>
  );
}