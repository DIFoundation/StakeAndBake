'use client';

import { useState, useEffect } from 'react';
import { useReadContracts, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { Abi, formatEther, formatUnits } from 'viem';
import { Clock, X, ShoppingCart, DollarSign, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

// Import your contract details - make sure these match your actual deployed addresses
import { sbFTMarketplaceAddress, sbFTMarketplaceAbi } from "@/contractAddressAndABI";

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
  userAddress: `0x${string}` | undefined;
  refreshTrigger: number;
  onOrderCancelled: () => void;
};

export default function ActiveOrders({ userAddress, refreshTrigger, onOrderCancelled }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  const { writeContract, data: cancelHash, isPending: isCancelPending } = useWriteContract({
    mutation: {
      onSuccess: (hash) => {
        toast.success(`Cancel transaction submitted: ${hash.slice(0, 10)}...`);
      },
      onError: (error) => {
        console.error('Cancel order error:', error);
        toast.error('Failed to cancel order');
        setCancellingOrderId(null);
      }
    }
  });

  const { isLoading: isCancelConfirming, isSuccess: isCancelSuccess } = useWaitForTransactionReceipt({
    hash: cancelHash,
  });

  // Get user's order IDs
  const { data: userOrderIds, isLoading: orderIdsLoading, error: orderIdsError, refetch: refetchOrderIds } = useReadContracts({
    contracts: userAddress ? [
      {
        address: MARKETPLACE_ADDRESS as `0x${string}`,
        abi: MARKETPLACE_ABI,
        functionName: 'getUserOrders',
        args: [userAddress],
      },
    ] : [],
    query: {
      enabled: !!userAddress,
      refetchInterval: 10000,
    },
  });

  console.log('User Order IDs:', userOrderIds);
  console.log('Order IDs Loading:', orderIdsLoading);
  console.log('Order IDs Error:', orderIdsError);

  const orderIds = userOrderIds?.[0]?.result as bigint[] | undefined;

  console.log('Parsed Order IDs:', orderIds);

  // Create contracts for fetching order details
  const orderContracts = orderIds?.map((id) => ({
    address: MARKETPLACE_ADDRESS as `0x${string}`,
    abi: MARKETPLACE_ABI as Abi,
    functionName: 'getOrder',
    args: [id],
  })) || [];

  const { data: orderDetails, isLoading: orderDetailsLoading, error: orderDetailsError, refetch: refetchOrderDetails } = useReadContracts({
    contracts: orderContracts, 
    query: {
      enabled: orderContracts.length > 0,
      refetchInterval: 10000,
    },
  });

  console.log('Order Details:', orderDetails);
  console.log('Order Details Loading:', orderDetailsLoading);
  console.log('Order Details Error:', orderDetailsError);

  // Handle successful cancellation
  useEffect(() => {
    if (isCancelSuccess) {
      toast.success('Order cancelled successfully!');
      setCancellingOrderId(null);
      onOrderCancelled();
      // Refetch data after successful cancellation
      setTimeout(() => {
        refetchOrderIds();
        refetchOrderDetails();
      }, 2000);
    }
  }, [isCancelSuccess, onOrderCancelled, refetchOrderIds, refetchOrderDetails]);

  useEffect(() => {
    console.log('Effect triggered - processing orders...');
    
    if (orderDetailsLoading || orderIdsLoading) {
      console.log('Still loading...');
      setLoading(true);
      return;
    }

    // Check for errors
    if (orderIdsError || orderDetailsError) {
      console.error('Error loading orders:', { orderIdsError, orderDetailsError });
      setError('Failed to load orders');
      setLoading(false);
      return;
    }

    if (!orderIds || orderIds.length === 0) {
      console.log('No order IDs found');
      setOrders([]);
      setLoading(false);
      setError('');
      return;
    }

    if (!orderDetails) {
      console.log('No order details found');
      setOrders([]);
      setLoading(false);
      return;
    }

    const activeOrders: Order[] = [];

    console.log('Processing order details...');
    orderDetails.forEach((detail, index) => {
      console.log(`Order ${index}:`, detail);
      
      if (detail?.status === 'success') {
        const order = detail.result as Order | undefined;
        console.log(`Parsed order ${index}:`, order);
        
        if (order && order.active) {
          console.log(`Adding active order ${order.id}`);
          activeOrders.push(order);
        } else {
          console.log(`Order ${order?.id || index} is not active:`, order?.active);
        }
      } else {
        console.log(`Order detail ${index} failed:`, detail?.error);
      }
    });

    console.log('Active orders found:', activeOrders.length);

    // Sort by timestamp (newest first)
    activeOrders.sort((a, b) => Number(b.timestamp - a.timestamp));

    setOrders(activeOrders);
    setLoading(false);
    setError('');
  }, [orderDetails, orderIds, orderDetailsLoading, orderIdsLoading, refreshTrigger, orderIdsError, orderDetailsError]);

  const handleCancelOrder = async (orderId: bigint) => {
    try {
      setCancellingOrderId(orderId.toString());
      
      await writeContract({
        address: MARKETPLACE_ADDRESS as `0x${string}`,
        abi: MARKETPLACE_ABI,
        functionName: 'cancelOrder',
        args: [orderId],
      });

    } catch (error) {
      console.error('Cancel order error:', error);
      setCancellingOrderId(null);
    }
  };

  const formatPrice = (price: bigint) => {
    return parseFloat(formatUnits(price, 6)).toFixed(4);
  };

  const formatAmount = (amount: bigint) => {
    return parseFloat(formatEther(amount)).toFixed(2);
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  };

  const getProgress = (filled: bigint, total: bigint) => {
    if (total === BigInt(0)) return 0;
    return Number((filled * BigInt(100)) / total);
  };

  // Debug info in development
  if (process.env.NODE_ENV === 'development') {
    console.log('ActiveOrders Debug Info:', {
      userAddress,
      orderIds,
      orderIdsLoading,
      orderDetailsLoading,
      ordersCount: orders.length,
      error,
      loading
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
        <span className="ml-2 text-gray-400">Loading active orders...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 mb-4">{error}</div>
        <button
          onClick={() => {
            refetchOrderIds();
            refetchOrderDetails();
          }}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!userAddress) {
    return (
      <div className="text-center py-12">
        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-300 mb-2">Connect Wallet</h3>
        <p className="text-gray-400">
          Connect your wallet to view active orders
        </p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-300 mb-2">No Active Orders</h3>
        <p className="text-gray-400">
          Create your first order to start trading
        </p>
        {/* Debug info for development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 text-xs text-gray-500">
            <div>User: {userAddress?.slice(0, 10)}...</div>
            <div>Order IDs: {orderIds?.length || 0}</div>
            <div>Contract: {MARKETPLACE_ADDRESS?.slice(0, 10)}...</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-purple-400" />
        <h3 className="font-medium">Active Orders ({orders.length})</h3>
      </div>

      <div className="space-y-3">
        {orders.map((order) => {
          const remaining = order.sbftAmount - order.filled;
          const progress = getProgress(order.filled, order.sbftAmount);
          const isCancelling = cancellingOrderId === order.id.toString();

          return (
            <div
              key={order.id.toString()}
              className="bg-[#1F1F23] border border-[#3F3F46] rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {order.isBuyOrder ? (
                    <ShoppingCart className="w-4 h-4 text-green-400" />
                  ) : (
                    <DollarSign className="w-4 h-4 text-red-400" />
                  )}
                  <span className={`font-medium ${
                    order.isBuyOrder ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {order.isBuyOrder ? 'BUY' : 'SELL'}
                  </span>
                  <span className="text-gray-400 text-sm">
                    #{order.id.toString()}
                  </span>
                </div>
                
                <button
                  onClick={() => handleCancelOrder(order.id)}
                  disabled={isCancelling || isCancelPending || isCancelConfirming}
                  className="text-gray-400 hover:text-red-400 transition disabled:opacity-50"
                >
                  {isCancelling || isCancelPending || isCancelConfirming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-xs text-gray-400">Amount</div>
                  <div className="font-mono text-sm">
                    {formatAmount(remaining)} sbFT
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Price</div>
                  <div className="font-mono text-sm">
                    ${formatPrice(order.usdcPrice)}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {progress > 0 && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Filled: {progress.toFixed(1)}%</span>
                    <span>{formatAmount(order.filled)} / {formatAmount(order.sbftAmount)} sbFT</span>
                  </div>
                  <div className="w-full bg-[#3F3F46] rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        order.isBuyOrder ? 'bg-green-400' : 'bg-red-400'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center text-xs text-gray-400">
                <span>Created: {formatDate(order.timestamp)}</span>
                <span className="font-mono">
                  Total: ${parseFloat(formatUnits(order.totalValue, 6)).toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}