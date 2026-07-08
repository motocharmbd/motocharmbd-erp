export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-900 text-white p-5">
        <h2 className="text-2xl font-bold mb-8">
          Moto Charm BD
        </h2>

        <nav className="space-y-3">
          <a href="/dashboard" className="block hover:text-blue-400">
            🏠 Dashboard
          </a>

          <a href="/products" className="block hover:text-blue-400">
            📦 Products
          </a>

          <a href="/purchase" className="block hover:text-blue-400">
            📥 Purchase
          </a>

          <a href="/purchase-history" className="block hover:text-blue-400">
            📋 Purchase History
          </a>

          <a href="/orders" className="block hover:text-blue-400">
            🛒 Orders
          </a>

          <a href="/orders-history" className="block hover:text-blue-400">
            📑 Orders History
          </a>

          <a href="/expenses" className="block hover:text-blue-400">
            💸 Expenses
          </a>

          <a href="/settings" className="block hover:text-blue-400">
            ⚙️ Settings
          </a>
        </nav>
      </aside>

      <main className="flex-1 bg-gray-100 p-8">
        {children}
      </main>
    </div>
  );
}