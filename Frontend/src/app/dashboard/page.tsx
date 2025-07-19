"use client";

import { useAccount, useBalance } from "wagmi";
import TotalStakedStats from "@/components/dashboard/TotalStakedStats";
import RewardsBreakdownChart from "@/components/dashboard/RewardsBreakdownChart";
import TransactionHistoryTable from "@/components/dashboard/TransactionHistoryTable";

type Transaction = {
  id: string;
  type: 'Stake' | 'Unstake' | 'Claim';
  amount: string;
  timestamp: number;
  status: 'Pending' | 'Completed' | 'Failed';
};

const mockTransactions: Transaction[]  = [
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
  const { data: balance } = useBalance({ address: address });
  const getBalance = balance?.formatted.toString() || "0";

  const totalStaked = "150.75";
  const rewardsEarned = "7.50";
  const apy = "12.5";
  const nextRewardDate = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  ).toLocaleDateString();

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 mt-16">
      <div className="mb-8 text-white">
        <h1 className="text-3xl font-bold ">
          Dashboard{" "}
          {address
            ? `for ${address.slice(0, 6)}...${address.slice(-4)} address`
            : (" ")}
        </h1>
        <p className="text-gray-400 ">
          View your stake, accumulated rewards and claim your earnings
        </p>
      </div>

      <TotalStakedStats
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
