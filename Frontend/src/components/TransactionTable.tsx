
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function TransactionTable({ data }: { data: any[] }) {
  return (
    <div className="overflow-auto rounded-lg border border-[#2a2a2a]/80 w-full">
      <table className="min-w-full bg-[#18181B] text-sm text-left text-gray-400">
        <thead className="text-xs uppercase bg-[#1f1f1f] text-gray-500">
          <tr>
            <th className="px-6 py-4">Type</th>
            <th className="px-6 py-4">Amount</th>
            <th className="px-6 py-4">Date staked</th>
            <th className="px-6 py-4">Stake end</th>
            <th className="px-6 py-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((tx, i) => (
            <tr key={i} className="border-t border-[#2a2a2a]">
              <td className="px-6 py-4 font-medium text-white">{tx.type}</td>
              <td className="px-6 py-4">{tx.amount}</td>
              <td className="px-6 py-4">{tx.start}</td>
              <td className="px-6 py-4">{tx.end}</td>
              <td className="px-6 py-4">
                <span className={`px-3 py-1 text-xs rounded-full ${
                  tx.status === 'In progress' ? 'bg-green-500 text-black' : 'bg-[#2a2a2a] text-gray-300'
                }`}>
                  {tx.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
