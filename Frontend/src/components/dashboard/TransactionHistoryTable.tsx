"use client";

// import { RefreshCw } from "lucide-react";
// import { useEffect, useState } from "react";

type Transaction = {
  id: string;
  type: "Stake" | "Unstake" | "Claim";
  amount: string;
  timestamp: number;
  status: "Pending" | "Completed" | "Failed";
};

export default function TransactionHistoryTable({
  transactions,
}: {
  transactions: Transaction[];
}) {
  
  return (
    <div className="card bg-[#121212]/80 border border-[#3F3F46] text-white rounded-xl p-6 hover:shadow-lg transition mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Recent Transactions</h2>
        <div className="flex space-x-2">
          {/* <RefreshCw
            className="text-sm text-gray-400"
            size={16}
          /> */}
          <button className="text-sm text-primary hover:underline">
            View All
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead>
            <tr>
              {["Transaction", "Type", "Amount", "Date", "Status"].map(
                (col) => (
                  <th
                    key={col}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                  >
                    {col}
                  </th>
                )
              )}
              <th className="relative px-6 py-3">
                <span className="sr-only">View</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-700">
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="px-6 py-4 text-sm text-gray-200">
                    {tx.id.slice(0, 6)}...{tx.id.slice(-4)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 inline-flex text-xs font-semibold rounded-full ${
                        tx.type === "Stake"
                          ? "bg-purple-900 text-purple-200"
                          : tx.type === "Unstake"
                          ? "bg-red-900 text-red-200"
                          : "bg-green-900 text-green-200"
                      }`}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {tx.amount} {tx.type === "Claim" ? "sbFT" : "XFI"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(tx.timestamp).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 inline-flex text-xs font-semibold rounded-full ${
                        tx.status === "Completed"
                          ? "bg-green-900 text-green-200"
                          : tx.status === "Pending"
                          ? "bg-yellow-900 text-yellow-200"
                          : "bg-red-900 text-red-200"
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <a href="#" className="text-primary hover:text-purple-300">
                      View
                    </a>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                  No transactions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
