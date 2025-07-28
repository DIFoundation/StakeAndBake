'use client';

import { useReadContracts } from 'wagmi';
import { Abi, formatEther, formatUnits } from 'viem';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { sbFTMarketplaceAddress, sbFTMarketplaceAbi } from "@/contractAddressAndABI"

// Use the imported addresses and ABI
const MARKETPLACE_ADDRESS = sbFTMarketplaceAddress;
const MARKETPLACE_ABI = sbFTMarketplaceAbi;

type Order = {
  id: bigint;
  user: string;
  isBuyOrder: boolean;
  sbftAmount: bigint;
  usdcPrice: bigint;
  totalValue: bigint;
  filled: bigint;
  timestamp: bigint;
  active: boolean;
};

type Props = {
  refreshTrigger: number;
};

export default function CEXOrderBook({ refreshTrigger }: Props) {
  const [buyOrders, setBuyOrders] = useState<Order[]>([]);
  const [sellOrders, setSellOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Get active order IDs
  const { data: orderIds, isLoading: orderIdsLoading, refetch: refetchOrderIds } = useReadContracts({
    contracts: [
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
      refetchInterval: 3000, // Refetch every 3 seconds
    },
  });

  const activeBuyOrderIds = orderIds?.[0]?.result as bigint[] | undefined;
  const activeSellOrderIds = orderIds?.[1]?.result as bigint[] | undefined;

  // Create contracts for fetching order details
  const orderContracts = [
    ...(activeBuyOrderIds?.map((id) => ({
      address: MARKETPLACE_ADDRESS as `0x${string}`,
      abi: MARKETPLACE_ABI as Abi,
      functionName: 'getOrder',
      args: [id],
    })) || []),
    ...(activeSellOrderIds?.map((id) => ({
      address: MARKETPLACE_ADDRESS as `0x${string}`,
      abi: MARKETPLACE_ABI as Abi,
      functionName: 'getOrder',
      args: [id],
    })) || []),
  ];

  const { data: orderDetails, isLoading: orderDetailsLoading, refetch: refetchOrderDetails } = useReadContracts({
    contracts: orderContracts, 
    query: {
      enabled: orderContracts.length > 0,
      refetchInterval: 3000, // Refetch every 3 seconds
    },
  });

  // Refetch when refreshTrigger changes
  useEffect(() => {
    refetchOrderIds();
    refetchOrderDetails();
  }, [refreshTrigger, refetchOrderIds, refetchOrderDetails]);

  useEffect(() => {
    if (orderIdsLoading || orderDetailsLoading) {
      setLoading(true);
      return;
    }

    setLoading(false);

    // Reset arrays
    const buyOrdersData: Order[] = [];
    const sellOrdersData: Order[] = [];

    if (!orderDetails) {
      setBuyOrders([]);
      setSellOrders([]);
      return;
    }

    // Process buy orders
    if (activeBuyOrderIds && activeBuyOrderIds.length > 0) {
      activeBuyOrderIds.forEach((_, index) => {
        const orderResult = orderDetails[index];
        if (orderResult && orderResult.result) {
          const order = orderResult.result as Order;
          if (order.active) {
            buyOrdersData.push(order);
          }
        }
      });
    }

    // Process sell orders
    if (activeSellOrderIds && activeSellOrderIds.length > 0) {
      const buyOrdersCount = activeBuyOrderIds?.length || 0;
      activeSellOrderIds.forEach((_, index) => {
        const orderResult = orderDetails[buyOrdersCount + index];
        if (orderResult && orderResult.result) {
          const order = orderResult.result as Order;
          if (order.active) {
            sellOrdersData.push(order);
          }
        }
      });
    }

    // Sort buy orders by price (highest first - best bid on top)
    buyOrdersData.sort((a, b) => Number(b.usdcPrice - a.usdcPrice));
    
    // Sort sell orders by price (lowest first - best ask on top)
    // For CEX style, we want highest sell price on top (furthest from spread)
    sellOrdersData.sort((a, b) => Number(b.usdcPrice - a.usdcPrice));

    setBuyOrders(buyOrdersData);
    setSellOrders(sellOrdersData);
  }, [orderDetails, activeBuyOrderIds, activeSellOrderIds, orderDetailsLoading, orderIdsLoading]);

  const formatPrice = (price: bigint) => {
    return parseFloat(formatUnits(price, 6)).toFixed(4);
  };

  const formatAmount = (amount: bigint, filled: bigint) => {
    const remaining = amount - filled;
    return parseFloat(formatEther(remaining)).toFixed(3);
  };

  // Calculate depth percentage for visual bars
  const calculateDepthPercentage = (orders: Order[], index: number) => {
    if (orders.length === 0) return 0;
    const maxAmount = Math.max(...orders.map(order => 
      parseFloat(formatAmount(order.sbftAmount, order.filled))
    ));
    const currentAmount = parseFloat(formatAmount(orders[index].sbftAmount, orders[index].filled));
    return (currentAmount / maxAmount) * 100;
  };

  // Get best bid and ask
  const bestBid = buyOrders.length > 0 ? buyOrders[0] : null;
  const bestAsk = sellOrders.length > 0 ? sellOrders[sellOrders.length - 1] : null; // Lowest sell price

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
        <span className="ml-2 text-gray-400 text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="grid grid-cols-3 gap-2 text-[10px] text-gray-400 font-medium px-2 py-1 border-b border-[#2A2A2A]">
        <span className="text-left">Price (USDC)</span>
        <span className="text-center">Size (sbFT)</span>
        <span className="text-right">Total</span>
      </div>

      {/* Sell Orders (Asks) - Top section */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto scrollbar-hide">
          {sellOrders.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-gray-500 text-xs">
              No asks
            </div>
          ) : (
            <div className="space-y-0">
              {sellOrders.slice(0, 8).map((order, index) => (
                <div
                  key={order.id.toString()}
                  className="relative group hover:bg-red-500/5 transition-colors"
                >
                  {/* Depth bar */}
                  <div
                    className="absolute left-0 top-0 h-full bg-red-500/10 transition-all duration-300"
                    style={{ width: `${calculateDepthPercentage(sellOrders, index)}%` }}
                  />
                  
                  <div className="relative grid grid-cols-3 gap-2 text-xs px-2 py-1">
                    <span className="text-red-400 font-mono text-left">
                      {formatPrice(order.usdcPrice)}
                    </span>
                    <span className="font-mono text-center text-gray-300">
                      {formatAmount(order.sbftAmount, order.filled)}
                    </span>
                    <span className="font-mono text-right text-gray-400 text-[10px]">
                      {parseFloat(formatAmount(order.sbftAmount, order.filled)) * parseFloat(formatPrice(order.usdcPrice))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Spread Section */}
      <div className="py-2 px-2 bg-[#1A1A1A] border-y border-[#2A2A2A]">
        {bestAsk && bestBid ? (
          <div className="text-center">
            <div className="text-lg font-mono font-bold text-white">
              ${formatPrice(bestAsk.usdcPrice)}
            </div>
            <div className="text-[10px] text-gray-400">
              ↑ ${(parseFloat(formatPrice(bestAsk.usdcPrice)) - parseFloat(formatPrice(bestBid.usdcPrice))).toFixed(4)}
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 text-xs">
            No spread
          </div>
        )}
      </div>

      {/* Buy Orders (Bids) - Bottom section */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto scrollbar-hide">
          {buyOrders.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-gray-500 text-xs">
              No bids
            </div>
          ) : (
            <div className="space-y-0">
              {buyOrders.slice(0, 8).map((order, index) => (
                <div
                  key={order.id.toString()}
                  className="relative group hover:bg-green-500/5 transition-colors"
                >
                  {/* Depth bar */}
                  <div
                    className="absolute left-0 top-0 h-full bg-green-500/10 transition-all duration-300"
                    style={{ width: `${calculateDepthPercentage(buyOrders, index)}%` }}
                  />
                  
                  <div className="relative grid grid-cols-3 gap-2 text-xs px-2 py-1">
                    <span className="text-green-400 font-mono text-left">
                      {formatPrice(order.usdcPrice)}
                    </span>
                    <span className="font-mono text-center text-gray-300">
                      {formatAmount(order.sbftAmount, order.filled)}
                    </span>
                    <span className="font-mono text-right text-gray-400 text-[10px]">
                      {parseFloat(formatAmount(order.sbftAmount, order.filled)) * parseFloat(formatPrice(order.usdcPrice))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .scrollbar-hide {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}