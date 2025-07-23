"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { ChevronDown } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  stakingContractAbi,
  stakingContractAddress,
  xfiTokenAbi,
  xfiTokenAddress,
} from "@/contractAddressAndABI";

export default function StakePage() {
  const [amount, setAmount] = useState("");
  const [isApproved, setIsApproved] = useState(false);
  const [loading, setLoading] = useState(false);

  // const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [stakingContract, setStakingContract] = useState<ethers.Contract | null>(null);
  const [tokenContract, setTokenContract] = useState<ethers.Contract | null>(null);

  useEffect(() => {
    async function init() {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();

        const staking = new ethers.Contract(stakingContractAddress, stakingContractAbi, signer);
        const token = new ethers.Contract(xfiTokenAddress, xfiTokenAbi, signer);

        // setProvider(provider);
        setSigner(signer);
        setStakingContract(staking);
        setTokenContract(token);

        const userAddress = await signer.getAddress();
        const allowance = await token.allowance(userAddress, stakingContractAddress);
        setIsApproved(allowance > 0);
      }
    }

    init();
  }, []);

  const handleApprove = async () => {
    if (!tokenContract || !signer) return;
    try {
      setLoading(true);
      const amountInWei = ethers.parseEther(amount || "0");
      const tx = await tokenContract.approve(stakingContractAddress, amountInWei);
      await tx.wait();
      setIsApproved(true);
      alert("Approval successful");
    } catch (err) {
      console.error(err);
      alert("Approval failed");
    } finally {
      setLoading(false);
    }
  };

  const handleStake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stakingContract || !signer) return;

    try {
      setLoading(true);
      const amountInWei = ethers.parseEther(amount);
      const tx = await stakingContract.stake(amountInWei);
      await tx.wait();
      alert("Stake successful!");
      setAmount(""); // Clear input
    } catch (err) {
      console.error(err);
      alert("Stake failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClaimRewards = async () => {
    if (!stakingContract || !signer) return;
    try {
      setLoading(true);
      const tx = await stakingContract.claimRewards();
      await tx.wait();
      alert("Rewards claimed");
    } catch (err) {
      console.error(err);
      alert("Claim failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCompoundRewards = async () => {
    if (!stakingContract || !signer) return;
    try {
      setLoading(true);
      const tx = await stakingContract.compoundRewards();
      await tx.wait();
      alert("Rewards compounded");
    } catch (err) {
      console.error(err);
      alert("Compound failed");
    } finally {
      setLoading(false);
    }
  };

  const isAmountValid = parseFloat(amount) >= 0.001;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#1a1a1a]/80 flex items-center justify-center px-4 py-10 mt-16 sm:mx-[6%] md:mx-[8%] lg:mx-[10%]">
        <div className="border border-[#3F3F46] bg-gray-600/50 w-full max-w-md rounded-xl p-8 shadow-lg">
          <h1 className="text-3xl font-bold text-white mb-8">Stake Your XFI</h1>

          <form className="flex flex-col" onSubmit={handleStake}>
            {/* Token Selector (static for now) */}
            <div className="mb-6">
              <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-[#141414] text-white">
                <span>XFI</span>
                <ChevronDown size={16} />
              </div>
            </div>

            {/* Amount Input */}
            <div className="mb-6">
              <input
                type="number"
                step="0.0001"
                placeholder="Minimum 0.001 XFI"
                className="w-full px-4 py-3 rounded-lg bg-[#141414] text-white placeholder-gray-500 outline-none"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            {/* Approve */}
            <button
              type="button"
              onClick={handleApprove}
              disabled={loading || !isAmountValid}
              className="w-full py-3 mb-4 rounded-lg bg-[#f59e0b] text-white font-semibold hover:bg-[#d97706] transition"
            >
              {loading ? "Approving..." : "Approve"}
            </button>

            {/* Stake */}
            <button
              type="submit"
              disabled={!isApproved || !isAmountValid || loading}
              className="w-full py-3 rounded-lg bg-[#7c3aed] text-white font-semibold hover:bg-[#6d28d9] transition"
            >
              {loading ? "Staking..." : "Stake"}
            </button>
          </form>

          {/* Reward Actions */}
          <div className="mt-6 grid grid-cols-1 gap-4">
            <button
              onClick={handleClaimRewards}
              disabled={loading}
              className="w-full py-2 rounded-lg bg-[#10b981] text-white font-medium hover:bg-[#059669]"
            >
              Claim Rewards
            </button>

            <button
              onClick={handleCompoundRewards}
              disabled={loading}
              className="w-full py-2 rounded-lg bg-[#2563eb] text-white font-medium hover:bg-[#1d4ed8]"
            >
              Compound Rewards
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
