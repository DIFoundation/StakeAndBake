'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import MarketplaceHeader from '@/components/marketplace/MarketplaceHeader';
import OrderBook from '@/components/marketplace/OrderBook';
import CreateOrderModal from '@/components/marketplace/CreateOrderModal';
import ActiveOrders from '@/components/marketplace/ActiveOrders';
import OrderHistory from '@/components/marketplace/OrderHistory';
import MarketStats from '@/components/marketplace/MarketStats';
import PriceChart from '@/components/marketplace/PriceChart';
import CEXOrderBook from '@/components/marketplace/CEXOrderBook';
import { Plus, TrendingUp, Clock, BarChart3 } from 'lucide-react';

export default function MarketplacePage() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'orderbook' | 'active' | 'history'>('orderbook');
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Force refresh function for when orders are created/cancelled
  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const tabs = [
    { id: 'orderbook', label: 'Order Book', icon: TrendingUp },
    { id: 'active', label: 'Active Orders', icon: Clock },
    { id: 'history', label: 'Trade History', icon: BarChart3 },
  ];

  if (!isConnected) {
    return (
      <div className="min-h-screen text-white flex flex-col items-center justify-center pt-20">
        <div className="bg-[#121212]/80 border border-[#3F3F46] rounded-xl p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Connect Wallet</h2>
          <p className="text-gray-400 mb-6">
            Please connect your wallet to access the sbFT marketplace.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white pt-20 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Stats */}
        <MarketplaceHeader refreshTrigger={refreshTrigger} />

        {/* Market Stats Row */}
        <MarketStats refreshTrigger={refreshTrigger} />

        <PriceChart refreshTrigger={refreshTrigger} />

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Order Book - Always visible on desktop */}
          <div className="lg:col-span-2">
            <div className="bg-[#121212]/80 border border-[#3F3F46] rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Order Book</h2>
                <button
                  onClick={() => setIsCreateOrderOpen(true)}
                  className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Create Order
                </button>
              </div>
              <OrderBook refreshTrigger={refreshTrigger} />
            </div>
          </div>

          {/* Right Panel - Tabbed Content */}
          <div className="lg:col-span-1">
            <div className="bg-[#121212]/80 border border-[#3F3F46] rounded-xl p-6">
              {/* Tab Navigation */}
              <div className="flex border-b border-[#3F3F46] mb-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition ${
                        activeTab === tab.id
                          ? 'border-purple-500 text-purple-400'
                          : 'border-transparent text-gray-400 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content */}
              <div className="min-h-[400px]">
                {activeTab === 'orderbook' && (
                 
                   <CEXOrderBook refreshTrigger={refreshTrigger} />
                
                )}
                {activeTab === 'active' && (
                  <ActiveOrders 
                    userAddress={address} 
                    refreshTrigger={refreshTrigger}
                    onOrderCancelled={refreshData}
                  />
                )}
                {activeTab === 'history' && (
                  <OrderHistory 
                    userAddress={address} 
                    refreshTrigger={refreshTrigger}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Create Order Modal */}
        {isCreateOrderOpen && (
          <CreateOrderModal
            isOpen={isCreateOrderOpen}
            onClose={() => setIsCreateOrderOpen(false)}
            onOrderCreated={refreshData}
          />
        )}
      </div>
    </div>
  );
}