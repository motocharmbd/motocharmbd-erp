import SakinCommissionDisplay from "@/app/components/SakinCommissionDisplay";

const courierApis = [
  "Steadfast",
  "Pathao",
  "CarryBee",
];

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

          <a href="/orders" className="block hover:text-blue-400">
            🛒 Orders
          </a>

          <a href="/orders-history" className="block hover:text-blue-400">
            📑 Orders History
          </a>

          <a href="/expenses" className="block hover:text-blue-400">
            💸 Expenses
          </a>

          <a href="/fraud-check" className="block hover:text-blue-400">
            🛡️ Fraud Check
          </a>

          <div className="mt-5 pt-4 border-t border-gray-700">
            <div className="text-[11px] uppercase tracking-wider text-gray-400 mb-3">
              Courier APIs
            </div>
            <div className="space-y-2">
              {courierApis.map((courier) => (
                <div
                  key={courier}
                  className="flex items-center justify-between rounded-lg bg-gray-800 px-3 py-2"
                >
                  <span className="text-sm text-gray-200">{courier}</span>
                  <span className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    API
                  </span>
                </div>
              ))}
            </div>
          </div>

          <a href="/settings" className="block hover:text-blue-400 pt-1">
            ⚙️ Settings
          </a>
        </nav>
      </aside>

      <main className="flex-1 bg-gray-100 p-8">
        {children}
        <SakinCommissionDisplay />
      </main>
    </div>
  );
}
