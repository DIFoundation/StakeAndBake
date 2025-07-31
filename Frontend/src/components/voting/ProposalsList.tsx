import React from 'react';
import { Vote, Plus } from 'lucide-react';
import ProposalCard from './ProposalCard';

interface Proposal {
  id: bigint;
  title: string;
  description: string;
  proposer: string;
  startTime: bigint;
  endTime: bigint;
  hasVoted: boolean;
  userVote: boolean | null;
  yesVotes: bigint;
  noVotes: bigint;
  totalVotingPower: bigint;
  executed: boolean;
  passed: boolean;
  proposalType: number;
}

interface ProposalsListProps {
  proposals: Proposal[];
  selectedTab: string;
  isConnected: boolean;
  isVoting: boolean;
  canCreateProposal: boolean;
  onVote: (proposalId: bigint, support: boolean) => void;
  onCreateProposal: () => void;
}

const ProposalsList: React.FC<ProposalsListProps> = ({
  proposals,
  selectedTab,
  isConnected,
  isVoting,
  canCreateProposal,
  onVote,
  onCreateProposal,
}) => {
  const filteredProposals = proposals.filter(p => {
    if (selectedTab === 'active') {
      return !p.executed && Date.now() >= Number(p.startTime) * 1000 && Date.now() <= Number(p.endTime) * 1000;
    }
    if (selectedTab === 'ended') {
      return p.executed || Date.now() > Number(p.endTime) * 1000;
    }
    if (selectedTab === 'upcoming') {
      return Date.now() < Number(p.startTime) * 1000;
    }
    return true;
  });

  if (filteredProposals.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Vote className="w-8 h-8 text-gray-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No proposals found</h3>
        <p className="text-gray-400 font-medium mb-4">
          {selectedTab === 'active' 
            ? 'There are no active proposals at the moment.'
            : `No ${selectedTab} proposals to display.`
          }
        </p>
        {isConnected && canCreateProposal && (
          <button
            onClick={onCreateProposal}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 px-5 py-2.5 rounded-lg transition-colors mx-auto text-white font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Proposal</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredProposals.map((proposal) => (
        <ProposalCard
          key={Number(proposal.id)}
          proposal={proposal}
          isConnected={isConnected}
          isVoting={isVoting}
          onVote={onVote}
        />
      ))}
    </div>
  );
};

export default ProposalsList;