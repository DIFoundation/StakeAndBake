import React from 'react';
import { AlertCircle } from 'lucide-react';
import { formatEther } from 'viem';

interface InsufficientBalanceWarningProps {
  isConnected: boolean;
  canCreateProposal: boolean;
  minSbftToPropose: bigint | undefined;
  votingPower: bigint | undefined;
}

const InsufficientBalanceWarning: React.FC<InsufficientBalanceWarningProps> = ({
  isConnected,
  canCreateProposal,
  minSbftToPropose,
  votingPower,
}) => {
  if (!isConnected || canCreateProposal) return null;

  return (
    <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
      <div className="flex items-center space-x-2 text-yellow-400 text-sm">
        <AlertCircle className="w-4 h-4" />
        <span>
          You need at least {minSbftToPropose ? formatEther(minSbftToPropose) : '1000'} sbFT tokens to create a proposal. 
          Current balance: {votingPower ? formatEther(votingPower) : '0'} sbFT
        </span>
      </div>
    </div>
  );
};

export default InsufficientBalanceWarning;