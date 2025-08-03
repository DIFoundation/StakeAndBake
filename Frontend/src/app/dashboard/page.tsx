"use client";

import {
  useAccount,
  useBalance,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useState, useEffect, useCallback } from "react";
import TotalStakedStats from "@/components/dashboard/TotalStakedStats";
import RewardsBreakdownChart from "@/components/dashboard/RewardsBreakdownChart";
import TransactionHistoryTable from "@/components/dashboard/TransactionHistoryTable";
import {
  stakingContractAddress,
  stakingContractAbi,
  xfiTokenAbi,
  xfiTokenAddress,
  sbFTTokenAddress,
} from "@/contractAddressAndABI";
import { Abi, formatEther, parseEther } from "viem";
import { useTransactionHistory } from "@/hooks/useTransactionHistory";
import { Clock, ArrowRight, X, Loader2, AlertCircle, CheckCircle, Trash2, Plus, AlertTriangle } from "lucide-react";
import { toast } from "react-toastify";

function formatBalance(balance: number | bigint | string, decimals = 4) {
  const num = typeof balance === "string" ? parseFloat(balance) : Number(balance);
  if (isNaN(num) || num === 0) return "0.00";
  if (num < 0.01) return "< 0.01";
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
  return num.toFixed(decimals);
}

function safeBigIntToString(value: number | bigint | string, fallback = "0.00") {
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
  onUpdate: () => void; 
}

function UnstakeRequestCard({ requestData, requestId, onUpdate }: UnstakeRequestCardProps) {
  const { address } = useAccount();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const { data: canProcessData } = useReadContract({
    address: stakingContractAddress,
    abi: stakingContractAbi,
    functionName: "canProcessUnstake",
    args: [requestId],
    query: {
      enabled: !!requestData && !requestData.processed,
    },
  });

  const { writeContract: processUnstakeContract, data: hashProcess } = useWriteContract();
  const { writeContract: cancelUnstakeContract, data: hashCancel } = useWriteContract();

  const {
    isLoading: isProcessingTx,
    isSuccess: isSuccessProcess,
    error: errorProcess,
  } = useWaitForTransactionReceipt({
    hash: hashProcess,
  });

  const {
    isLoading: isCancellingTx,
    isSuccess: isSuccessCancel,
    error: errorCancel,
  } = useWaitForTransactionReceipt({
    hash: hashCancel,
  });

  useEffect(() => {
    if (isSuccessProcess) {
      setIsProcessing(false);
      setIsModalOpen(false);
      toast.success("XFI successfully claimed!");
      if (onUpdate) onUpdate();
    }
  }, [isSuccessProcess, onUpdate]);

  useEffect(() => {
    if (isSuccessCancel) {
      setIsCancelling(false);
      setIsModalOpen(false);
      toast.success("Unstake request cancelled successfully!");
      if (onUpdate) onUpdate();
    }
  }, [isSuccessCancel, onUpdate]);

  useEffect(() => {
    if (errorProcess) {
      setIsProcessing(false);
      toast.error("Failed to process unstake request");
    }
  }, [errorProcess]);

  useEffect(() => {
    if (errorCancel) {
      setIsCancelling(false);
      toast.error("Failed to cancel unstake request");
    }
  }, [errorCancel]);

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

  const unlockTime = requestData.unlockTime;
  let unlockDate;
  
  try {
    const timeValue = typeof unlockTime === 'bigint' ? Number(unlockTime) : Number(unlockTime);
    unlockDate = new Date(timeValue * 1000);
    
    if (isNaN(unlockDate.getTime())) {
      throw new Error("Invalid date");
    }
  } catch {
    unlockDate = new Date();
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

  const xfiAmount = requestData.xfiAmount;
  let formattedAmount;
  
  try {
    formattedAmount = safeBigIntToString(xfiAmount);
  } catch {
    formattedAmount = "0.00";
  }

  return (
    <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] rounded-xl p-6 border border-[#3F3F46] shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-purple-400 bg-purple-500/20 px-2 py-1 rounded-full">
              Request #{requestId.toString()}
            </span>
          </div>
          <p className="text-3xl font-bold text-white mb-2">
            {formattedAmount} XFI
          </p>
          <p className="text-sm text-gray-400">
            <Clock className="inline h-4 w-4 mr-1" />
            Unlocks: {unlockDate.toLocaleDateString()} at {unlockDate.toLocaleTimeString()}
          </p>
        </div>

        <div className="flex flex-col items-start lg:items-end gap-3">
          {canProcessNow ? (
            <>
              <div className="flex items-center text-green-400 font-medium bg-green-500/20 px-3 py-1 rounded-full">
                <CheckCircle className="h-4 w-4 mr-2" />
                Ready to Claim
              </div>
              <button
                onClick={handleProcess}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-green-500/25"
                disabled={isProcessing || isProcessingTx}
              >
                {isProcessing || isProcessingTx ? (
                  <div className="flex items-center">
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Claiming...
                  </div>
                ) : (
                  "Claim XFI"
                )}
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center text-amber-400 font-medium bg-amber-500/20 px-3 py-1 rounded-full">
                <Clock className="h-4 w-4 mr-2" />
                {formatTime(timeRemaining)}
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-red-500/25"
                disabled={isCancelling || isCancellingTx}
              >
                {isCancelling || isCancellingTx ? (
                  <div className="flex items-center">
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Revoking...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Revoke Request
                  </div>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] rounded-2xl p-8 w-full max-w-md border border-[#3F3F46] shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Confirm Revocation</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="mb-6">
              <AlertTriangle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
              <p className="text-gray-300 text-center leading-relaxed">
                Are you sure you want to revoke this unstake request? Your sbFT tokens will be minted back to your wallet at the current exchange rate.
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-6 py-3 rounded-xl text-white font-medium border border-gray-600 hover:bg-gray-700/50 transition-colors"
                disabled={isCancelling || isCancellingTx}
              >
                Keep Request
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold hover:from-red-600 hover:to-red-700 disabled:opacity-50 transition-all duration-200"
                disabled={isCancelling || isCancellingTx}
              >
                {isCancelling || isCancellingTx ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Revoking...
                  </div>
                ) : (
                  "Revoke Request"
                )}
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
  onUpdate: () => void;
}

function UnstakeRequestList({ requestIds, onUpdate }: UnstakeRequestListProps) {
  const contractsToRead = requestIds?.map((id) => ({
    address: stakingContractAddress as `0x${string}`,
    abi: stakingContractAbi as Abi,
    functionName: 'unstakeRequests',
    args: [id],
  })) ?? [];

  const { data: requestDetails, isLoading, error, refetch } = useReadContracts({
    contracts: contractsToRead,
    query: { 
      enabled: contractsToRead.length > 0,
      refetchInterval: 5000,
    },
  });

  const handleUpdate = useCallback(() => {
    refetch();
    if (onUpdate) onUpdate();
  }, [refetch, onUpdate]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin mr-3" />
        <span className="text-lg">Loading your requests...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-12 text-red-400">
        <AlertCircle className="h-8 w-8 mr-3" />
        <span className="text-lg">Error fetching details: {error.message}</span>
      </div>
    );
  }

  const processedRequests = requestDetails
    ?.map((result, index) => {
      if (result.status === "success" && result.result) {
        const [user, xfiAmount, unlockTime, processed] = result.result as [string, bigint, bigint, boolean];
        
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
    .filter((request): request is NonNullable<typeof request> => request !== null) || [];

  if (processedRequests.length === 0) {
    return (
      <div className="text-center p-12">
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-8 border border-gray-700">
          <Clock className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No Active Requests</h3>
          <p className="text-gray-500">You don&apos;t have any pending unstake requests at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {processedRequests.map((request) => (
        <UnstakeRequestCard 
          key={request.id.toString()} 
          requestId={request.id} 
          requestData={request}
          onUpdate={handleUpdate}
        />
      ))}
    </div>
  );
}

interface RequestUnstakeFormProps {
  onUpdate: () => void;
}

function RequestUnstakeForm({ onUpdate }: RequestUnstakeFormProps) {
  const { address } = useAccount();
  const [unstakeAmount, setUnstakeAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: sbftBalance, refetch: refetchBalance } = useReadContract({
    address: sbFTTokenAddress,
    abi: xfiTokenAbi,
    functionName: "balanceOf",
    args: [address],
    query: {
      enabled: Boolean(address),
      refetchInterval: 5000,
    },
  });

  const { writeContract: requestUnstakeContract, data: hash } = useWriteContract();

  const {
    isLoading: isUnstakingTx,
    isSuccess: isSuccessUnstake,
    error: errorUnstake,
  } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccessUnstake) {
      setIsProcessing(false);
      setUnstakeAmount("");
      toast.success("Unstake request submitted successfully!");
      refetchBalance();
      if (onUpdate) onUpdate();
    }
  }, [isSuccessUnstake, refetchBalance, onUpdate]);

  useEffect(() => {
    if (errorUnstake) {
      setIsProcessing(false);
      toast.error("Failed to submit unstake request");
    }
  }, [errorUnstake]);

  const handleRequestUnstake = () => {
    if (!address || !unstakeAmount) return;
    
    try {
      setIsProcessing(true);
      const amount = parseEther(unstakeAmount);
      
      requestUnstakeContract({
        address: stakingContractAddress,
        abi: stakingContractAbi,
        functionName: "requestUnstake",
        args: [amount],
      });
    } catch {
      setIsProcessing(false);
      toast.error("Invalid amount entered");
    }
  };

  const maxBalance = sbftBalance ? sbftBalance.toString() : "0.00";

  return (
    <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] rounded-2xl p-8 border border-[#3F3F46] shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-orange-500/20 rounded-lg">
          <Clock className="h-6 w-6 text-orange-400" />
        </div>
        <h3 className="text-2xl font-bold text-white">Request Unstake</h3>
      </div>
      
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-amber-200 text-sm font-medium mb-1">7-Day Waiting Period</p>
            <p className="text-amber-300/80 text-sm">
              After requesting unstake, there&apos;s a 7-day waiting period before you can claim your XFI tokens.
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-3">
            Amount to Unstake (sbFT)
          </label>
          <div className="relative">
            <input
              type="number"
              value={unstakeAmount}
              onChange={(e) => setUnstakeAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-4 bg-[#2A2A2A] border border-[#3F3F46] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all duration-200 text-lg font-medium"
            />
            <button
              onClick={() => setUnstakeAmount(maxBalance)}
              className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
            >
              Max
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
            <span>Available:</span>
            <span className="font-medium text-orange-400">{maxBalance} sbFT</span>
          </p>
        </div>
        
        <button
          onClick={handleRequestUnstake}
          disabled={!unstakeAmount || isProcessing || isUnstakingTx || parseFloat(unstakeAmount) <= 0}
          className="w-full px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-orange-500/25 text-lg"
        >
          {isProcessing || isUnstakingTx ? (
            <div className="flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin mr-3" />
              Processing Request...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <Plus className="h-5 w-5 mr-2" />
              Request Unstake
            </div>
          )}
        </button>
      </div>
    </div>
  );
}

interface EmergencyUnstakeFormProps {
  onUpdate: () => void;
}

function EmergencyUnstakeForm({ onUpdate }: EmergencyUnstakeFormProps) {
  const { address } = useAccount();
  const [unstakeAmount, setUnstakeAmount] = useState("");
  const [penaltyRate, setPenaltyRate] = useState("1000"); // 10% default
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { data: sbftBalance, refetch: refetchBalance } = useReadContract({
    address: sbFTTokenAddress,
    abi: xfiTokenAbi,
    functionName: "balanceOf",
    args: [address],
    query: {
      enabled: Boolean(address),
      refetchInterval: 5000,
    },
  });

  const { writeContract: emergencyUnstakeContract, data: hash } = useWriteContract();

  const {
    isLoading: isUnstakingTx,
    isSuccess: isSuccessUnstake,
    error: errorUnstake,
  } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccessUnstake) {
      setIsProcessing(false);
      setUnstakeAmount("");
      setShowConfirmation(false);
      toast.success("Emergency unstake completed successfully!");
      refetchBalance();
      if (onUpdate) onUpdate();
    }
  }, [isSuccessUnstake, refetchBalance, onUpdate]);

  useEffect(() => {
    if (errorUnstake) {
      setIsProcessing(false);
      toast.error("Emergency unstake failed");
    }
  }, [errorUnstake]);

  const handleEmergencyUnstake = () => {
    if (!address || !unstakeAmount) return;
    
    try {
      setIsProcessing(true);
      const amount = parseEther(unstakeAmount);
      
      emergencyUnstakeContract({
        address: stakingContractAddress,
        abi: stakingContractAbi,
        functionName: "emergencyUnstake",
        args: [amount, parseInt(penaltyRate)],
      });
    } catch  {
      setIsProcessing(false);
      toast.error("Invalid amount entered");
    }
  };

  const maxBalance = sbftBalance ? sbftBalance.toString() : "0.00";
  const penaltyPercentage = (parseInt(penaltyRate) / 100).toFixed(1);
  const estimatedReceived = unstakeAmount ? (parseFloat(unstakeAmount) * (1 - parseInt(penaltyRate) / 10000)).toFixed(4) : "0.00";

  return (
    <div className="bg-gradient-to-br from-red-900/20 to-red-800/20 rounded-2xl p-8 border border-red-500/30 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-red-500/20 rounded-lg">
          <AlertTriangle className="h-6 w-6 text-red-400" />
        </div>
        <h3 className="text-2xl font-bold text-white">Emergency Unstake</h3>
      </div>
      
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-red-200 text-sm font-medium mb-1">Warning: Penalty Applied</p>
            <p className="text-red-300/80 text-sm">
              Emergency unstaking bypasses the waiting period but applies a penalty fee. Use only in urgent situations.
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-3">
            Amount to Unstake (sbFT)
          </label>
          <div className="relative">
            <input
              type="number"
              value={unstakeAmount}
              onChange={(e) => setUnstakeAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-4 bg-[#2A2A2A] border border-red-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all duration-200 text-lg font-medium"
            />
            <button
              onClick={() => setUnstakeAmount(maxBalance)}
              className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
            >
              Max
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
            <span>Available:</span>
            <span className="font-medium text-red-400">{maxBalance} sbFT</span>
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-3">
            Penalty Rate ({penaltyPercentage}%)
          </label>
          <select
            value={penaltyRate}
            onChange={(e) => setPenaltyRate(e.target.value)}
            className="w-full px-4 py-3 bg-[#2A2A2A] border border-red-500/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all duration-200"
          >
            <option value="500">5% Penalty</option>
            <option value="1000">10% Penalty</option>
            <option value="1500">15% Penalty</option>
            <option value="2000">20% Penalty</option>
            <option value="2500">25% Penalty</option>
          </select>
        </div>

        {unstakeAmount && (
          <div className="bg-gray-800/50 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">You&apos;ll receive approximately:</span>
              <span className="text-xl font-bold text-green-400">{estimatedReceived} XFI</span>
            </div>
          </div>
        )}
        
        <button
          onClick={() => setShowConfirmation(true)}
          disabled={!unstakeAmount || parseFloat(unstakeAmount) <= 0}
          className="w-full px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-red-500/25 text-lg"
        >
          <div className="flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Emergency Unstake
          </div>
        </button>
      </div>

      {showConfirmation && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] rounded-2xl p-8 w-full max-w-md border border-red-500/30 shadow-2xl">
            <div className="text-center mb-6">
              <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Confirm Emergency Unstake</h3>
              <p className="text-gray-400">This action cannot be undone</p>
            </div>
            
            <div className="space-y-3 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Amount:</span>
                <span className="text-white font-medium">{unstakeAmount} sbFT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Penalty ({penaltyPercentage}%):</span>
                <span className="text-red-400 font-medium">-{(parseFloat(unstakeAmount || "0") * parseInt(penaltyRate) / 10000).toFixed(4)} XFI</span>
              </div>
              <div className="flex justify-between border-t border-gray-600 pt-3">
                <span className="text-gray-300 font-medium">You&apos;ll receive:</span>
                <span className="text-green-400 font-bold">{estimatedReceived} XFI</span>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 px-6 py-3 rounded-xl text-white font-medium border border-gray-600 hover:bg-gray-700/50 transition-colors"
                disabled={isProcessing || isUnstakingTx}
              >
                Cancel
              </button>
              <button
                onClick={handleEmergencyUnstake}
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold hover:from-red-600 hover:to-red-700 disabled:opacity-50 transition-all duration-200"
                disabled={isProcessing || isUnstakingTx}
              >
                {isProcessing || isUnstakingTx ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Processing...
                  </div>
                ) : (
                  "Confirm"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UnstakingQueue() {
  const { address, isConnected } = useAccount();
  const [activeSubTab, setActiveSubTab] = useState("request");

  const { data: requestIds, isLoading, error, refetch } = useReadContract({
    address: stakingContractAddress,
    abi: stakingContractAbi,
    functionName: "getUserUnstakeRequests",
    args: [address],
    query: {
      enabled: isConnected && !!address,
      select: (data) => (Array.isArray(data) ? data : []),
      refetchInterval: 10000,
    },
  });

  const handleUpdate = useCallback(() => {
    refetch();
  }, [refetch]);

  if (!isConnected) {
    return null;
  }

  const subTabs = [
    { id: "request", label: "Request Unstake", icon: Clock },
    { id: "emergency", label: "Emergency Unstake", icon: AlertTriangle },
  ];

  return (
    <div className="space-y-8">
      {/* Sub-tabs for unstaking options */}
      <div className="bg-[#1A1A1A] rounded-xl border border-[#3F3F46] overflow-hidden">
        <div className="flex border-b border-[#3F3F46]">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex-1 px-6 py-4 font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                  activeSubTab === tab.id
                    ? "text-orange-400 bg-orange-500/10 border-b-2 border-orange-400"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-8">
          {activeSubTab === "request" && <RequestUnstakeForm onUpdate={handleUpdate} />}
          {activeSubTab === "emergency" && <EmergencyUnstakeForm onUpdate={handleUpdate} />}
        </div>
      </div>
      
      {/* Unstaking Queue */}
      <div className="bg-[#121212]/80 border border-[#3F3F46] text-white rounded-2xl overflow-hidden shadow-xl">
        <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-b border-[#3F3F46] p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold mb-4">Your Unstaking Queue</h2>
              <p className="text-gray-400 mt-1">Monitor and manage your pending unstake requests</p>
            </div>
            <button
              onClick={handleUpdate}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              Refresh
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center p-12 text-gray-400">
              <Loader2 className="h-8 w-8 animate-spin mr-3" />
              <span className="text-lg">Loading requests...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center p-12 text-red-400">
              <AlertCircle className="h-8 w-8 mr-3" />
              <span className="text-lg">Error fetching requests: {error.message}</span>
            </div>
          ) : (
            <UnstakeRequestList requestIds={requestIds as (string | number | bigint)[]} onUpdate={handleUpdate} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({ address });
  const [activeTab, setActiveTab] = useState("overview");

  const { transactions: userTransactions, isLoading: transactionsLoading, error: transactionsError } =
    useTransactionHistory();

  // Read XFI token balance
  const { data: xfiBalance, refetch: refetchXfiBalance } = useReadContract({
    address: xfiTokenAddress,
    abi: xfiTokenAbi,
    functionName: "balanceOf",
    args: [address],
    query: {
      enabled: Boolean(address && xfiTokenAddress),
      refetchInterval: 5000,
    },
  });

  const { data: sbftWalletBalance, refetch: refetchSbftBalance } = useReadContract({
    address: sbFTTokenAddress,
    abi: xfiTokenAbi,
    functionName: "balanceOf",
    args: [address],
    query: {
      enabled: Boolean(address),
      refetchInterval: 5000,
    },
  });

  const { data: totalXFIInPool, refetch: refetchPoolData } = useReadContract({
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

  // Global refresh function
  const refreshAllData = useCallback(() => {
    refetchXfiBalance();
    refetchSbftBalance();
    refetchPoolData();
  }, [refetchXfiBalance, refetchSbftBalance, refetchPoolData]);

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const calculateEarnings = (baseAmount: any, apy: any, timeInYears = 1) => {
    const amount = parseFloat(baseAmount) || 0;
    const rate = parseFloat(apy) / 100 || 0;
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
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-12 border border-gray-700">
            <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
            <p className="text-gray-400 text-lg">
              Please connect your wallet to view your dashboard
            </p>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "unstaking", label: "Unstaking" },
    { id: "analytics", label: "Analytics" },
    { id: "history", label: "History" }
  ];

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 mt-16">
      <div className="mb-8 text-white">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          Liquid Staking Dashboard
        </h1>
        <p className="text-gray-400 text-lg mt-2">
          Welcome back, {address?.slice(0, 6)}...{address?.slice(-4)} • Monitor your sbFT tokens and manage unstaking
        </p>
      </div>

      {/* Exchange Rate Banner */}
      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-2xl p-6 mb-8 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Current Exchange Rate</p>
            <p className="text-3xl font-bold text-purple-400">
              1 sbFT = {currentExchangeRate} XFI
            </p>
          </div>
          <div className="text-center">
            <ArrowRight className="h-12 w-12 text-purple-400 mx-auto mb-2" />
            <p className="text-xs text-gray-500">Auto-compounding</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400 mb-1">Your Portfolio Value</p>
            <p className="text-2xl font-bold text-green-400">
              {sbftWalletBalanceFormatted} sbFT
            </p>
            <p className="text-lg text-green-300">
              ≈ {userXFIValue} XFI
            </p>
          </div>
        </div>
      </div>

      {/* Portfolio Stats */}
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

      {/* Pool Statistics */}
      <div className="bg-[#121212]/80 border border-[#3F3F46] text-white rounded-2xl p-8 mb-8 shadow-xl">
        <h2 className="text-2xl font-bold mb-6 text-transparent bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text">
          Global Pool Statistics
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 rounded-xl p-6 border border-blue-500/30">
            <p className="text-blue-200 text-sm mb-2 font-medium">Total XFI in Pool</p>
            <p className="text-3xl font-bold text-blue-400">{totalPoolXFI}</p>
            <p className="text-blue-300 text-sm">XFI</p>
            <p className="text-xs text-blue-400/60 mt-2">Backing all sbFT tokens</p>
          </div>
          <div className="bg-gradient-to-br from-amber-900/30 to-amber-800/30 rounded-xl p-6 border border-amber-500/30">
            <p className="text-amber-200 text-sm mb-2 font-medium">Pending Unstakes</p>
            <p className="text-3xl font-bold text-amber-400">{pendingUnstakes}</p>
            <p className="text-amber-300 text-sm">XFI</p>
            <p className="text-xs text-amber-400/60 mt-2">Reserved for unstaking queue</p>
          </div>
          <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 rounded-xl p-6 border border-green-500/30">
            <p className="text-green-200 text-sm mb-2 font-medium">Available Liquidity</p>
            <p className="text-3xl font-bold text-green-400">
              {(parseFloat(totalPoolXFI) - parseFloat(pendingUnstakes)).toFixed(4)}
            </p>
            <p className="text-green-300 text-sm">XFI</p>
            <p className="text-xs text-green-400/60 mt-2">Available for new unstakes</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-[#121212]/80 border border-[#3F3F46] text-white rounded-2xl mb-8 shadow-xl overflow-hidden">
        <div className="flex border-b border-[#3F3F46]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-8 py-6 font-semibold transition-all duration-200 flex-1 ${
                activeTab === tab.id
                  ? "text-purple-400 bg-purple-500/10 border-b-2 border-purple-400"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-8">
          {activeTab === "overview" && (
            <div className="space-y-8">
              <div className="text-center">
                <h3 className="text-3xl font-bold mb-4 text-transparent bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text">
                  Welcome to Your Staking Dashboard
                </h3>
                <p className="text-gray-400 text-lg leading-relaxed max-w-3xl mx-auto">
                  Your sbFT tokens automatically earn rewards through exchange rate appreciation. 
                  No need to claim or compound - it&apos;s all automatic! Watch your tokens grow in value over time.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 rounded-xl p-6 border border-purple-500/30">
                  <h4 className="text-xl font-bold text-purple-400 mb-3">How It Works</h4>
                  <ul className="space-y-2 text-gray-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      Exchange rate increases automatically
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      No manual claiming required
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      Rewards compound continuously
                    </li>
                  </ul>
                </div>
                
                <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 rounded-xl p-6 border border-blue-500/30">
                  <h4 className="text-xl font-bold text-blue-400 mb-3">Current APY</h4>
                  <p className="text-4xl font-bold text-blue-400 mb-2">{apyPercentage}%</p>
                  <p className="text-gray-400">Annual Percentage Yield</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "unstaking" && (
            <UnstakingQueue />
          )}

          {activeTab === "analytics" && (
            <RewardsBreakdownChart
              stakedAmount={parseFloat(userXFIValue)}
              claimedAmount={0}
              totalFeesCollected={parseFloat(totalFeesCollected)}
            />
          )}

          {activeTab === "history" && (
            <TransactionHistoryTable
              transactions={userTransactions}
              isLoading={transactionsLoading}
              error={transactionsError}
              onRefresh={refreshAllData}
            />
          )}
        </div>
      </div>
    </div>
  );
}