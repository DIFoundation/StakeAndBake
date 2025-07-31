import React from 'react';
import { Plus } from 'lucide-react';

interface VotingHeaderProps {
  isConnected: boolean;
  canCreateProposal: boolean;
  onCreateProposal: () => void;
}

const VotingHeader: React.FC<VotingHeaderProps> = ({
  isConnected,
  canCreateProposal,
  onCreateProposal,
}) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">Governance</h1>
        <p className="text-gray-400 font-medium">Vote on proposals that shape the future of the protocol</p>
      </div>
      {isConnected && (
        <button 
          onClick={onCreateProposal}
          disabled={!canCreateProposal}
          className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 px-5 py-2.5 rounded-lg transition-colors duration-200 text-white disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span>New Proposal</span>
        </button>
      )}
    </div>
  );
};

export default VotingHeader;