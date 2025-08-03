"use client";

import {
  useAccount,
  useBalance,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useState, useEffect } from "react";
import TotalStakedStats from "@/components/dashboard/TotalStakedStats";
import RewardsBreakdownChart from "@/components/dashboard/RewardsBreakdownChart";
import TransactionHistoryTable from "@/components/dashboard/TransactionHistoryTable";
import DebugUnstaking from "@/components/DebugUnstaking";
import {
  stakingContractAddress,
  stakingContractAbi,
  xfiTokenAbi,
  xfiTokenAddress,
  sbFTTokenAddress,
} from "@/contractAddressAndABI";
import { Abi, formatEther } from "viem";
import { useTransactionHistory } from "@/hooks/useTransactionHistory";
import { Clock, ArrowRight, X, Loader2, AlertCircle, CheckCircle } from "lucide-react";

function formatBalance(balance: number | string, decimals = 4) {
  const num = typeof balance === "string" ? parseFloat(balance) : Number(balance);
  if (isNaN(num) || num === 0) return "0.00";
  if (num < 0.01) return "< 0.01";
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
  return num.toFixed(decimals);
}

function safeBigIntToString(value: string | number | bigint, fallback = "0.00") {
  try {
    if (!value) return fallback;
    if (typeof value === "bigint") {
      return formatBalance(formatEther(value));
    }
    if (typeof value === "string" || typeof value === "number") {
      return formatBalance(value.toString());
    }
    return fallback;
  } catch {
    return fallback;
  }
}

interface UnstakeRequestCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requestData: any;
  requestId: string | number | bigint;
}

function UnstakeRequestCard({ requestData, requestId }: UnstakeRequestCardProps) {
  const { address } = useAccount();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // DEBUG: Log the request data
  console.log("🎫 UnstakeRequestCard Debug:", { requestData, requestId });

  const { data: canProcessData } = useReadContract({
    address: stakingContractAddress,
    abi: stakingContractAbi,
    functionName: "canProcessUnstake",
    args: [requestId],
    query: {
      enabled: !!requestData && !requestData.processed,
      refetchInterval: 10000,
    },
  });

  const { writeContract: processUnstakeContract, data: hashProcess } = useWriteContract();
  const { writeContract: cancelUnstakeContract, data: hashCancel } = useWriteContract();

  const {
    // isLoading: isProcessingTx,
    isSuccess: isSuccessProcess,
    // error: errorProcess,
  } = useWaitForTransactionReceipt({
    hash: hashProcess,
  });

  const {
    // isLoading: isCancellingTx,
    isSuccess: isSuccessCancel,
    // error: errorCancel,
  } = useWaitForTransactionReceipt({
    hash: hashCancel,
  });

  useEffect(() => {
    if (isSuccessProcess || isSuccessCancel) {
      setIsProcessing(false);
      setIsCancelling(false);
      setIsModalOpen(false);
    }
  }, [isSuccessProcess, isSuccessCancel]);

  const handleProcess = () => {
    if (!address) return;
    setIsProcessing(true);
    processUnstakeContract({
      address: stakingContractAddress,
      abi: stakingContractAbi,
      functionName: "processUnstake",
      args: [requestId],
    });
  };

  const handleCancel = () => {
    if (!address) return;
    setIsCancelling(true);
    cancelUnstakeContract({
      address: stakingContractAddress,
      abi: stakingContractAbi,
      functionName: "cancelUnstakeRequest",
      args: [requestId],
    });
  };

  // FIXED: Better handling of unlock time
  const unlockTime = requestData.unlockTime;
  let unlockDate;
  
  try {
    // Handle both BigInt and number types
    const timeValue = typeof unlockTime === 'bigint' ? Number(unlockTime) : Number(unlockTime);
    unlockDate = new Date(timeValue * 1000);
    
    // Validate the date
    if (isNaN(unlockDate.getTime())) {
      throw new Error("Invalid date");
    }
  } catch (error) {
    console.error("Error parsing unlock time:", error, unlockTime);
    unlockDate = new Date(); // Fallback to current date
  }

  const formatTime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
  };

  const canProcessNow = canProcessData && Array.isArray(canProcessData) ? canProcessData[0] : false;
  const timeRemaining = canProcessData && Array.isArray(canProcessData) ? Number(canProcessData[1]) : 0;

  // FIXED: Better handling of XFI amount
  const xfiAmount = requestData.xfiAmount;
  let formattedAmount;
  
  try {
    formattedAmount = safeBigIntToString(xfiAmount);
  } catch (error) {
    console.error("Error formatting XFI amount:", error, xfiAmount);
    formattedAmount = "0.00";
  }

  return (
    <div className="bg-[#1A1A1A] rounded-lg p-4 border border-[#3F3F46] flex flex-col sm:flex-row justify-between items-start sm:items-center">
      <div>
        <p className="text-sm text-gray-400">Request ID: {requestId.toString()}</p>
        <p className="text-xl font-bold text-white">
          {formattedAmount} XFI
        </p>
        <p className="text-sm text-gray-400">
          Unlocks: {unlockDate.toLocaleString()}
        </p>
        {/* DEBUG INFO */}
        <p className="text-xs text-gray-500 mt-1">
          Debug: unlockTime={unlockTime?.toString()}, amount={xfiAmount?.toString()}
        </p>
      </div>

      <div className="mt-4 sm:mt-0 flex flex-col items-start sm:items-end">
        {canProcessNow ? (
          <>
            <div className="flex items-center text-green-400 font-medium">
              <CheckCircle className="h-5 w-5 mr-2" />
              Ready to Claim
            </div>
            <button
              onClick={handleProcess}
              className="mt-2 w-full sm:w-auto px-6 py-2 rounded-lg bg-green-500 text-white font-bold hover:bg-green-600 transition-colors duration-200 disabled:opacity-50"
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="animate-spin" /> : "Claim XFI"}
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center text-yellow-400 font-medium">
              <Clock className="h-5 w-5 mr-2" />
              Time Remaining
            </div>
            <p className="mt-1 text-sm text-yellow-400">
              {formatTime(timeRemaining)}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-2 w-full sm:w-auto px-6 py-2 rounded-lg bg-gray-500 text-white font-bold hover:bg-gray-600 transition-colors duration-200"
              disabled={isCancelling}
            >
              Cancel
            </button>
          </>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1A1A1A] rounded-lg p-6 w-full max-w-md border border-[#3F3F46]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">Confirm Cancellation</h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="h-6 w-6 text-gray-400 hover:text-white" />
              </button>
            </div>
            <p className="text-gray-300 mb-4">
              Are you sure you want to cancel this unstake request? Your sbFT tokens will be minted back to your wallet.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg text-white font-medium hover:bg-gray-700"
                disabled={isCancelling}
              >
                Go Back
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg bg-red-500 text-white font-bold hover:bg-red-600 disabled:opacity-50"
                disabled={isCancelling}
              >
                {isCancelling ? <Loader2 className="animate-spin" /> : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface UnstakeRequestListProps {
  requestIds: (string | number | bigint)[];
}

function UnstakeRequestList({ requestIds }: UnstakeRequestListProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contractsToRead = requestIds?.map((id: any) => ({
    address: stakingContractAddress as `0x${string}`,
    abi: stakingContractAbi as Abi,
    functionName: 'unstakeRequests',
    args: [id],
  })) ?? [];

  const { data: requestDetails, isLoading, error } = useReadContracts({
    contracts: contractsToRead,
    query: { enabled: contractsToRead.length > 0 },
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Loading requests...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-red-400">
        <AlertCircle className="h-6 w-6 mr-2" />
        Error fetching details: {error.message}
      </div>
    );
  }

  // DEBUG: Log the raw data
  console.log("🔍 UnstakeRequestList Debug:");
  console.log("requestIds:", requestIds);
  console.log("requestDetails:", requestDetails);

  // FIXED: Better filtering and mapping logic
  const processedRequests = requestDetails
    ?.map((result, index) => {
      console.log(`Processing result ${index}:`, result);
      
      // Check if the result is successful and has data
      if (result.status === "success" && result.result) {
        const [user, xfiAmount, unlockTime, processed] = result.result as [string, bigint, bigint, boolean];
        
        console.log(`Request ${index} details:`, {
          user,
          xfiAmount: xfiAmount?.toString(),
          unlockTime: unlockTime?.toString(),
          processed
        });
        
        // Only include unprocessed requests
        if (!processed) {
          return {
            id: requestIds[index],
            user,
            xfiAmount,
            unlockTime,
            processed
          };
        }
      }
      return null;
    })
    .filter(request => request !== null) || [];

  console.log("Processed requests:", processedRequests);

  if (processedRequests.length === 0) {
    return (
      <div className="text-center p-8 text-gray-400">
        <p>No active unstake requests found.</p>
        <p className="text-sm mt-2">
          Raw data: {requestIds?.length || 0} request IDs, {requestDetails?.length || 0} results
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {processedRequests.map((request) => (
        <UnstakeRequestCard 
          key={request.id.toString()} 
          requestId={request.id} 
          requestData={request} 
        />
      ))}
    </div>
  );
}

function UnstakingQueue() {
  const { address, isConnected } = useAccount();

  const { data: requestIds, isLoading, error } = useReadContract({
    address: stakingContractAddress,
    abi: stakingContractAbi,
    functionName: "getUserUnstakeRequests",
    args: [address],
    query: {
      enabled: isConnected && !!address,
      select: (data) => (Array.isArray(data) ? data : []),
      refetchInterval: 30000,
    },
  });

  if (!isConnected) {
    return null;
  }

  return (
    <div className="bg-[#121212]/80 border border-[#3F3F46] text-white rounded-xl p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Your Unstake Queue</h2>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center p-8 text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading requests...
        </div>
      ) : error ? (
        <div className="flex items-center justify-center p-8 text-red-400">
          <AlertCircle className="h-6 w-6 mr-2" />
          Error fetching requests: {error.message}
        </div>
      ) : (
        <UnstakeRequestList requestIds={requestIds as (string | number | bigint)[]} />
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({ address });
  // const [refreshKey, setRefreshKey] = useState(0);

  const { transactions: userTransactions, isLoading: transactionsLoading, error: transactionsError } =
    useTransactionHistory();

  const { data: xfiBalance } = useReadContract({
    address: xfiTokenAddress,
    abi: xfiTokenAbi,
    functionName: "balanceOf",
    args: [address],
    query: {
      enabled: Boolean(address && xfiTokenAddress),
      refetchInterval: 5000,
    },
  });

  const { data: sbftWalletBalance } = useReadContract({
    address: sbFTTokenAddress,
    abi: xfiTokenAbi,
    functionName: "balanceOf",
    args: [address],
    query: {
      enabled: Boolean(address),
      refetchInterval: 5000,
    },
  });

  const { data: totalXFIInPool } = useReadContract({
    address: stakingContractAddress,
    abi: stakingContractAbi,
    functionName: "totalXFIInPool",
    query: {
      enabled: Boolean(stakingContractAddress),
      refetchInterval: 10000,
    },
  });

  const { data: totalPendingUnstakes } = useReadContract({
    address: stakingContractAddress,
    abi: stakingContractAbi,
    functionName: "totalPendingUnstakes",
    query: {
      enabled: Boolean(stakingContractAddress),
      refetchInterval: 10000,
    },
  });

  const { data: exchangeRate } = useReadContract({
    address: stakingContractAddress,
    abi: stakingContractAbi,
    functionName: "getExchangeRate",
    query: {
      enabled: Boolean(stakingContractAddress),
      refetchInterval: 5000,
    },
  });

  const { data: annualRewardRateData } = useReadContract({
    address: stakingContractAddress,
    abi: stakingContractAbi,
    functionName: "annualRewardRate",
    query: {
      enabled: Boolean(stakingContractAddress),
    },
  });

  const { data: totalFeesCollectedData } = useReadContract({
    address: stakingContractAddress,
    abi: stakingContractAbi,
    functionName: "totalFeesCollected",
    query: {
      enabled: Boolean(stakingContractAddress),
      refetchInterval: 10000,
    },
  });

  const xfiBalanceFormatted = xfiBalance && (typeof xfiBalance === "string" || typeof xfiBalance === "number" || typeof xfiBalance === "bigint") ? safeBigIntToString(xfiBalance) : "0.00";
  const ethBalanceFormatted = ethBalance ? formatBalance(ethBalance.formatted) : "0.00";
  const sbftWalletBalanceFormatted = sbftWalletBalance && (typeof sbftWalletBalance === "string" || typeof sbftWalletBalance === "number" || typeof sbftWalletBalance === "bigint") ? safeBigIntToString(sbftWalletBalance) : "0.00";
  
  const totalPoolXFI = totalXFIInPool && (typeof totalXFIInPool === "string" || typeof totalXFIInPool === "number" || typeof totalXFIInPool === "bigint") ? safeBigIntToString(totalXFIInPool) : "0.00";
  const pendingUnstakes = totalPendingUnstakes && (typeof totalPendingUnstakes === "string" || typeof totalPendingUnstakes === "number" || typeof totalPendingUnstakes === "bigint") ? safeBigIntToString(totalPendingUnstakes) : "0.00";
  const currentExchangeRate = exchangeRate && (typeof exchangeRate === "string" || typeof exchangeRate === "number" || typeof exchangeRate === "bigint") ? safeBigIntToString(exchangeRate) : "1.00";
  
  const userXFIValue = sbftWalletBalance && exchangeRate && 
    (typeof sbftWalletBalance === 'string' || typeof sbftWalletBalance === 'number' || typeof sbftWalletBalance === 'bigint') &&
    (typeof exchangeRate === 'string' || typeof exchangeRate === 'number' || typeof exchangeRate === 'bigint')
    ? safeBigIntToString((BigInt(sbftWalletBalance) * BigInt(exchangeRate)) / BigInt(1e18))
    : "0.00";

  const apyPercentage = annualRewardRateData && (typeof annualRewardRateData === "string" || typeof annualRewardRateData === "number" || typeof annualRewardRateData === "bigint")
    ? (Number(annualRewardRateData) / 100)
    : "8.00";

  const totalFeesCollected = totalFeesCollectedData && (typeof totalFeesCollectedData === "string" || typeof totalFeesCollectedData === "number" || typeof totalFeesCollectedData === "bigint") ? safeBigIntToString(totalFeesCollectedData) : "0.00";


  const calculateEarnings = ( baseAmount: string | number, apy: string | number, timeInYears = 1) => {
    const amount = (typeof baseAmount === 'string' ? parseFloat(baseAmount) : baseAmount) || 0;
    const rate = ((typeof apy === 'string' ? parseFloat(apy) : apy) / 100) || 0;
    const earnings = amount * rate * timeInYears;
    return earnings.toFixed(4);
  };

  const estimatedYearlyEarnings = calculateEarnings(userXFIValue, apyPercentage);
  const estimatedMonthlyEarnings = calculateEarnings(userXFIValue, apyPercentage, 1/12);

  const nextRewardDate = "Continuous (Auto-compounding)";

  if (!isConnected) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4 mt-16">
        <div className="text-center text-white">
          <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
          <p className="text-gray-400">
            Please connect your wallet to view your dashboard
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 mt-16">
      <div className="mb-8 text-white">
        <h1 className="text-3xl font-bold">
          Liquid Staking Dashboard for {address?.slice(0, 6)}...{address?.slice(-4)}
        </h1>
        <p className="text-gray-400">
          Monitor your sbFT tokens, pool performance, and manage unstaking requests
        </p>
      </div>

      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-xl p-4 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Current Exchange Rate</p>
            <p className="text-2xl font-bold text-purple-400">
              1 sbFT = {currentExchangeRate} XFI
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Your sbFT Value</p>
            <p className="text-xl font-bold text-green-400">
              {sbftWalletBalanceFormatted} sbFT ≈ {userXFIValue} XFI
            </p>
          </div>
          <ArrowRight className="h-8 w-8 text-purple-400" />
        </div>
      </div>

      <DebugUnstaking />
      
      <UnstakingQueue />

      <TotalStakedStats
        totalBals={xfiBalanceFormatted}
        totalStaked={userXFIValue}
        balance={ethBalanceFormatted}
        rewardsEarned="0.00"
        apy={apyPercentage.toString()}
        nextRewardDate={nextRewardDate}
        totalStakedContract={totalPoolXFI}
        totalFeesCollected={totalFeesCollected}
        estimatedYearlyEarnings={estimatedYearlyEarnings}
        estimatedMonthlyEarnings={estimatedMonthlyEarnings}
        sbftWalletBalance={sbftWalletBalanceFormatted}
      />

      <div className="bg-[#121212]/80 border border-[#3F3F46] text-white rounded-xl p-6 mb-8">
        <h2 className="text-xl font-bold mb-6">Global Pool Statistics</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-[#1A1A1A] rounded-lg p-4 border border-[#3F3F46]">
            <p className="text-gray-400 text-sm mb-2">Total XFI in Pool</p>
            <p className="text-2xl font-bold text-blue-400">{totalPoolXFI} XFI</p>
            <p className="text-xs text-gray-500">Backing all sbFT tokens</p>
          </div>
          <div className="bg-[#1A1A1A] rounded-lg p-4 border border-[#3F3F46]">
            <p className="text-gray-400 text-sm mb-2">Pending Unstakes</p>
            <p className="text-2xl font-bold text-yellow-400">{pendingUnstakes} XFI</p>
            <p className="text-xs text-gray-500">Reserved for unstaking queue</p>
          </div>
          <div className="bg-[#1A1A1A] rounded-lg p-4 border border-[#3F3F46]">
            <p className="text-gray-400 text-sm mb-2">Available Liquidity</p>
            <p className="text-2xl font-bold text-green-400">
              {(parseFloat(totalPoolXFI) - parseFloat(pendingUnstakes)).toFixed(4)} XFI
            </p>
            <p className="text-xs text-gray-500">Available for new unstakes</p>
          </div>
        </div>
      </div>

      <RewardsBreakdownChart
        stakedAmount={parseFloat(userXFIValue)}
        claimedAmount={0}
        totalFeesCollected={parseFloat(totalFeesCollected)}
      />

      <TransactionHistoryTable
        transactions={userTransactions}
        isLoading={transactionsLoading}
        error={transactionsError}
        onRefresh={() => window.location.reload()}
      />
    </div>
  );
}