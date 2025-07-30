"use client";

import { RefreshCw, AlertCircle } from "lucide-react";

type Transaction = {
  id: string;
  type: 'Stake' | 'Unstake' | 'Claim' | 'Compound';
  amount: string;
  timestamp: number;
  status: 'Completed';
  blockNumber: number;
};

export default function TransactionHistoryTable({
  transactions,
  isLoading = false,
  error,
  onRefresh,
}: {
  transactions: Transaction[];
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}) {

  if (isLoading) {
    return (
      <div className="card bg-[#121212]/80 border border-[#3F3F46] text-white rounded-xl p-6 hover:shadow-lg transition mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Recent Transactions</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-400">Loading transaction history...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-[#121212]/80 border border-[#3F3F46] text-white rounded-xl p-6 hover:shadow-lg transition mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Recent Transactions</h2>
          {onRefresh && (
            <button 
              onClick={onRefresh}
              className="flex items-center space-x-2 text-sm text-primary hover:underline"
            >
              <RefreshCw size={16} />
              <span>Retry</span>
            </button>
          )}
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3 text-red-400">
            <AlertCircle size={24} />
            <div>
              <p className="font-medium">Failed to load transactions</p>
              <p className="text-sm text-gray-400 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="card bg-[#121212]/80 border border-[#3F3F46] text-white rounded-xl p-6 hover:shadow-lg transition mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Recent Transactions</h2>
        <div className="flex space-x-2">
          {onRefresh && (
            <button 
              onClick={onRefresh}
              className="flex items-center space-x-2 text-sm text-gray-400 hover:text-white transition"
            >
              <RefreshCw size={16} />
              <span>Refresh</span>
            </button>
          )}
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
                <tr key={tx.id} className="hover:bg-gray-800/50 transition">
                  <td className="px-6 py-4 text-sm text-gray-200 font-mono">
                    {tx.id.slice(0, 6)}...{tx.id.slice(-4)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${
                        tx.type === "Stake"
                          ? "bg-purple-900 text-purple-200"
                          : tx.type === "Unstake"
                          ? "bg-red-900 text-red-200"
                          : tx.type === "Claim"
                          ? "bg-green-900 text-green-200"
                          : "bg-blue-900 text-blue-200" // Compound
                      }`}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300 font-mono">
                    {tx.amount} {tx.type === "Claim" ? "XFI" : "XFI"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    <div>
                      <div>{new Date(tx.timestamp).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(tx.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-green-900 text-green-200">
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <a 
                      href={`https://explorer.xinfin.network/tx/${tx.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-purple-300 transition"
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="text-4xl">📝</div>
                    <div className="font-medium">No transactions found</div>
                    <div className="text-sm">
                      Your transaction history will appear here once you start staking
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {transactions.length > 0 && (
        <div className="mt-4 text-xs text-gray-500 text-center">
          Showing {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}