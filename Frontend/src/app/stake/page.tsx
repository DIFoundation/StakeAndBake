"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Image from "next/image";
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { stakingContractAbi, stakingContractAddress, xfiTokenAbi, xfiTokenAddress, sbFTTokenAddress } from "@/contractAddressAndABI";
import { Loader2, Clock, Coins, Gift, TrendingUp, CheckCircle, ArrowUpDown, Zap } from "lucide-react";

export default function SimpleStakePage() {
  const { address } = useAccount();
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // const { data: balance } = useBalance({ address });
  const { data: tokenBalance } = useReadContract({
    address: xfiTokenAddress,
    functionName: "balanceOf",
    args: [address],
    query: { enabled: !!address },
  });

  const { data: sbftBalance } = useReadContract({
    address: sbFTTokenAddress,
    abi: xfiTokenAbi,
    functionName: "balanceOf",
    args: [address],
    query: { enabled: !!address },
  });

  // Get exchange rate from new contract
  const { data: exchangeRate, refetch: refetchExchangeRate } = useReadContract({
    address: stakingContractAddress,
    abi: stakingContractAbi,
    functionName: "getExchangeRate",
    query: { enabled: !!stakingContractAddress },
  });

  // Get pool statistics
  const { data: totalXFIInPool } = useReadContract({
    address: stakingContractAddress,
    abi: stakingContractAbi,
    functionName: "totalXFIInPool",
    query: { enabled: !!stakingContractAddress },
  });

  const { data: totalPendingUnstakes } = useReadContract({
    address: stakingContractAddress,
    abi: stakingContractAbi,
    functionName: "totalPendingUnstakes",
    query: { enabled: !!stakingContractAddress },
  });

  const { data: unstakingDelay } = useReadContract({
    address: stakingContractAddress,
    abi: stakingContractAbi,
    functionName: "unstakingDelay",
    query: { enabled: !!stakingContractAddress },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: xfiTokenAddress,
    abi: xfiTokenAbi,
    functionName: "allowance",
    args: [address, stakingContractAddress],
    query: { enabled: !!address },
  });

  const balanceOf: bigint = (tokenBalance as bigint) ?? 0n;
  const sbftBalanceOf: bigint = (sbftBalance as bigint) ?? 0n;
  const allowanceData: bigint = (allowance as bigint) ?? 0n;
  const exchangeRateData: bigint = (exchangeRate as bigint) ?? 1000000000000000000n; // 1e18
  const totalPoolXFI: bigint = (totalXFIInPool as bigint) ?? 0n;
  const pendingUnstakes: bigint = (totalPendingUnstakes as bigint) ?? 0n;
  const delaySeconds: bigint = (unstakingDelay as bigint) ?? 604800n; // 7 days

  const { writeContract: approveWrite, data: approveHash, isPending: approving } = useWriteContract();
  const { writeContract: stakeWrite, data: stakeHash, isPending: staking } = useWriteContract();

  const { isSuccess: approved } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isSuccess: staked } = useWaitForTransactionReceipt({ hash: stakeHash });

  useEffect(() => {
    if (approving) {
      toast.info("Approving tokens...");
    }
    if (staking) {
      toast.info("Staking tokens...");
    }
  })

  useEffect(() => {
    if (approved) {
      setSuccess("Token approved successfully.");
      toast.success("Token approved successfully.");
      refetchAllowance();
    }
  }, [approved, refetchAllowance]);

  useEffect(() => {
    if (staked) {
      setSuccess("Staking successful! Your sbFT tokens are ready!");
      toast.success("Staking successful! Your sbFT tokens are ready!");
      setAmount("");
      refetchExchangeRate();
    }
  }, [staked, refetchExchangeRate]);

  const handleApprove = () => {
    setError("");
    setSuccess("");
    
    if (!amount) {
      setError("Enter amount");
      toast.warning("Kindly enter amount");
      return;
    }
  
    try {
      const value = parseUnits(amount, 18);
      
      // Check minimum stake requirement (1 XFI)
      const minStakeAmount = parseUnits("1", 18);
      if (value < minStakeAmount) {
        setError("Minimum stake is 1 XFI");
        toast.error("Minimum stake is 1 XFI");
        return;
      }
  
      // Check user balance
      if (value > balanceOf) {
        setError("Insufficient XFI balance");
        toast.error("Insufficient XFI balance");
        return;
      }
  
      approveWrite({
        address: xfiTokenAddress,
        abi: xfiTokenAbi,
        functionName: "approve",
        args: [stakingContractAddress, value],
      });
    } catch (error) {
      console.error("Approve error:", error);
      setError("Failed to approve tokens.");
      toast.error("Failed to approve tokens.");
    }
  };
  
  const handleStake = () => {
    setError("");
    setSuccess("");
    
    if (!amount) {
      setError("Enter amount");
      toast.warning("Kindly enter amount");
      return;
    }
  
    try {
      const value = parseUnits(amount, 18);
      
      // Check minimum stake requirement (1 XFI)
      const minStakeAmount = parseUnits("1", 18);
      if (value < minStakeAmount) {
        setError("Minimum stake is 1 XFI");
        toast.error("Minimum stake is 1 XFI");
        return;
      }
  
      // Check user balance
      if (value > balanceOf) {
        setError("Insufficient XFI balance");
        toast.error("Insufficient XFI balance");
        return;
      }
  
      // FIXED: Check allowance properly
      if (value > allowanceData) {
        setError("Insufficient allowance. Please approve first.");
        toast.error("Insufficient allowance. Please approve first.");
        return;
      }
  
      stakeWrite({
        address: stakingContractAddress,
        abi: stakingContractAbi,
        functionName: "stake",
        args: [value],
      });
    } catch (error) {
      console.error("Staking error:", error);
      setError("Staking failed.");
      toast.error("Staking failed.");
    }
  };


  // Calculate expected sbFT tokens user will receive
  const calculateExpectedSbFT = () => {
    if (!amount || !exchangeRateData) return "0";
    try {
      const xfiAmount = parseUnits(amount, 18);
      const fee = xfiAmount / 100n; // 1% fee
      const netAmount = xfiAmount - fee;
      const sbftAmount = (netAmount * 1000000000000000000n) / exchangeRateData;
      return formatUnits(sbftAmount, 18);
    } catch {
      return "0";
    }
  };

  // Calculate XFI value of user's sbFT tokens
  const calculateSbFTValue = () => {
    if (!sbftBalanceOf || !exchangeRateData) return "0";
    try {
      const xfiValue = (sbftBalanceOf * exchangeRateData) / 1000000000000000000n;
      return formatUnits(xfiValue, 18);
    } catch {
      return "0";
    }
  };

  const formatDelay = (seconds: bigint) => {
    const days = Number(seconds) / (24 * 60 * 60);
    if (days >= 1) return `${Math.floor(days)} days`;
    const hours = Number(seconds) / (60 * 60);
    return `${Math.floor(hours)} hours`;
  };

  return (
    <div className="relative min-h-screen text-white">
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="text-center mb-12 pt-20">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Liquid Stake XFI Token, Earn sbFTs
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Stake XFI tokens and receive tradeable sbFT tokens that appreciate with staking rewards
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Staking Form */}
          <div className="space-y-6">
            <div className="bg-[#27272A] border border-[#3F3F46] rounded-xl p-8 hover:shadow-lg transition">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Coins className="text-purple-400" />
                Liquid Stake XFI
              </h2>

              <div className="space-y-6">
                {/* Current Exchange Rate */}
                <div className="bg-[#1A1A1A] rounded-lg p-4 border border-[#3F3F46]">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-400">Current Exchange Rate</p>
                    <ArrowUpDown className="h-4 w-4 text-purple-400" />
                  </div>
                  <p className="text-xl font-bold text-purple-400">
                    1 sbFT = {formatUnits(exchangeRateData, 18)} XFI
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Rate increases as rewards accrue to the global pool
                  </p>
                </div>

                {/* Wallet Balances */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#1A1A1A] rounded-lg p-4 border border-[#3F3F46]">
                    <p className="text-sm text-gray-400 mb-2">XFI Balance</p>
                    <p className="text-lg font-bold text-white">
                      {tokenBalance ? formatUnits(balanceOf, 18) : "0"} XFI
                    </p>
                  </div>
                  <div className="bg-[#1A1A1A] rounded-lg p-4 border border-[#3F3F46]">
                    <p className="text-sm text-gray-400 mb-2">sbFT Balance</p>
                    <p className="text-lg font-bold text-green-400">
                      {sbftBalance ? formatUnits(sbftBalanceOf, 18) : "0"} sbFT
                    </p>
                    <p className="text-xs text-gray-500">
                      ≈ {calculateSbFTValue()} XFI value
                    </p>
                  </div>
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
                  {amount && (
                    <p className="text-sm text-gray-400 mt-2">
                      You will receive ≈ {calculateExpectedSbFT()} sbFT tokens (after 1% fee)
                    </p>
                  )}
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

                {/* Pool Statistics */}
                <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-300 mb-3">Global Pool Statistics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total XFI in Pool:</span>
                      <span className="text-white">{formatUnits(totalPoolXFI, 18)} XFI</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Pending Unstakes:</span>
                      <span className="text-yellow-400">{formatUnits(pendingUnstakes, 18)} XFI</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Unstaking Delay:</span>
                      <span className="text-white">{formatDelay(delaySeconds)}</span>
                    </div>
                  </div>
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
                <Image 
                  src="/stakebake.png" 
                  alt="Stake & Bake NFT"
                  width={200}
                  height={200}
                  className="relative w-full h-full object-cover rounded-full border-2 border-purple-400 shadow-xl"
                />
              </div>
              <h3 className="text-xl font-bold mb-2 text-purple-400">
                sbFT Liquid Staking Tokens
              </h3>
              <p className="text-gray-400 text-sm">
                Tradeable tokens that represent shares in the global staking pool
              </p>
            </div>

            {/* How It Works */}
            <div className="bg-[#27272A] border border-[#3F3F46] rounded-xl p-6 hover:shadow-lg transition">
              <h3 className="text-xl font-bold mb-6">How Liquid Staking Works</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-purple-600 rounded-full p-2 mt-1">
                    <Coins className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold">1. Stake XFI</h4>
                    <p className="text-gray-400 text-sm">
                      Deposit XFI into the global pool. Get sbFT tokens at current exchange rate.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-purple-600 rounded-full p-2 mt-1">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold">2. Automatic Rewards</h4>
                    <p className="text-gray-400 text-sm">
                      Pool earns 8% APY. Exchange rate increases automatically - no claiming needed.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-purple-600 rounded-full p-2 mt-1">
                    <Gift className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold">3. Free Trading</h4>
                    <p className="text-gray-400 text-sm">
                      Trade sbFT tokens on marketplace. Buyers get claim to underlying XFI.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-purple-600 rounded-full p-2 mt-1">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold">4. Unstaking Queue</h4>
                    <p className="text-gray-400 text-sm">
                      Request unstaking → Wait {formatDelay(delaySeconds)} → Get XFI back at current rate.
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
                  <span className="text-gray-300">8% APY with automatic compounding</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400" />
                  <span className="text-gray-300">sbFT tokens are freely tradeable</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400" />
                  <span className="text-gray-300">Global pool shares rewards fairly</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-purple-400" />
                  <span className="text-gray-300">Anyone can unstake sbFT for XFI</span>
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span className="text-gray-300">Emergency unstaking available (with penalty)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}