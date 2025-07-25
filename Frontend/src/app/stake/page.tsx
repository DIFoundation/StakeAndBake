"use client";

import { useState, useEffect } from "react";
import { useAccount, useBalance, useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { stakingContractAbi, stakingContractAddress, xfiTokenAbi, xfiTokenAddress } from "@/contractAddressAndABI";
import { Loader2, Clock, Coins, Gift, TrendingUp, Lock, CheckCircle } from "lucide-react";

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
      setSuccess("Staking successful! Your sbFT tokens are ready!");
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
    <div className="relative min-h-screen text-white">
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="text-center mb-12 pt-20">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Stake XFI Token, Earn sbFTs
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Stake XFI tokens and receive fractional NFT tokens with staking rewards
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Staking Form */}
          <div className="space-y-6">
            <div className="bg-[#27272A] border border-[#3F3F46] rounded-xl p-8 hover:shadow-lg transition">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Coins className="text-purple-400" />
                Stake XFI Tokens
              </h2>

              <div className="space-y-6">
                <div className="bg-[#1A1A1A] rounded-lg p-4 border border-[#3F3F46]">
                  <p className="text-sm text-gray-400 mb-2">Your Wallet Balance</p>
                  <p className="text-xl font-bold text-white">
                    {tokenBalance ? formatUnits(tokenBalance, 18) : "0"} XFI
                  </p>
                  {balance && (
                    <p className="text-sm text-gray-500">
                      ({formatUnits(balance.value, 18)} XFI)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amount to Stake
                  </label>
                  <input
                    type="number"
                    className="w-full p-4 rounded-lg bg-[#1A1A1A] border border-[#3F3F46] text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Enter XFI amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                {error && (
                  <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3">
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                )}
                {success && (
                  <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-3">
                    <p className="text-green-300 text-sm flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      {success}
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    onClick={handleApprove}
                    disabled={approving}
                    className="w-full py-3 bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 font-semibold transition-all"
                  >
                    {approving ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin h-4 w-4" />
                        Approving...
                      </div>
                    ) : (
                      "1. Approve Tokens"
                    )}
                  </button>

                  <button
                    onClick={handleStake}
                    disabled={staking}
                    className="w-full py-3 bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 font-semibold transition-all"
                  >
                    {staking ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin h-4 w-4" />
                        Staking...
                      </div>
                    ) : (
                      "2. Stake & Get sbFT"
                    )}
                  </button>
                </div>

                <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="h-4 w-4 text-blue-400" />
                    <span className="text-sm font-medium text-blue-300">Lock Period</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Your tokens will be locked for 7 days after staking
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="space-y-6">
            {/* NFT Image with Effect */}
            <div className="bg-[#27272A] border border-[#3F3F46] rounded-xl p-8 hover:shadow-lg transition text-center">
              <div className="relative mx-auto w-40 h-40 mb-6">
                <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl animate-pulse"></div>
                <img 
                  src="stakebake.png" 
                  alt="Stake & Bake NFT"
                  className="relative w-full h-full object-cover rounded-full border-2 border-purple-400 shadow-xl"
                />
              </div>
              <h3 className="text-xl font-bold mb-2 text-purple-400">
                sbFT Tokens
              </h3>
              <p className="text-gray-400 text-sm">
                Fractional NFT tokens representing your stake
              </p>
            </div>

            {/* How It Works */}
            <div className="bg-[#27272A] border border-[#3F3F46] rounded-xl p-6 hover:shadow-lg transition">
              <h3 className="text-xl font-bold mb-6">How It Works</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-purple-600 rounded-full p-2 mt-1">
                    <Coins className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold">1. Stake XFI</h4>
                    <p className="text-gray-400 text-sm">
                      Deposit your XFI tokens. A 1% fee goes to NFT holders.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-purple-600 rounded-full p-2 mt-1">
                    <Gift className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold">2. Receive sbFT</h4>
                    <p className="text-gray-400 text-sm">
                      Get fractional NFT tokens at 1:1 ratio with your stake.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-purple-600 rounded-full p-2 mt-1">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold">3. Earn Rewards</h4>
                    <p className="text-gray-400 text-sm">
                      Earn 8% APY on your staked tokens. Claim or compound.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-purple-600 rounded-full p-2 mt-1">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold">4. Time Lock</h4>
                    <p className="text-gray-400 text-sm">
                      7-day lock period. Use sbFT for other DeFi activities.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-[#27272A] border border-[#3F3F46] rounded-xl p-6 hover:shadow-lg transition">
              <h3 className="text-lg font-bold mb-4 text-purple-400">Key Benefits</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400" />
                  <span className="text-gray-300">8% Annual Percentage Yield (APY)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400" />
                  <span className="text-gray-300">Liquid staking with sbFT tokens</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400" />
                  <span className="text-gray-300">Compound rewards automatically</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400" />
                  <span className="text-gray-300">Use sbFT in other DeFi protocols</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}