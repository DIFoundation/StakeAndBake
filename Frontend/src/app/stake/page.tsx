"use client";

import { useState, useEffect } from "react";
import { useAccount, useBalance, useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { stakingContractAbi, stakingContractAddress, xfiTokenAbi, xfiTokenAddress } from "@/contractAddressAndABI";
import { Loader2 } from "lucide-react";

export default function SimpleStakePage() {
  const { isConnected, address } = useAccount();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { data: balance } = useBalance({ address });
  const { data: tokenBalance } = useReadContract({
    address: xfiTokenAddress,
    functionName: "balanceOf",
    args: [address],
    query: { enabled: !!address },
  });
 



  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: xfiTokenAddress,
    abi: xfiTokenAbi,
    functionName: "allowance",
    args: [address, stakingContractAddress],
    query: { enabled: !!address },
  });

  const { writeContract: approveWrite, data: approveHash, isPending: approving } = useWriteContract();
  const { writeContract: stakeWrite, data: stakeHash, isPending: staking } = useWriteContract();

  const { isSuccess: approved } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isSuccess: staked } = useWaitForTransactionReceipt({ hash: stakeHash });

  useEffect(() => {
    if (approved) {
      setSuccess("Token approved successfully.");
      refetchAllowance();
    }
  }, [approved, refetchAllowance]);

  useEffect(() => {
    if (staked) {
      setSuccess("Staking successful.");
      setAmount("");
    }
  }, [staked]);

  const handleApprove = () => {
    setError("");
    if (!amount) return setError("Enter amount");

    try {
      const value = parseUnits(amount, 18);
      approveWrite({
        address: xfiTokenAddress,
        abi: xfiTokenAbi,
        functionName: "approve",
        args: [stakingContractAddress, value],
      });
    } catch {
      setError("Failed to approve tokens.");
    }
  };

  const handleStake = () => {
    setError("");
    if (!amount) return setError("Enter amount");

    try {
      const value = parseUnits(amount, 18);
      console.log(value, allowance);
      if (allowance && value > allowance) return setError("Insufficient allowance. Approve first.");
      stakeWrite({
        address: stakingContractAddress,
        abi: stakingContractAbi,
        functionName: "stake",
        args: [value],
      });
    } catch {
      setError("Staking failed.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900/50 text-white px-4">
      <div className="max-w-md w-full bg-gray-800 p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Stake XFI Tokens</h2>

        <p className="text-sm mb-2">
          Wallet Balance: {tokenBalance ? formatUnits(tokenBalance, 18) : "0"} XFI
          {balance && ` (${formatUnits(balance.value, 18)} XFI)`}
        </p>

        <input
          type="number"
          className="w-full mb-4 p-3 rounded bg-gray-700 text-white"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        {error && <p className="text-red-400 mb-2 text-sm">{error}</p>}
        {success && <p className="text-green-400 mb-2 text-sm">{success}</p>}

        <div className="space-y-3">
          <button
            onClick={handleApprove}
            disabled={approving}
            className="w-full py-2 bg-yellow-600 rounded hover:bg-yellow-700 disabled:opacity-50"
          >
            {approving ? <Loader2 className="animate-spin h-4 w-4 mx-auto" /> : "Approve Token"}
          </button>

          <button
            onClick={handleStake}
            disabled={staking}
            className="w-full py-2 bg-purple-600 rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {staking ? <Loader2 className="animate-spin h-4 w-4 mx-auto" /> : "Stake Token"}
          </button>
        </div>
      </div>
    </div>
  );
}
