'use client';

import { useReadContracts } from 'wagmi';
import { Abi, formatEther, formatUnits } from 'viem';
import { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Loader2 } from 'lucide-react';
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

export default function OrderBook({ refreshTrigger }: Props) {
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

    // Debug logging
    console.log('Active Buy Order IDs:', activeBuyOrderIds);
    console.log('Active Sell Order IDs:', activeSellOrderIds);
    console.log('Order Details:', orderDetails);

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
          console.log('Processing buy order:', order);
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
          console.log('Processing sell order:', order);
          if (order.active) {
            sellOrdersData.push(order);
          }
        }
      });
    }

    // Sort buy orders by price (highest first - best bid on top)
    buyOrdersData.sort((a, b) => Number(b.usdcPrice - a.usdcPrice));
    
    // Sort sell orders by price (lowest first - best ask on top)
    sellOrdersData.sort((a, b) => Number(a.usdcPrice - b.usdcPrice));

    console.log('Final buy orders:', buyOrdersData);
    console.log('Final sell orders:', sellOrdersData);

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

  const formatTotal = (amount: bigint, filled: bigint, price: bigint) => {
    const remaining = amount - filled;
    const totalValue = (remaining * price) / BigInt(1e18);
    return parseFloat(formatUnits(totalValue, 6)).toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
        <span className="ml-2 text-gray-400">Loading order book...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug Info - Remove this in production */}
      
      {/* Sell Orders (Ask) */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ArrowDown className="w-4 h-4 text-red-400" />
          <h3 className="font-medium text-red-400">Sell Orders ({sellOrders.length})</h3>
        </div>
        
        <div className="space-y-1">
          <div className="grid grid-cols-3 gap-4 text-xs text-gray-400 font-medium px-3 py-2 border-b border-gray-700">
            <span>Price (USDC)</span>
            <span>Amount (sbFT)</span>
            <span>Total (USDC)</span>
          </div>
          
          <div className="max-h-48 overflow-y-auto space-y-1">
            {sellOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No sell orders available
              </div>
            ) : (
              sellOrders.slice(0, 10).map((order) => (
                <div
                  key={order.id.toString()}
                  className="grid grid-cols-3 gap-4 text-sm px-3 py-2 hover:bg-red-500/10 rounded transition"
                >
                  <span className="text-red-400 font-mono">
                    ${formatPrice(order.usdcPrice)}
                  </span>
                  <span className="font-mono">
                    {formatAmount(order.sbftAmount, order.filled)}
                  </span>
                  <span className="font-mono text-gray-300">
                    ${formatTotal(order.sbftAmount, order.filled, order.usdcPrice)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Price Spread */}
      <div className="border-t border-[#3F3F46] py-3">
        <div className="text-center text-gray-400 text-sm">
          {buyOrders.length > 0 && sellOrders.length > 0 ? (
            <>
              Spread: $
              {(
                parseFloat(formatPrice(sellOrders[0].usdcPrice)) -
                parseFloat(formatPrice(buyOrders[0].usdcPrice))
              ).toFixed(4)}
            </>
          ) : (
            'No spread available'
          )}
        </div>
      </div>

      {/* Buy Orders (Bid) */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ArrowUp className="w-4 h-4 text-green-400" />
          <h3 className="font-medium text-green-400">Buy Orders ({buyOrders.length})</h3>
        </div>
        
        <div className="space-y-1">
          <div className="grid grid-cols-3 gap-4 text-xs text-gray-400 font-medium px-3 py-2 border-b border-gray-700">
            <span>Price (USDC)</span>
            <span>Amount (sbFT)</span>
            <span>Total (USDC)</span>
          </div>
          
          <div className="max-h-48 overflow-y-auto space-y-1">
            {buyOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No buy orders available
              </div>
            ) : (
              buyOrders.slice(0, 10).map((order) => (
                <div
                  key={order.id.toString()}
                  className="grid grid-cols-3 gap-4 text-sm px-3 py-2 hover:bg-green-500/10 rounded transition"
                >
                  <span className="text-green-400 font-mono">
                    ${formatPrice(order.usdcPrice)}
                  </span>
                  <span className="font-mono">
                    {formatAmount(order.sbftAmount, order.filled)}
                  </span>
                  <span className="font-mono text-gray-300">
                    ${formatTotal(order.sbftAmount, order.filled, order.usdcPrice)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}