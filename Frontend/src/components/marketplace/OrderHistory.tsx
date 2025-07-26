'use client';
import { useState, useEffect } from 'react';
import { useReadContracts } from 'wagmi';
import { Abi, formatEther, formatUnits } from 'viem';
import { History, Loader2, TrendingUp, TrendingDown, CheckCircle, Clock, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { sbFTMarketplaceAddress, sbFTMarketplaceAbi } from "@/contractAddressAndABI"

// Use your imported contract details
const MARKETPLACE_ADDRESS = sbFTMarketplaceAddress;
const MARKETPLACE_ABI = sbFTMarketplaceAbi;

// Pagination constants
const ITEMS_PER_PAGE = 3; // Show 5 orders per page

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

type TradeHistoryItem = {
  id: bigint;
  type: 'buy' | 'sell';
  status: 'completed' | 'partially_filled' | 'cancelled' | 'active';
  amount: bigint;
  filled: bigint;
  price: bigint;
  totalValue: bigint;
  timestamp: bigint;
  fillPercentage: number;
};

type Props = {
  userAddress: string | undefined;
  refreshTrigger: number;
};

export default function OrderHistory({ userAddress, refreshTrigger }: Props) {
  const [historyItems, setHistoryItems] = useState<TradeHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Get user's order IDs
  const { data: userOrderIds, isLoading: orderIdsLoading, error: orderIdsError } = useReadContracts({
    contracts: [
      {
        address: MARKETPLACE_ADDRESS as `0x${string}`,
        abi: MARKETPLACE_ABI,
        functionName: 'getUserOrders',
        args: [userAddress as `0x${string}`],
      },
    ],
    query: {
      enabled: !!userAddress,
      refetchInterval: refreshTrigger > 0 ? 5000 : false,
    },
  });

  // Get order details for each order ID
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const orderIds = (userOrderIds?.[0]?.result as bigint[]) || [];
  
  const { data: ordersData, isLoading: ordersLoading, error: ordersError } = useReadContracts({
    contracts: orderIds.map(id => ({
      address: MARKETPLACE_ADDRESS as `0x${string}`,
      abi: MARKETPLACE_ABI as Abi,
      functionName: 'getOrder',
      args: [id],
    })),
    query: {
      enabled: orderIds.length > 0,
      refetchInterval: refreshTrigger > 0 ? 5000 : false,
    },
  });

  useEffect(() => {
    console.log('Order IDs:', orderIds);
    console.log('Orders Data:', ordersData);
    console.log('Orders Error:', ordersError);
    console.log('Order IDs Error:', orderIdsError);

    if (orderIdsError || ordersError) {
      console.error('Contract read errors:', { orderIdsError, ordersError });
      setLoading(false);
      return;
    }

    if (ordersData && !ordersLoading) {
      const processedHistory: TradeHistoryItem[] = ordersData
        .map((orderResult) => {
          if (orderResult.result) {
            const order = orderResult.result as Order;
            
            const fillPercentage = order.sbftAmount > 0n 
              ? Number((order.filled * 100n) / order.sbftAmount) 
              : 0;
            
            let status: 'completed' | 'partially_filled' | 'cancelled' | 'active' = 'cancelled';
            
            if (order.active) {
              if (order.filled === 0n) {
                status = 'active';
              } else if (order.filled < order.sbftAmount) {
                status = 'partially_filled';
              } else {
                status = 'completed';
              }
            } else {
              if (order.filled === order.sbftAmount) {
                status = 'completed';
              } else if (order.filled > 0n) {
                status = 'partially_filled';
              } else {
                status = 'cancelled';
              }
            }

            console.log(`Order ${order.id}: active=${order.active}, filled=${order.filled}/${order.sbftAmount}, status=${status}`);

            return {
              id: order.id,
              type: order.isBuyOrder ? 'buy' : 'sell',
              status,
              amount: order.sbftAmount,
              filled: order.filled,
              price: order.usdcPrice,
              totalValue: order.totalValue,
              timestamp: order.timestamp,
              fillPercentage,
            };
          }
          return null;
        })
        .filter((item): item is TradeHistoryItem => item !== null)
        .sort((a, b) => Number(b.timestamp) - Number(a.timestamp));

      console.log('Processed History Items:', processedHistory);
      setHistoryItems(processedHistory);
      setLoading(false);
    }
  }, [orderIds, ordersData, ordersLoading, orderIdsError, ordersError]);

  // Reset to first page when new data loads
  useEffect(() => {
    setCurrentPage(1);
  }, [historyItems.length]);

  // Pagination calculations
  const totalPages = Math.ceil(historyItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = historyItems.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'partially_filled':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'active':
        return <Clock className="w-4 h-4 text-blue-400" />;
      case 'cancelled':
        return <X className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'partially_filled':
        return 'text-yellow-400';
      case 'active':
        return 'text-blue-400';
      case 'cancelled':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'COMPLETED';
      case 'partially_filled':
        return 'PARTIAL';
      case 'active':
        return 'ACTIVE';
      case 'cancelled':
        return 'CANCELLED';
      default:
        return 'UNKNOWN';
    }
  };

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Error handling
  if (orderIdsError || ordersError) {
    return (
      <div className="text-center py-8">
        <History className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400 mb-2">Error loading trade history</p>
        <p className="text-sm text-gray-500">
          {orderIdsError?.message || ordersError?.message || 'Unknown error occurred'}
        </p>
      </div>
    );
  }

  if (!userAddress) {
    return (
      <div className="text-center py-8">
        <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-400">Connect wallet to view trade history</p>
      </div>
    );
  }

  if (loading || orderIdsLoading || ordersLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
        <span className="ml-2 text-gray-400">Loading trade history...</span>
      </div>
    );
  }

  if (historyItems.length === 0) {
    return (
      <div className="text-center py-8">
        <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-400 mb-2">No trading history found</p>
        <p className="text-sm text-gray-500">Your orders will appear here once created</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with pagination info */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <History className="w-5 h-5" />
          Trade History
        </h3>
        <div className="text-sm text-gray-400">
          {historyItems.length} total orders
          {totalPages > 1 && (
            <span className="ml-2">
              (Page {currentPage} of {totalPages})
            </span>
          )}
        </div>
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {currentItems.map((item) => (
          <div
            key={item.id.toString()}
            className="bg-[#1A1A1A] border border-[#3F3F46] rounded-lg p-4 hover:border-purple-500/30 transition"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {item.type === 'buy' ? (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
                <span className={`font-medium ${
                  item.type === 'buy' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {item.type.toUpperCase()}
                </span>
                <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                  #{item.id.toString()}
                </span>
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${getStatusColor(item.status)}`}>
                {getStatusIcon(item.status)}
                {getStatusText(item.status)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Amount</p>
                <p className="font-mono">
                  {parseFloat(formatEther(item.amount)).toFixed(4)} sbFT
                </p>
              </div>
              <div>
                <p className="text-gray-400">Price</p>
                <p className="font-mono">
                  ${parseFloat(formatUnits(item.price, 6)).toFixed(6)}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Filled</p>
                <p className="font-mono">
                  {parseFloat(formatEther(item.filled)).toFixed(4)} sbFT
                  <span className="text-gray-500 ml-1">
                    ({item.fillPercentage.toFixed(1)}%)
                  </span>
                </p>
              </div>
              <div>
                <p className="text-gray-400">Total Value</p>
                <p className="font-mono">
                  ${parseFloat(formatUnits(item.totalValue, 6)).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Progress bar for partially filled orders */}
            {item.status === 'partially_filled' || item.status === 'active' ? (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Fill Progress</span>
                  <span>{item.fillPercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      item.status === 'active' ? 'bg-blue-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${Math.min(item.fillPercentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            ) : null}

            <div className="mt-3 pt-3 border-t border-[#3F3F46]">
              <p className="text-xs text-gray-500">
                {formatTimestamp(item.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-[#3F3F46]">
          <div className="text-sm text-gray-400">
            Showing {startIndex + 1}-{Math.min(endIndex, historyItems.length)} of {historyItems.length} orders
          </div>
          
          <div className="flex items-center gap-2">
            {/* Previous button */}
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition ${
                currentPage === 1
                  ? 'text-gray-500 cursor-not-allowed'
                  : 'text-gray-300 hover:text-white hover:bg-[#3F3F46]'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1.5 rounded text-sm transition ${
                        page === currentPage
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-300 hover:text-white hover:bg-[#3F3F46]'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  (page === 2 && currentPage > 4) ||
                  (page === totalPages - 1 && currentPage < totalPages - 3)
                ) {
                  return (
                    <span key={page} className="px-2 text-gray-500">
                      ...
                    </span>
                  );
                }
                return null;
              })}
            </div>

            {/* Next button */}
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm transition ${
                currentPage === totalPages
                  ? 'text-gray-500 cursor-not-allowed'
                  : 'text-gray-300 hover:text-white hover:bg-[#3F3F46]'
              }`}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}