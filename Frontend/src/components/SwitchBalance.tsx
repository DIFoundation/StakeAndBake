'use client';

import { useState } from 'react';
import { useAccount, useBalance, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';
import { xfiTokenAbi, xfiTokenAddress } from '@/contractAddressAndABI';

type TokenType = 'XFI' | 'cXFI';

export default function TokenSwitcherBalance() {
  const [selectedToken, setSelectedToken] = useState<TokenType>('XFI');
  const { address, isConnected } = useAccount();

  // Get XFI (native) balance
  const { data: xfiBalance, isLoading: xfiLoading, error: xfiError } = useBalance({
    address: address,
  });

  // Get cXFI (token) balance
  const { data: cxfiBalance, isLoading: cxfiLoading, error: cxfiError } = useReadContract({
    address: xfiTokenAddress as `0x${string}`,
    abi: xfiTokenAbi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const formatBalance = (balance: bigint | undefined, decimals: number = 18) => {
    if (!balance) return '0.00';
    const formatted = formatUnits(balance, decimals);
    return parseFloat(formatted).toFixed(4);
  };

  const getCurrentBalance = () => {
    if (selectedToken === 'XFI') {
      return {
        balance: xfiBalance?.value,
        symbol: 'XFI',
        isLoading: xfiLoading,
        error: xfiError,
      };
    } else {
      return {
        balance: cxfiBalance,
        symbol: 'cXFI',
        isLoading: cxfiLoading,
        error: cxfiError,
      };
    }
  };

  const currentTokenData = getCurrentBalance();

  if (!isConnected) {
    return (
      <div className="p-6 bg-gray-900 rounded-lg border border-gray-700">
        <p className="text-gray-400">Please connect your wallet to view balances</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-900 rounded-lg border border-gray-700 max-w-md mx-auto">
      <h2 className="text-xl font-bold text-white mb-4">Token Balance</h2>
      
      {/* Token Switcher */}
      <div className="flex bg-gray-800 rounded-lg p-1 mb-6">
        <button
          onClick={() => setSelectedToken('XFI')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            selectedToken === 'XFI'
              ? 'bg-white text-black'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          XFI (Native)
        </button>
        <button
          onClick={() => setSelectedToken('cXFI')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            selectedToken === 'cXFI'
              ? 'bg-white text-black'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          cXFI (Token)
        </button>
      </div>

      {/* Both Balances Summary */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="text-sm text-gray-400 mb-3">All Balances</div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">XFI:</span>
            <span className="text-white font-medium">
              {xfiLoading ? 'Loading...' : xfiError ? 'Error' : `${formatBalance(xfiBalance?.value)} XFI`}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-300">cXFI:</span>
            <span className="text-white font-medium">
              {cxfiLoading ? 'Loading...' : cxfiError ? 'Error' : `${formatBalance(cxfiBalance)} cXFI`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}