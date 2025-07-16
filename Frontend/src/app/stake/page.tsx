'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function StakeForm() {
  const [amount, setAmount] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedToken, setSelectedToken] = useState('');

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-[#1a1a1a]/80 flex items-center justify-center px-4 py-10 mt-16 mx-20">
      <div className="border border-[#3F3F46] bg-gray-600/50 w-full max-w-md rounded-xl p-8 shadow-lg">
        <h1 className="text-3xl font-bold text-white mb-8">Stake</h1>

        {/* Select Token */}
        <div className="mb-6">
          <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-[#141414] text-white cursor-pointer">
            <span className={selectedToken ? 'text-white' : 'text-gray-500'}>
              {selectedToken || 'Select Token'}
            </span>
            <ChevronDown size={16} />
          </div>
        </div>

        {/* Amount */}
        <div className="mb-6">
          <input
            type="number"
            placeholder="minimum of 0.001XFI"
            className="w-full px-4 py-3 rounded-lg bg-[#141414] text-white placeholder-gray-500 outline-none"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        {/* Date */}
        <div className="mb-8">
          <input
            type="date"
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="w-full px-4 py-3 rounded-lg bg-[#141414] text-white outline-none"
          />
        </div>

        {/* Approve Button */}
        <button className="w-full py-3 mb-4 rounded-lg bg-[#7c3aed] text-white font-semibold hover:bg-[#6d28d9] transition">
          Approve
        </button>

        {/* Stake Button */}
        <button className="w-full py-3 rounded-lg bg-[#7c3aed] text-white font-semibold hover:bg-[#6d28d9] transition">
          Stake
        </button>
      </div>
    </div>
    </ProtectedRoute>
  );
}
