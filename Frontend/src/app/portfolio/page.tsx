'use client';

import { useStakeAndBakeNFT } from '@/hooks/useStakeAndBakeNFT';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { ExternalLink, TrendingUp, TrendingDown, Clock, DollarSign } from 'lucide-react';

// Transaction Row Component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TransactionRow({ transaction }: { transaction: any }) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Buy':
        return 'text-green-400 bg-green-400/10';
      case 'Sell':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Buy':
        return <TrendingUp className="w-4 h-4" />;
      case 'Sell':
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-[#1A1A1A]/60 border border-[#3F3F46] rounded-lg hover:bg-[#1A1A1A]/80 transition-colors">
      <div className="flex items-center space-x-4">
        <div className={`p-2 rounded-lg ${getTypeColor(transaction.type)}`}>
          {getTypeIcon(transaction.type)}
        </div>
        <div>
          <div className="font-medium text-white">{transaction.type} sbFT</div>
          <div className="text-sm text-gray-400">
            {new Date(transaction.timestamp).toLocaleDateString()} at {new Date(transaction.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
      
      <div className="text-right">
        <div className="font-mono text-white">
          {parseFloat(transaction.amount).toFixed(4)} sbFT
        </div>
        <div className="text-sm text-gray-400">
          @ ${parseFloat(transaction.price).toFixed(6)} USDC
        </div>
        <div className="text-xs text-gray-500">
          Total: ${parseFloat(transaction.totalValue).toFixed(2)} USDC
        </div>
      </div>
      
      <Link
        href={`https://test.xfiscan.com/tx/${transaction.hash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:text-blue-300 transition-colors"
        title="View on CrossFi Explorer"
      >
        <ExternalLink className="w-4 h-4" />
      </Link>
    </div>
  );
}

// NFT Banner Component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function NFTBanner({ nftData }: { nftData: any }) {
  return (
    <div className="relative overflow-hidden rounded-2xl mb-8">
      {/* Background Image with Blur Effect */}
      <div 
        className="absolute inset-0 bg-cover bg-center filter blur-sm scale-110"
        style={{ backgroundImage: `url(${nftData.image})` }}
      />
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/70" />
      
      {/* Content */}
      <div className="relative z-10 p-8 md:p-12">
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
          {/* NFT Image */}
          <div className="relative">
            <Image
              src={nftData.image}
              alt={nftData.name}
              width={200}
              height={200}
              className="w-32 h-32 md:w-48 md:h-48 rounded-xl border-2 border-white/20 shadow-2xl"
            />
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full font-bold">
              #{nftData.tokenId}
            </div>
          </div>
          
          {/* NFT Details */}
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {nftData.name}
            </h1>
            <p className="text-gray-300 mb-4 max-w-2xl">
              {nftData.description}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-gray-300 text-sm">Total Revenue</div>
                <div className="text-white text-xl font-bold">{nftData.totalRevenue} XFI</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-gray-300 text-sm">Total sbFT Supply</div>
                <div className="text-white text-xl font-bold">{nftData.totalSbftSupply} sbFT</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-gray-300 text-sm">Your Share</div>
                <div className="text-white text-xl font-bold">
                  {parseFloat(nftData.totalSbftSupply) > 0 
                    ? ((parseFloat(nftData.userSbftBalance) / parseFloat(nftData.totalSbftSupply)) * 100).toFixed(4)
                    : '0.00'
                  }%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// User Stats Component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function UserStats({ nftData }: { nftData: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-[#121212]/80 border border-[#3F3F46] rounded-xl p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-gray-400 text-sm font-medium">Your Stake</h3>
          <DollarSign className="w-5 h-5 text-blue-400" />
        </div>
        <div className="text-2xl font-bold text-white">{nftData.userStakeAmount} XFI</div>
        <div className="text-sm text-gray-500 mt-1">Staked in protocol</div>
      </div>
      
      <div className="bg-[#121212]/80 border border-[#3F3F46] rounded-xl p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-gray-400 text-sm font-medium">sbFT Balance</h3>
          <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
        </div>
        <div className="text-2xl font-bold text-white">{nftData.userSbftBalance} sbFT</div>
        <div className="text-sm text-gray-500 mt-1">Fractional NFT tokens</div>
      </div>
      
      <div className="bg-[#121212]/80 border border-[#3F3F46] rounded-xl p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-gray-400 text-sm font-medium">Pending Rewards</h3>
          <Clock className="w-5 h-5 text-green-400" />
        </div>
        <div className="text-2xl font-bold text-white">{nftData.pendingRewards} XFI</div>
        <div className="text-sm text-gray-500 mt-1">
          {nftData.canClaim ? 'Available to claim' : 'Accumulating...'}
        </div>
      </div>
    </div>
  );
}

// Main Portfolio Component
export default function Portfolio() {
  const { nftData, transactions, isLoading, isConnected } = useStakeAndBakeNFT();
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  if (!isConnected) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4 mt-16">
        <div className="text-center text-white">
          <h1 className="text-3xl font-bold mb-4">Portfolio</h1>
          <p className="text-gray-400">
            Please connect your wallet to view your StakeAndBake NFT portfolio
          </p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <main className="max-w-6xl mx-auto py-12 px-4 mt-16">
        {/* NFT Banner */}
        <NFTBanner nftData={nftData} />
        
        {/* User Stats */}
        <UserStats nftData={nftData} />
        
        {/* Quick Actions */}
        <div className="bg-[#121212]/80 border border-[#3F3F46] rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Link href="/marketplace">
              <button className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors">
                Trade sbFT
              </button>
            </Link>
            <Link href="/stake">
              <button className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors">
                Stake More XFI
              </button>
            </Link>
            <button 
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                nftData.canClaim 
                  ? 'bg-purple-600 hover:bg-purple-500 text-white' 
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
              disabled={!nftData.canClaim}
            >
              Claim Rewards
            </button>
          </div>
        </div>
        
        {/* Transaction History */}
        <div className="bg-[#121212]/80 border border-[#3F3F46] rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">sbFT Trading Activity</h2>
            <button
              onClick={() => setShowAllTransactions(!showAllTransactions)}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              {showAllTransactions ? 'Show Less' : 'View All'}
            </button>
          </div>
          
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-[#1A1A1A]/60 border border-[#3F3F46] rounded-lg p-4">
                  <div className="animate-pulse flex space-x-4">
                    <div className="rounded-lg bg-gray-700 h-10 w-10"></div>
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 bg-gray-700 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-700 rounded w-1/6"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No sbFT trades yet</p>
              <p className="text-sm">Your buy and sell transactions will appear here</p>
              <Link href="/marketplace">
                <button className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
                  Start Trading
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {(showAllTransactions ? transactions : transactions.slice(0, 5)).map((transaction) => (
                <TransactionRow key={transaction.id} transaction={transaction} />
              ))}
              {!showAllTransactions && transactions.length > 5 && (
                <div className="text-center pt-4">
                  <button
                    onClick={() => setShowAllTransactions(true)}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Show {transactions.length - 5} more transactions
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}