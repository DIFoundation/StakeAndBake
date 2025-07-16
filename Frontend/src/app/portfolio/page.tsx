'use client';

import FnftCard from '@/components/FNFTCard';
import TransactionTable from '@/components/TransactionTable';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function Portfolio() {
  // Replace with real fetched data (via contract or API)
  const fnfts = [
    {
      title: 'XFI sbFT #1234',
      value: '$5,000',
      staked: '8 XFI',
      rewards: '0.4 XFI',
      image: '/nft1.jpg'
    },
    {
      title: 'XFI sbFT #5678',
      value: '$2,500',
      staked: '2 XFI',
      rewards: '0.1 XFI',
      image: '/nft2.jpg'
    }
  ];

  const transactions = [
    { type: 'Staking', amount: '+100 XFI', start: '2023-08-15', end: '2023-08-15', status: 'In progress' },
    { type: 'Selling', amount: '-50 XFI', start: '2023-08-20', end: '2023-08-20', status: 'Completed' },
    { type: 'Rewards', amount: '+10 XFI', start: '2023-09-01', end: '2023-09-01', status: 'Completed' },
    { type: 'Staking', amount: '+200 XFI', start: '2023-09-10', end: '2023-09-10', status: 'Completed' },
    { type: 'Selling', amount: '-100 XFI', start: '2023-09-15', end: '2023-09-15', status: 'Completed' }
  ];

  return (
    <ProtectedRoute>
      <main className="min-h-screen text-white px-6 py-10 md:px-24 mt-16">
        <h1 className="text-3xl font-bold mb-2">Portfolio</h1>
        <p className="text-gray-400 mb-10">View your fNFT holdings and manage your stakes.</p>

        <div className="space-y-6">
          {fnfts.map((nft, i) => (
            <FnftCard key={i} {...nft} />
          ))}
        </div>

        <div className="mt-16">
          <h3 className="text-lg font-semibold mb-4">Transaction History</h3>
          <TransactionTable data={transactions} />
        </div>
      </main>
    </ProtectedRoute>
  );
}
