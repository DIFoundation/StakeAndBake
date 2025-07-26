'use client';

import { useReadContracts } from 'wagmi';
import { formatUnits } from 'viem';
import { TrendingUp, TrendingDown, Volume2, Users } from 'lucide-react';
import { sbFTMarketplaceAddress, sbFTMarketplaceAbi } from "@/contractAddressAndABI"


const MARKETPLACE_ADDRESS = sbFTMarketplaceAddress; // Your deployed marketplace contract address
const MARKETPLACE_ABI = sbFTMarketplaceAbi;

type Props = {
  refreshTrigger: number;
};

export default function MarketplaceHeader({ }: Props) {
  const { data: contractData } = useReadContracts({
    contracts: [
      {
        address: MARKETPLACE_ADDRESS as `0x${string}`,
        abi: MARKETPLACE_ABI,
        functionName: 'getMarketStats',
      },
      {
        address: MARKETPLACE_ADDRESS as `0x${string}`,
        abi: MARKETPLACE_ABI,
        functionName: 'getActiveBuyOrders',
      },
      {
        address: MARKETPLACE_ADDRESS as `0x${string}`,
        abi: MARKETPLACE_ABI,
        functionName: 'getActiveSellOrders',
      },
    ],
    query: {
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });

  // Extract data
  const marketStats = contractData?.[0]?.result as [bigint, bigint, bigint] | undefined;
  const activeBuyOrders = contractData?.[1]?.result as bigint[] | undefined;
  const activeSellOrders = contractData?.[2]?.result as bigint[] | undefined;

  const totalVolume = marketStats ? formatUnits(marketStats[0], 6) : '0'; // USDC has 6 decimals
  const totalTrades = marketStats ? marketStats[1].toString() : '0';
  // const feesCollected = marketStats ? formatUnits(marketStats[2], 6) : '0';

  const totalActiveOrders = (activeBuyOrders?.length || 0) + (activeSellOrders?.length || 0);

  // Mock data for price change (you might want to implement actual price tracking)
  const currentPrice = "1.25"; // This should come from your price calculation logic
  const priceChange = "+5.2%";
  const priceChangePositive = true;

  return (
    <div className="mb-8">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">sbFT Marketplace</h1>
        <p className="text-gray-400">
          Trade your sbFT tokens with other users in a decentralized marketplace
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Current Price */}
        <div className="bg-[#121212]/80 border border-[#3F3F46] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            {priceChangePositive ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400" />
            )}
            <span className="text-sm text-gray-400">Current Price</span>
          </div>
          <p className="text-xl font-bold">${currentPrice}</p>
          <p className={`text-sm ${priceChangePositive ? 'text-green-400' : 'text-red-400'}`}>
            {priceChange}
          </p>
        </div>

        {/* 24h Volume */}
        <div className="bg-[#121212]/80 border border-[#3F3F46] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Volume2 className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-400">Total Volume</span>
          </div>
          <p className="text-xl font-bold">${parseFloat(totalVolume).toLocaleString()}</p>
          <p className="text-sm text-gray-400">USDC</p>
        </div>

        {/* Total Trades */}
        <div className="bg-[#121212]/80 border border-[#3F3F46] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-gray-400">Total Trades</span>
          </div>
          <p className="text-xl font-bold">{totalTrades}</p>
          <p className="text-sm text-gray-400">All time</p>
        </div>

        {/* Active Orders */}
        <div className="bg-[#121212]/80 border border-[#3F3F46] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-gray-400">Active Orders</span>
          </div>
          <p className="text-xl font-bold">{totalActiveOrders}</p>
          <p className="text-sm text-gray-400">
            {activeBuyOrders?.length || 0} buy, {activeSellOrders?.length || 0} sell
          </p>
        </div>
      </div>
    </div>
  );
}