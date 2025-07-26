// hooks/useStakeAndBakeNFT.ts
"use client";

import { useAccount, useReadContract, usePublicClient } from "wagmi";
import { useState, useEffect } from "react";
import {
  stakingContractAddress,
  stakingContractAbi,
  sbFTTokenAddress,
  xfiTokenAbi,
  sbFTMarketplaceAddress,
  sbFTMarketplaceAbi,
} from "@/contractAddressAndABI";
import { formatEther } from "viem";
import { toast } from "react-toastify";

interface NFTData {
  tokenId: string;
  name: string;
  description: string;
  image: string;
  totalRevenue: string;
  totalSbftSupply: string;
  userSbftBalance: string;
  userStakeAmount: string;
  pendingRewards: string;
  canClaim: boolean;
}

interface Transaction {
  id: string;
  type: "Buy" | "Sell";
  amount: string;
  price: string;
  totalValue: string;
  timestamp: number;
  status: "Completed";
  hash: string;
  buyer?: string;
  seller?: string;
}

export function useStakeAndBakeNFT() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Read user's sbFT balance
  const { data: sbftBalance } = useReadContract({
    address: sbFTTokenAddress,
    abi: xfiTokenAbi,
    functionName: "balanceOf",
    args: [address],
    query: {
      enabled: Boolean(address),
      refetchInterval: 5000,
    },
  });

  // Read user's staking data
  const { data: userStakeData } = useReadContract({
    address: stakingContractAddress,
    abi: stakingContractAbi,
    functionName: "stakes",
    args: [address],
    query: {
      enabled: Boolean(address),
      refetchInterval: 5000,
    },
  });

  // Read pending rewards
  const { data: pendingRewardsData } = useReadContract({
    address: stakingContractAddress,
    abi: stakingContractAbi,
    functionName: "getPendingRewards",
    args: [address],
    query: {
      enabled: Boolean(address),
      refetchInterval: 5000,
    },
  });

  // Read total fees collected
  const { data: totalFeesData } = useReadContract({
    address: stakingContractAddress,
    abi: stakingContractAbi,
    functionName: "totalFeesCollected",
    query: {
      enabled: Boolean(stakingContractAddress),
      refetchInterval: 10000,
    },
  });

  // Read sbFT total supply directly from token contract
  const { data: sbftTotalSupply } = useReadContract({
    address: sbFTTokenAddress,
    abi: xfiTokenAbi,
    functionName: "totalSupply",
    query: {
      enabled: Boolean(sbFTTokenAddress),
      refetchInterval: 10000,
    },
  });

  // Read user's orders from marketplace
  const { data: userOrderIds } = useReadContract({
    address: sbFTMarketplaceAddress,
    abi: sbFTMarketplaceAbi,
    functionName: "getUserOrders",
    args: [address],
    query: {
      enabled: Boolean(address && sbFTMarketplaceAddress),
      refetchInterval: 10000,
    },
  });

  // Utility function to safely format BigInt values
  const safeBigIntToString = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any,
    fallback: string = "0.00"
  ): string => {
    try {
      if (!value) return fallback;
      if (typeof value === "bigint") {
        const formatted = formatEther(value);
        const num = parseFloat(formatted);
        if (num < 0.01 && num > 0) return "< 0.01";
        return num.toFixed(4);
      }
      return fallback;
    } catch (error) {
      console.warn("Error formatting value:", error);
      return fallback;
    }
  };

  // Fetch user's order details to create transaction history
  useEffect(() => {
    if (
      !isConnected ||
      !userOrderIds ||
      !Array.isArray(userOrderIds) ||
      userOrderIds.length === 0
    ) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    const fetchOrderDetails = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching details for orders:", userOrderIds);

        const orderPromises = userOrderIds.map(async (orderId: bigint) => {
          try {
            // Read each order's details
            const orderData = await publicClient?.readContract({
              address: sbFTMarketplaceAddress as `0x${string}`,
              abi: sbFTMarketplaceAbi,
              functionName: "getOrder",
              args: [orderId],
            });

            if (!orderData) return null;

            console.log("Raw orderData:", orderData);
            console.log("Type of orderData:", typeof orderData);
            console.log("Is array:", Array.isArray(orderData));

            // The order data might be returned as an object or array depending on the ABI
            let id,
              // user,
              isBuyOrder,
              // sbftAmount,
              usdcPrice,
              // totalValue,
              filled,
              timestamp;
              // active;

            if (Array.isArray(orderData)) {
              // If it's an array, destructure it
              [
                id,
                // user,
                isBuyOrder,
                // sbftAmount,
                usdcPrice,
                // totalValue,
                filled,
                timestamp,
                // active,
              ] = orderData as [
                bigint,
                string,
                boolean,
                bigint,
                bigint,
                bigint,
                bigint,
                bigint,
                boolean
              ];
            } else if (typeof orderData === "object" && orderData !== null) {
              // If it's an object, access properties by name
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const order = orderData as any;
              id = order.id;
              // user = order.user;
              isBuyOrder = order.isBuyOrder;
              // sbftAmount = order.sbftAmount;
              usdcPrice = order.usdcPrice;
              // totalValue = order.totalValue;
              filled = order.filled;
              timestamp = order.timestamp;
              // active = order.active;
            } else {
              console.error("Unexpected orderData format:", orderData);
              return null;
            }

            // Only show filled/completed orders
            if (filled === 0n) return null;

            // Calculate actual price (usdcPrice is price per sbFT in USDC scaled by 1e6)
            const pricePerToken = Number(usdcPrice) / 1e6; // Convert from scaled USDC to actual USDC

            // Calculate filled amount and value
            const filledAmount = formatEther(filled);
            const filledValue = (Number(filled) / 1e18) * pricePerToken; // sbFT amount * price per token

            return {
              id: `order-${id.toString()}`,
              type: isBuyOrder ? ("Buy" as const) : ("Sell" as const),
              amount: filledAmount,
              price: pricePerToken.toFixed(6),
              totalValue: filledValue.toFixed(2),
              timestamp: Number(timestamp) * 1000, // Convert to milliseconds
              status: "Completed" as const,
              hash: `0x${id.toString(16).padStart(64, "0")}`, // Generate hash from order ID
            };
          } catch (error) {
            console.error(`Error fetching order ${orderId}:`, error);
            return null;
          }
        });

        const orderResults = await Promise.all(orderPromises);
        const validTransactions = orderResults
          .filter((tx): tx is Transaction => tx !== null)
          .sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first

        console.log("Processed transactions:", validTransactions);
        setTransactions(validTransactions);
      } catch (error) {
        console.error("Error fetching order details:", error);
        toast.error("Error fetching order details, kindly reload the page.")
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [isConnected, userOrderIds, publicClient]);

  // Format NFT data
  const nftData: NFTData = {
    tokenId: "1",
    name: "StakeAndBake Master NFT",
    description:
      "The unique Master NFT that collects protocol revenue and distributes to sbFT holders. Own a share by holding sbFT tokens.",
    image: "/stakebake.png",
    totalRevenue: safeBigIntToString(totalFeesData),
    totalSbftSupply: safeBigIntToString(sbftTotalSupply), // Use actual sbFT total supply
    userSbftBalance: safeBigIntToString(sbftBalance),
    userStakeAmount:
      userStakeData && Array.isArray(userStakeData)
        ? safeBigIntToString(userStakeData[0])
        : "0.00",
    pendingRewards: safeBigIntToString(pendingRewardsData),
    canClaim: parseFloat(safeBigIntToString(pendingRewardsData)) > 0,
  };

  return {
    nftData,
    transactions,
    isLoading,
    isConnected,
  };
}
