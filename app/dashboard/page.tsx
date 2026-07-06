export default function DashboardPage() {
  const cards = [
    { title: "Today's Sales", value: "৳ 0" },
    { title: "Today's Expense", value: "৳ 0" },
    { title: "Today's Profit", value: "৳ 0" },
    { title: "Total Orders", value: "0" },
  ];

  return (
    <>
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="text-gray-600 mt-2">
        Welcome back, Admin 👋
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-8">
        {cards.map((card) => (
          <div
            key={card.title}
            className="bg-white rounded-2xl shadow-md p-6 border"
          >
            <h3 className="text-gray-500">{card.title}</h3>
            <p className="text-3xl font-bold mt-3">{card.value}</p>
          </div>
        ))}
      </div>
    </>
  );
}
