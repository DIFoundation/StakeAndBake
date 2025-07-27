'use client';

import { useState, useEffect } from 'react';
import { useReadContracts } from 'wagmi';
import { formatUnits } from 'viem';
import { TrendingUp, BarChart3, DollarSign, Activity } from 'lucide-react';
import { sbFTMarketplaceAddress, sbFTMarketplaceAbi } from "@/contractAddressAndABI"

type Props = {
  refreshTrigger: number;
};

type MarketStatsData = {
  totalVolume: bigint;
  totalTrades: bigint;
  feesCollected: bigint;
  activeOrdersCount: number;
};

export default function MarketStats({ refreshTrigger }: Props) {
  const [stats, setStats] = useState<MarketStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Read market stats from contract - including active orders
  const { data: marketData, isLoading } = useReadContracts({
    contracts: [
      {
        address: sbFTMarketplaceAddress as `0x${string}`,
        abi: sbFTMarketplaceAbi,
        functionName: 'getMarketStats',
      },
      {
        address: sbFTMarketplaceAddress as `0x${string}`,
        abi: sbFTMarketplaceAbi,
        functionName: 'getActiveBuyOrders',
      },
      {
        address: sbFTMarketplaceAddress as `0x${string}`,
        abi: sbFTMarketplaceAbi,
        functionName: 'getActiveSellOrders',
      },
    ],
    query: {
      refetchInterval: 30000, // Refresh every 30 seconds
    },
  });

  useEffect(() => {
    if (isLoading) {
      setLoading(true);
      return;
    }

    if (!marketData || !marketData[0]?.result) {
      setStats(null);
      setLoading(false);
      return;
    }

    const [totalVolume, totalTrades, feesCollected] = marketData[0].result as [bigint, bigint, bigint];
    const activeBuyOrders = marketData[1]?.result as bigint[] | undefined;
    const activeSellOrders = marketData[2]?.result as bigint[] | undefined;
    
    const activeOrdersCount = (activeBuyOrders?.length || 0) + (activeSellOrders?.length || 0);
    
    setStats({
      totalVolume,
      totalTrades,
      feesCollected,
      activeOrdersCount,
    });
    setLoading(false);
  }, [marketData, isLoading, refreshTrigger]);

  const formatVolume = (volume: bigint) => {
    const volumeNum = parseFloat(formatUnits(volume, 6));
    if (volumeNum >= 1000000) {
      return `$${(volumeNum / 1000000).toFixed(2)}M`;
    } else if (volumeNum >= 1000) {
      return `$${(volumeNum / 1000).toFixed(2)}K`;
    }
    return `$${volumeNum.toFixed(2)}`;
  };

  const formatTrades = (trades: bigint) => {
    const tradesNum = Number(trades);
    if (tradesNum >= 1000000) {
      return `${(tradesNum / 1000000).toFixed(2)}M`;
    } else if (tradesNum >= 1000) {
      return `${(tradesNum / 1000).toFixed(2)}K`;
    }
    return tradesNum.toString();
  };

  const formatFees = (fees: bigint) => {
    const feesNum = parseFloat(formatUnits(fees, 6));
    if (feesNum >= 1000000) {
      return `$${(feesNum / 1000000).toFixed(2)}M`;
    } else if (feesNum >= 1000) {
      return `$${(feesNum / 1000).toFixed(2)}K`;
    }
    return `$${feesNum.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-[#121212]/80 border border-[#3F3F46] rounded-xl p-6 animate-pulse"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#3F3F46] rounded-lg"></div>
                <div className="h-4 bg-[#3F3F46] rounded w-20"></div>
              </div>
              <div className="h-8 bg-[#3F3F46] rounded w-24 mb-2"></div>
              <div className="h-3 bg-[#3F3F46] rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statsItems = [
    {
      title: '24h Volume',
      value: stats ? formatVolume(stats.totalVolume) : '$0',
      change: '+12.5%', // You could calculate this from historical data
      changeColor: 'text-green-400',
      icon: TrendingUp,
      iconColor: 'text-purple-400 bg-purple-400/10',
    },
    {
      title: 'Total Trades',
      value: stats ? formatTrades(stats.totalTrades) : '0',
      change: '+8.2%',
      changeColor: 'text-green-400',
      icon: BarChart3,
      iconColor: 'text-blue-400 bg-blue-400/10',
    },
    {
      title: 'Fees Collected',
      value: stats ? formatFees(stats.feesCollected) : '$0',
      change: '+15.1%',
      changeColor: 'text-green-400',
      icon: DollarSign,
      iconColor: 'text-green-400 bg-green-400/10',
    },
    {
      title: 'Active Orders',
      value: stats ? stats.activeOrdersCount.toString() : '0', // Now using real data!
      change: '-2.3%', // You could calculate this from historical data
      changeColor: 'text-red-400',
      icon: Activity,
      iconColor: 'text-orange-400 bg-orange-400/10',
    },
  ];

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="bg-[#121212]/80 border border-[#3F3F46] rounded-xl p-6 hover:border-purple-500/20 transition-colors"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.iconColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-gray-400 font-medium text-sm">{item.title}</h3>
              </div>

              <div className="space-y-2">
                <div className="text-2xl font-bold text-white">
                  {item.value}
                </div>
                <div className={`text-sm font-medium ${item.changeColor} flex items-center gap-1`}>
                  {item.change}
                  <span className="text-gray-400">vs yesterday</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}