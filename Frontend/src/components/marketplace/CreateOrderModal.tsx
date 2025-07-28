'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContracts } from 'wagmi';
import { parseUnits, formatUnits, maxUint256 } from 'viem';
import { X, ShoppingCart, DollarSign, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { sbFTMarketplaceAddress, sbFTMarketplaceAbi, sbFTTokenAddress, mockUSDCAddress } from "@/contractAddressAndABI"

const MARKETPLACE_ADDRESS = sbFTMarketplaceAddress;
const SBFT_TOKEN_ADDRESS = sbFTTokenAddress;
const USDC_TOKEN_ADDRESS = mockUSDCAddress;
const MARKETPLACE_ABI = sbFTMarketplaceAbi;

const ERC20_ABI = [
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" }
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" }
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function"
  }
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
};

export default function CreateOrderModal({ isOpen, onClose, onOrderCreated }: Props) {
  const { address } = useAccount();
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');
  const [approvalStep, setApprovalStep] = useState<'none' | 'needed' | 'pending' | 'completed'>('none');

  const { writeContract, data: hash, isPending } = useWriteContract({
    mutation: {
      onSuccess: (hash) => {
        toast.success(`Order transaction submitted: ${hash.slice(0, 10)}...`);
        setError('');
      },
      onError: (error) => {
        console.error('Order creation error:', error);
        const errorMessage = parseErrorMessage(error);
        setError(errorMessage);
        toast.error(`Order creation failed: ${errorMessage}`);
      }
    }
  });

  const { writeContract: approveToken, data: approveHash, isPending: isApprovePending } = useWriteContract({
    mutation: {
      onSuccess: (hash) => {
        toast.success(`Approval transaction submitted: ${hash.slice(0, 10)}...`);
        setApprovalStep('pending');
      },
      onError: (error) => {
        console.error('Approval error:', error);
        const errorMessage = parseErrorMessage(error);
        toast.error(`Approval failed: ${errorMessage}`);
        setApprovalStep('needed');
      }
    }
  });

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    confirmations: 1,
  });

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
    confirmations: 1,
  });

  // Get user balances and allowances
  const { data: balanceData, refetch: refetchBalances } = useReadContracts({
    contracts: [
      {
        address: SBFT_TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address!],
      },
      {
        address: USDC_TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address!],
      },
      {
        address: SBFT_TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address!, MARKETPLACE_ADDRESS as `0x${string}`],
      },
      {
        address: USDC_TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address!, MARKETPLACE_ADDRESS as `0x${string}`],
      },
    ],
    query: {
      enabled: !!address,
      refetchInterval: 3000, // Refetch every 3 seconds
    },
  });

  const sbftBalance = balanceData?.[0]?.result as bigint | undefined;
  const usdcBalance = balanceData?.[1]?.result as bigint | undefined;
  const sbftAllowance = balanceData?.[2]?.result as bigint | undefined;
  const usdcAllowance = balanceData?.[3]?.result as bigint | undefined;

  // Fixed decimal values
  const SBFT_DECIMALS = 18;
  const USDC_DECIMALS = 6;

  // Handle successful transactions
  useEffect(() => {
    if (isSuccess) {
      toast.success('Order created successfully!');
      onOrderCreated();
      onClose();
      // Reset form
      setAmount('');
      setPrice('');
      setError('');
      setApprovalStep('none');
    }
  }, [isSuccess, onOrderCreated, onClose]);

  useEffect(() => {
    if (isApproveSuccess) {
      toast.success('Token approval successful!');
      setApprovalStep('completed');
      // Refetch balances after successful approval
      setTimeout(() => {
        refetchBalances();
      }, 2000);
    }
  }, [isApproveSuccess, refetchBalances]);

  // Check approval status when inputs change
  useEffect(() => {
    if (amount && price && (sbftAllowance !== undefined || usdcAllowance !== undefined)) {
      const needsApproval = checkIfNeedsApproval();
      if (needsApproval && approvalStep === 'none') {
        setApprovalStep('needed');
      } else if (!needsApproval && (approvalStep === 'needed' || approvalStep === 'completed')) {
        setApprovalStep('none');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, price, sbftAllowance, usdcAllowance, orderType, approvalStep]);

  if (!isOpen) return null;

  // Parse error messages to be more user-friendly
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function parseErrorMessage(error: any): string {
    if (error.message?.includes('User rejected') || error.message?.includes('user rejected')) {
      return 'Transaction was rejected by user';
    }
    if (error.message?.includes('insufficient funds')) {
      return 'Insufficient funds for gas';
    }
    if (error.message?.includes('Order below minimum size')) {
      return 'Order amount is below minimum size (1 sbFT)';
    }
    if (error.message?.includes('Insufficient')) {
      return 'Insufficient token balance';
    }
    if (error.message?.includes('transfer amount exceeds allowance') || error.message?.includes('ERC20: insufficient allowance')) {
      return 'Insufficient token allowance. Please approve tokens first';
    }
    if (error.shortMessage) {
      return error.shortMessage;
    }
    return error.message || 'Unknown error occurred';
  }

  // Validation functions
  const validateInputs = (): string | null => {
    if (!amount || !price) {
      return 'Please fill in all fields';
    }

    const numAmount = parseFloat(amount);
    const numPrice = parseFloat(price);

    if (numAmount <= 0) {
      return 'Amount must be greater than 0';
    }

    if (numPrice <= 0) {
      return 'Price must be greater than 0';
    }

    if (numAmount < 1) {
      return 'Minimum order size is 1 sbFT';
    }

    return null;
  };

  const checkIfNeedsApproval = (): boolean => {
    if (!amount || !price) return false;
    
    try {
      const sbftAmount = parseUnits(amount, SBFT_DECIMALS);
      const usdcPrice = parseUnits(price, USDC_DECIMALS);
      
      // Calculate total USDC value needed for buy orders
      const totalUsdcValue = (sbftAmount * usdcPrice) / parseUnits('1', SBFT_DECIMALS);

      if (orderType === 'buy') {
        // For buy orders, check USDC allowance
        return !usdcAllowance || totalUsdcValue > usdcAllowance;
      } else {
        // For sell orders, check sbFT allowance
        return !sbftAllowance || sbftAmount > sbftAllowance;
      }
    } catch {
      return false;
    }
  };

  const getRequiredAmount = () => {
    if (!amount || !price) return { amount: 0n, token: 'USDC' };
    
    const sbftAmount = parseUnits(amount, SBFT_DECIMALS);
    const usdcPrice = parseUnits(price, USDC_DECIMALS);
    const totalUsdcValue = (sbftAmount * usdcPrice) / parseUnits('1', SBFT_DECIMALS);

    if (orderType === 'buy') {
      return { amount: totalUsdcValue, token: 'USDC' };
    } else {
      return { amount: sbftAmount, token: 'sbFT' };
    }
  };

  const handleApprove = async () => {
    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }
    
    try {
      const tokenAddress = orderType === 'buy' ? USDC_TOKEN_ADDRESS : SBFT_TOKEN_ADDRESS;
      const tokenName = orderType === 'buy' ? 'USDC' : 'sbFT';

      toast.info(`Approving ${tokenName} tokens...`);

      // Use maximum allowance for unlimited approval (like in your script)
      await approveToken({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [MARKETPLACE_ADDRESS, maxUint256], // This is equivalent to ethers.constants.MaxUint256
      });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Approve error:', err);
      const errorMessage = parseErrorMessage(err);
      setError(errorMessage);
      toast.error(`Approval failed: ${errorMessage}`);
      setApprovalStep('needed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    // Check if approval is needed
    if (checkIfNeedsApproval()) {
      const errorMsg = `Please approve ${orderType === 'buy' ? 'USDC' : 'sbFT'} tokens first`;
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    try {
      const sbftAmount = parseUnits(amount, SBFT_DECIMALS);
      const usdcPrice = parseUnits(price, USDC_DECIMALS);
      const totalValue = (sbftAmount * usdcPrice) / parseUnits('1', SBFT_DECIMALS);

      // Validate balances
      if (orderType === 'buy' && usdcBalance && totalValue > usdcBalance) {
        const errorMsg = 'Insufficient USDC balance';
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      if (orderType === 'sell' && sbftBalance && sbftAmount > sbftBalance) {
        const errorMsg = 'Insufficient sbFT balance';
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      toast.info(`Creating ${orderType} order...`);

      // Create the order
      if (orderType === 'buy') {
        await writeContract({
          address: MARKETPLACE_ADDRESS as `0x${string}`,
          abi: MARKETPLACE_ABI,
          functionName: 'createBuyOrder',
          args: [sbftAmount, usdcPrice],
        });
      } else {
        await writeContract({
          address: MARKETPLACE_ADDRESS as `0x${string}`,
          abi: MARKETPLACE_ABI,
          functionName: 'createSellOrder',
          args: [sbftAmount, usdcPrice],
        });
      }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Order creation error:', err);
      const errorMessage = parseErrorMessage(err);
      setError(errorMessage);
      toast.error(`Order creation failed: ${errorMessage}`);
    }
  };

  const totalValue = amount && price ? 
    parseFloat(amount) * parseFloat(price) : 0;

  const isProcessing = isPending || isConfirming || isApprovePending || isApproveConfirming;
  const needsApproval = approvalStep === 'needed';
  // const approvalCompleted = approvalStep === 'completed' || approvalStep === 'none';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#121212] border border-[#3F3F46] rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Create Order</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance Info */}
        <div className="mb-4 p-3 bg-gray-800 rounded-lg">
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>sbFT Balance:</span>
              <span className="font-mono">{sbftBalance ? parseFloat(formatUnits(sbftBalance, SBFT_DECIMALS)).toFixed(4) : '0.0000'}</span>
            </div>
            <div className="flex justify-between">
              <span>USDC Balance:</span>
              <span className="font-mono">{usdcBalance ? parseFloat(formatUnits(usdcBalance, USDC_DECIMALS)).toFixed(2) : '0.00'}</span>
            </div>
            <hr className="border-gray-600 my-2" />
            <div className="flex justify-between text-xs">
              <span>sbFT Allowance:</span>
              <span className="font-mono">{sbftAllowance ? (sbftAllowance === maxUint256 ? 'Unlimited' : parseFloat(formatUnits(sbftAllowance, SBFT_DECIMALS)).toFixed(2)) : '0.00'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>USDC Allowance:</span>
              <span className="font-mono">{usdcAllowance ? (usdcAllowance === maxUint256 ? 'Unlimited' : parseFloat(formatUnits(usdcAllowance, USDC_DECIMALS)).toFixed(2)) : '0.00'}</span>
            </div>
          </div>
        </div>

        {/* Order Type Toggle */}
        <div className="flex bg-[#1F1F23] rounded-lg p-1 mb-6">
          <button
            onClick={() => {
              setOrderType('buy');
              setApprovalStep('none');
              setError('');
            }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
              orderType === 'buy'
                ? 'bg-green-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Buy sbFT
            </div>
          </button>
          <button
            onClick={() => {
              setOrderType('sell');
              setApprovalStep('none');
              setError('');
            }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
              orderType === 'sell'
                ? 'bg-red-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <DollarSign className="w-4 h-4" />
              Sell sbFT
            </div>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount (sbFT)
            </label>
            <input
              type="number"
              step="0.001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1.000"
              min="1"
              className="w-full bg-[#1F1F23] border border-[#3F3F46] rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />
            <div className="text-xs text-gray-400 mt-1">
              Minimum: 1 sbFT
            </div>
          </div>

          {/* Price Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Price per sbFT (USDC)
            </label>
            <input
              type="number"
              step="0.0001"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.0000"
              min="0.0001"
              className="w-full bg-[#1F1F23] border border-[#3F3F46] rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Total Value & Required Amount */}
          <div className="bg-[#1F1F23] rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Total Value:</span>
              <span className="font-bold">{totalValue.toFixed(4)} USDC</span>
            </div>
            {amount && price && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Required:</span>
                <span className="text-gray-400">
                  {getRequiredAmount().amount ? 
                    `${parseFloat(formatUnits(getRequiredAmount().amount, getRequiredAmount().token === 'USDC' ? USDC_DECIMALS : SBFT_DECIMALS)).toFixed(4)} ${getRequiredAmount().token}` 
                    : '0 USDC'}
                </span>
              </div>
            )}
          </div>

          {/* Approval Status */}
          {(needsApproval || approvalStep === 'pending' || approvalStep === 'completed') && (
            <div className={`p-3 rounded-lg border ${
              approvalStep === 'completed' ? 'bg-green-900/20 border-green-600' :
              approvalStep === 'pending' ? 'bg-yellow-900/20 border-yellow-600' :
              'bg-red-900/20 border-red-600'
            }`}>
              <div className="flex items-center gap-2 text-sm">
                {approvalStep === 'completed' ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-green-400">Token approval completed</span>
                  </>
                ) : approvalStep === 'pending' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
                    <span className="text-yellow-400">Token approval pending...</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="text-red-400">Token approval required</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {needsApproval && (
              <button
                type="button"
                onClick={handleApprove}
                disabled={isProcessing}
                className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white py-2 px-4 rounded-lg font-medium transition flex items-center justify-center gap-2"
              >
                {isApprovePending || isApproveConfirming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                Approve {orderType === 'buy' ? 'USDC' : 'sbFT'}
              </button>
            )}
            
            <button
              type="submit"
              disabled={isProcessing || needsApproval}
              className={`w-full py-2 px-4 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                orderType === 'buy'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              } disabled:opacity-50 text-white`}
            >
              {isPending || isConfirming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              Create {orderType === 'buy' ? 'Buy' : 'Sell'} Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}