"use client";

import { useAccount, useBalance, useContractRead, useReadContract, useEnsAddress } from "wagmi";
import TotalStakedStats from "@/components/dashboard/TotalStakedStats";
import RewardsBreakdownChart from "@/components/dashboard/RewardsBreakdownChart";
import TransactionHistoryTable from "@/components/dashboard/TransactionHistoryTable";
import { stakingContractAddress, stakingContractAbi, xfiTokenAbi, xfiTokenAddress } from "@/contractAddressAndABI";

const stakingConfig = {
  address: stakingContractAddress,
  abi: stakingContractAbi,
};

type Transaction = {
  id: string;
  type: 'Stake' | 'Unstake' | 'Claim';
  amount: string;
  timestamp: number;
  status: 'Pending' | 'Completed' | 'Failed';
};

const mockTransactions: Transaction[] = [
  {
    id: "0x123",
    type: "Stake",
    amount: "100",
    timestamp: Date.now(),
    status: "Pending",
  },
  {
    id: "0x456",
    type: "Unstake",
    amount: "50",
    timestamp: Date.now(),
    status: "Completed",
  },
  {
    id: "0x789",
    type: "Claim",
    amount: "25",
    timestamp: Date.now(),
    status: "Failed",
  },
];

export default function DashboardPage() {
  const { address } = useAccount();
  const { data: balance } = useBalance({ address });
  const getBalance = balance?.formatted.toString() || "0";

  // Read contract data for totalStaked and rewardsEarned
  const { data: stakedAmount } = useContractRead({
    ...stakingConfig,
    functionName: "totalStaked", // Replace with actual function
    args: [address],
    enabled: Boolean(stakingContractAddress),
  });

  const { data: balanceOf } = useContractRead({
    address: xfiTokenAddress,
    abi: xfiTokenAbi,
    functionName: 'balanceOf',
    args: [address],
    query: { enabled: !!address },
    enabled: Boolean(xfiTokenAddress),
  });

  const { data: earnedRewards } = useContractRead({
    ...stakingConfig,
    functionName: "earned", // Replace with actual function
    args: [address],
    enabled: Boolean(address),
  });

  const { data: rewardRate } = useContractRead({
    ...stakingConfig,
    functionName: "getRewardRate", // Replace with actual function
    args: [address],
    enabled: Boolean(address),
  });

  const totalBals = balanceOf?.toString() || "0.00";
  const totalStaked = stakedAmount?.toString() || "0.00";
  const rewardsEarned = earnedRewards?.toString() || "0.00";
  const apy = rewardRate?.toString() || "0.00"; // You can also fetch this from the contract if available
  const nextRewardDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 mt-16">
      <div className="mb-8 text-white">
        <h1 className="text-3xl font-bold">
          Dashboard {address ? `for ${address.slice(0, 6)}...${address.slice(-4)} address` : ""}
        </h1>
        <p className="text-gray-400">
          View your stake, accumulated rewards and claim your earnings
        </p>
      </div>

      <TotalStakedStats
        totalBals={totalBals}
        totalStaked={totalStaked}
        balance={`${getBalance.slice(0, 6)}`}
        rewardsEarned={rewardsEarned}
        apy={apy}
        nextRewardDate={nextRewardDate}
      />

      <RewardsBreakdownChart />

      <TransactionHistoryTable transactions={mockTransactions} />
    </div>
  );
}
