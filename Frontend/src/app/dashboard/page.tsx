"use client";

import {
  useAccount,
  useBalance,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useState } from "react";
import TotalStakedStats from "@/components/dashboard/TotalStakedStats";
import RewardsBreakdownChart from "@/components/dashboard/RewardsBreakdownChart";
import TransactionHistoryTable from "@/components/dashboard/TransactionHistoryTable";
import UserStakeInfo from "@/components/dashboard/UserStakeInfo";
import {
  stakingContractAddress,
  stakingContractAbi,
  xfiTokenAbi,
  xfiTokenAddress,
  sbFTTokenAddress,
} from "@/contractAddressAndABI";
import { formatEther } from "viem";
import { useTransactionHistory } from "@/hooks/useTransactionHistory";

// Utility function to format large numbers
function formatBalance(balance: string | number, decimals: number = 4): string {
  const num = typeof balance === "string" ? parseFloat(balance) : balance;
  if (isNaN(num) || num === 0) return "0.00";
  if (num < 0.01) return "< 0.01";
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
  return num.toFixed(decimals);
}

// Utility function to calculate APY earnings
function calculateEarnings(
  stakedAmount: string,
  apy: string,
  timeInYears: number = 1
): string {
  const staked = parseFloat(stakedAmount) || 0;
  const rate = parseFloat(apy) / 100 || 0;
  const earnings = staked * rate * timeInYears;
  return earnings.toFixed(4);
}

// Safe BigInt converter
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeBigIntToString(value: any, fallback: string = "0.00"): string {
  try {
    if (!value) return fallback;
    if (typeof value === "bigint") {
      return formatBalance(formatEther(value));
    }
    if (typeof value === "string" || typeof value === "number") {
      return formatBalance(value.toString());
    }
    return fallback;
  } catch (error) {
    console.warn("Error converting value:", error);
    return fallback;
  }
}

// Claim Rewards Button Component
function ClaimRewardsButton({
  pendingRewards,
  onSuccess,
}: {
  pendingRewards: string;
  onSuccess: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const { writeContract, data: hash } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const handleClaim = async () => {
    if (parseFloat(pendingRewards) <= 0) return;

    try {
      setIsLoading(true);
      await writeContract({
        address: stakingContractAddress,
        abi: stakingContractAbi,
        functionName: "claimRewards",
      });
    } catch (error) {
      console.error("Error claiming rewards:", error);
      setIsLoading(false);
    }
  };

  // Reset loading state when transaction is confirmed
  if (isConfirmed && isLoading) {
    setIsLoading(false);
    onSuccess();
  }

  const canClaim = parseFloat(pendingRewards) > 0;
  const buttonLoading = isLoading || isConfirming;

  return (
    <button
      onClick={handleClaim}
      disabled={!canClaim || buttonLoading}
      className={`px-6 py-3 rounded-lg font-medium transition-all ${
        canClaim && !buttonLoading
          ? "bg-green-600 hover:bg-green-500 text-white"
          : "bg-gray-600 text-gray-400 cursor-not-allowed"
      }`}
    >
      {buttonLoading ? (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>{isConfirming ? "Confirming..." : "Claiming..."}</span>
        </div>
      ) : (
        `Claim ${pendingRewards} XFI Rewards`
      )}
    </button>
  );
}

// Compound Rewards Button Component
function CompoundRewardsButton({
  pendingRewards,
  onSuccess,
}: {
  pendingRewards: string;
  onSuccess: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const { writeContract, data: hash } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const handleCompound = async () => {
    if (parseFloat(pendingRewards) <= 0) return;

    try {
      setIsLoading(true);
      await writeContract({
        address: stakingContractAddress,
        abi: stakingContractAbi,
        functionName: "compoundRewards",
      });
    } catch (error) {
      console.error("Error compounding rewards:", error);
      setIsLoading(false);
    }
  };

  // Reset loading state when transaction is confirmed
  if (isConfirmed && isLoading) {
    setIsLoading(false);
    onSuccess();
  }

  const canCompound = parseFloat(pendingRewards) > 0;
  const buttonLoading = isLoading || isConfirming;

  return (
    <button
      onClick={handleCompound}
      disabled={!canCompound || buttonLoading}
      className={`px-6 py-3 rounded-lg font-medium transition-all ${
        canCompound && !buttonLoading
          ? "bg-purple-600 hover:bg-purple-500 text-white"
          : "bg-gray-600 text-gray-400 cursor-not-allowed"
      }`}
    >
      {buttonLoading ? (
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>{isConfirming ? "Confirming..." : "Compounding..."}</span>
        </div>
      ) : (
        `Compound ${pendingRewards} XFI`
      )}
    </button>
  );
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({ address });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [refreshKey, setRefreshKey] = useState(0);

  const { transactions: userTransactions, isLoading: transactionsLoading } =
    useTransactionHistory();

  // Function to refresh data after successful transactions
  const handleTransactionSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Read XFI token balance
  const {
    data: xfiBalance,
    // isError: xfiBalanceError,
    // isLoading: xfiBalanceLoading,
  } = useReadContract({
    address: xfiTokenAddress,
    abi: xfiTokenAbi,
    functionName: "balanceOf",
    args: [address],
    query: {
      enabled: Boolean(address && xfiTokenAddress),
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  });

  // Read sbFT token balance from wallet
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

  // Read contract data
  const { data: totalStakedData } = useReadContract({
    address: stakingContractAddress,
    abi: stakingContractAbi,
    functionName: "totalStaked",
    query: {
      enabled: Boolean(stakingContractAddress),
      refetchInterval: 10000,
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

  // Read total fees collected from contract
  const { data: totalFeesCollectedData } = useReadContract({
    address: stakingContractAddress,
    abi: stakingContractAbi,
    functionName: "totalFeesCollected",
    query: {
      enabled: Boolean(stakingContractAddress),
      refetchInterval: 10000,
    },
  });

  // User-specific data
  const { data: userStakeData } = useReadContract({
    address: stakingContractAddress,
    abi: stakingContractAbi,
    functionName: "stakes",
    args: [address],
    query: {
      enabled: Boolean(address && stakingContractAddress),
      refetchInterval: 5000,
    },
  });

  const { data: pendingRewardsData } = useReadContract({
    address: stakingContractAddress,
    abi: stakingContractAbi,
    functionName: "getPendingRewards",
    args: [address],
    query: {
      enabled: Boolean(address && stakingContractAddress),
      refetchInterval: 5000,
    },
  });

  // Format the data safely
  const xfiBalanceFormatted = xfiBalance
    ? safeBigIntToString(xfiBalance)
    : "0.00";
  const ethBalanceFormatted = ethBalance
    ? formatBalance(ethBalance.formatted)
    : "0.00";
  const sbftWalletBalanceFormatted = sbftWalletBalance
    ? safeBigIntToString(sbftWalletBalance)
    : "0.00";

  // Extract user stake data (from the stakes mapping)
  let stakedAmount = "0.00";
  let sbftBalanceInContract = "0.00";
  let unlockTime = 0;
  let lockPeriod = 0;

  if (
    userStakeData &&
    Array.isArray(userStakeData) &&
    userStakeData.length >= 6
  ) {
    stakedAmount = safeBigIntToString(userStakeData[0]); // stakedAmount
    sbftBalanceInContract = safeBigIntToString(userStakeData[1]); // sbftBalance from contract
    unlockTime = Number(userStakeData[4]) || 0; // unlockTime
    lockPeriod = Number(userStakeData[5]) || 0; // lockPeriod
  }

  const pendingRewardsFormatted = pendingRewardsData
    ? safeBigIntToString(pendingRewardsData)
    : "0.00";

  // Calculate APY percentage (convert from basis points: 800 basis points = 8%)
  const apyPercentage = annualRewardRateData
    ? (Number(annualRewardRateData) / 100).toString()
    : "8.00";

  const totalStakedContract = totalStakedData
    ? safeBigIntToString(totalStakedData)
    : "0.00";

  // Use actual contract data instead of hardcoded value
  const totalFeesCollected = totalFeesCollectedData
    ? safeBigIntToString(totalFeesCollectedData)
    : "0.00";

  // Calculate estimated earnings
  const estimatedYearlyEarnings = calculateEarnings(
    stakedAmount,
    apyPercentage
  );
  const estimatedMonthlyEarnings = calculateEarnings(
    stakedAmount,
    apyPercentage,
    1 / 12
  );

  // Check if user can unstake (simple time check)
  const canUnstake = unlockTime > 0 ? Date.now() / 1000 >= unlockTime : false;
  const timeRemaining =
    unlockTime > 0 ? Math.max(0, unlockTime - Date.now() / 1000) : 0;

  const nextRewardDate = "Continuous";

  // Show loading state
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
          Dashboard for {address?.slice(0, 6)}...{address?.slice(-4)}
        </h1>
        <p className="text-gray-400">
          View your stake, accumulated rewards and claim your earnings
        </p>

   
      </div>

      <TotalStakedStats
        totalBals={xfiBalanceFormatted}
        totalStaked={stakedAmount}
        balance={ethBalanceFormatted}
        rewardsEarned={pendingRewardsFormatted}
        apy={apyPercentage}
        nextRewardDate={nextRewardDate}
        totalStakedContract={totalStakedContract}
        totalFeesCollected={totalFeesCollected}
        estimatedYearlyEarnings={estimatedYearlyEarnings}
        estimatedMonthlyEarnings={estimatedMonthlyEarnings}
        sbftWalletBalance={sbftWalletBalanceFormatted}
      />

      {/* Rewards Action Section - Always show if user has staked amount */}
      {parseFloat(stakedAmount) > 0 && (
        <div className="bg-[#121212]/80 border border-[#3F3F46] text-white rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Rewards Actions</h2>

          {/* Debug info for rewards */}

          <div className="flex flex-col sm:flex-row gap-4">
            <ClaimRewardsButton
              pendingRewards={pendingRewardsFormatted}
              onSuccess={handleTransactionSuccess}
            />
            <CompoundRewardsButton
              pendingRewards={pendingRewardsFormatted}
              onSuccess={handleTransactionSuccess}
            />
          </div>
          <p className="text-sm text-gray-400 mt-3">
            {parseFloat(pendingRewardsFormatted) > 0
              ? "Claim rewards to receive XFI tokens, or compound to automatically restake and extend your lock period."
              : "No rewards available yet. Rewards accumulate continuously while staking."}
          </p>
        </div>
      )}

      <UserStakeInfo
        stakedAmount={stakedAmount}
        sbftBalance={sbftWalletBalanceFormatted}
        pendingRewards={pendingRewardsFormatted}
        unlockTime={unlockTime}
        lockPeriod={lockPeriod}
        canUnstake={canUnstake}
        timeRemaining={timeRemaining}
        apy={apyPercentage}
        sbftInContract={sbftBalanceInContract}
      />

      <RewardsBreakdownChart
        stakedAmount={parseFloat(stakedAmount)}
        claimedAmount={parseFloat(pendingRewardsFormatted)}
        totalFeesCollected={parseFloat(totalFeesCollected)}
      />

      <TransactionHistoryTable
        transactions={userTransactions}
        isLoading={transactionsLoading}
      />
    </div>
  );
}
