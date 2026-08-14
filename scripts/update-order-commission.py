from pathlib import Path
import sys

path = Path('app/orders-history/page.tsx')
text = path.read_text(encoding='utf-8')

replacements = [
(
'''  function confirmedCount(rows: Order[], person: string) {
    return rows.filter((row) => confirmedByOrderId[String(row.id)] === person).length;
  }
''',
'''  // Commission rule: 15 TK is earned only when the assigned order is Delivered.
  // If a Delivered order becomes Cancelled (or any non-delivered status),
  // the commission automatically becomes 0 again.
  const COMMISSION_PER_DELIVERED_ORDER = 15;

  function confirmedCount(rows: Order[], person: string) {
    return rows.filter((row) => confirmedByOrderId[String(row.id)] === person).length;
  }

  function deliveredCount(rows: Order[], person: string) {
    return rows.filter(
      (row) =>
        confirmedByOrderId[String(row.id)] === person &&
        String(row.status || '').toLowerCase() === 'delivered'
    ).length;
  }

  function commissionTotal(rows: Order[], person: string) {
    return deliveredCount(rows, person) * COMMISSION_PER_DELIVERED_ORDER;
  }
'''),
(
'''            <th className="p-3 text-left">Order Confirmed By</th>
            <th className="p-3 text-left">Steadfast Courier</th>
''',
'''            <th className="p-3 text-left">Order Confirmed By</th>
            <th className="p-3 text-left">Commission</th>
            <th className="p-3 text-left">Steadfast Courier</th>
'''),
(
'''                  <td className="p-3">
                    <select
                      value={confirmedByOrderId[String(item.id)] || ""}
                      onChange={(e) => setOrderConfirmedBy(item.id, e.target.value)}
                      className="min-w-[135px] rounded-lg border bg-white px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-blue-500"
                      title="Select who confirmed this order"
                    >
                      <option value="">Select Name</option>
                      <option value="Sakin">Sakin</option>
                      <option value="Or">Or</option>
                    </select>
                  </td>
                  <td className="p-3">
''',
'''                  <td className="p-3">
                    <select
                      value={confirmedByOrderId[String(item.id)] || ""}
                      onChange={(e) => setOrderConfirmedBy(item.id, e.target.value)}
                      className="min-w-[135px] rounded-lg border bg-white px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-blue-500"
                      title="Select who confirmed this order"
                    >
                      <option value="">Select Name</option>
                      <option value="Sakin">Sakin</option>
                      <option value="Or">Or</option>
                    </select>
                  </td>
                  <td className="p-3 font-semibold">
                    {String(item.status || '').toLowerCase() === 'delivered' && confirmedByOrderId[String(item.id)]
                      ? <span className="text-green-600">{money(COMMISSION_PER_DELIVERED_ORDER)}</span>
                      : <span className="text-gray-400">{money(0)}</span>}
                  </td>
                  <td className="p-3">
'''),
(
'''        <div className="rounded-lg bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700">
          Sakin: {confirmedCount(rows, "Sakin")} orders
        </div>
        <div className="rounded-lg bg-purple-100 px-4 py-2 text-sm font-bold text-purple-700">
          Or: {confirmedCount(rows, "Or")} orders
        </div>
        <div className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700">
          Unassigned: {rows.length - confirmedCount(rows, "Sakin") - confirmedCount(rows, "Or")} orders
        </div>
''',
'''        <div className="rounded-lg bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700">
          Sakin: {confirmedCount(rows, "Sakin")} orders · Delivered: {deliveredCount(rows, "Sakin")} · Commission: {money(commissionTotal(rows, "Sakin"))}
        </div>
        <div className="rounded-lg bg-purple-100 px-4 py-2 text-sm font-bold text-purple-700">
          Or: {confirmedCount(rows, "Or")} orders · Delivered: {deliveredCount(rows, "Or")} · Commission: {money(commissionTotal(rows, "Or"))}
        </div>
        <div className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700">
          Unassigned: {rows.length - confirmedCount(rows, "Sakin") - confirmedCount(rows, "Or")} orders
        </div>
''')
]

for before, after in replacements:
    if before not in text:
        print('Expected code block not found; refusing partial update.')
        sys.exit(1)
    text = text.replace(before, after, 1)

text = text.replace('colSpan={18}', 'colSpan={19}')
path.write_text(text, encoding='utf-8')
print('Order commission logic updated successfully.')
