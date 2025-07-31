import React from 'react';
import { Clock, Users, Check, X, AlertCircle } from 'lucide-react';
import { formatEther } from 'viem';

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

interface ProposalCardProps {
  proposal: Proposal;
  isConnected: boolean;
  isVoting: boolean;
  onVote: (proposalId: bigint, support: boolean) => void;
}

const ProposalCard: React.FC<ProposalCardProps> = ({
  proposal,
  isConnected,
  isVoting,
  onVote,
}) => {
  const getStatusColor = (proposal: Proposal) => {
    if (proposal.executed) {
      return proposal.passed ? 'text-green-400' : 'text-red-400';
    }
    if (Date.now() > Number(proposal.endTime) * 1000) {
      return 'text-yellow-400';
    }
    return 'text-blue-400';
  };

  const getStatusText = (proposal: Proposal) => {
    if (proposal.executed) {
      return proposal.passed ? 'Passed' : 'Failed';
    }
    if (Date.now() > Number(proposal.endTime) * 1000) {
      return 'Ended';
    }
    if (Date.now() < Number(proposal.startTime) * 1000) {
      return 'Upcoming';
    }
    return 'Active';
  };

  const getTimeRemaining = (endTime: bigint) => {
    const now = Date.now();
    const diff = Number(endTime) * 1000 - now;
    if (diff <= 0) return 'Ended';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const calculateQuorum = (proposal: Proposal) => {
    const totalVotes = Number(proposal.yesVotes) + Number(proposal.noVotes);
    const quorumRequired = Number(proposal.totalVotingPower) * 0.1;
    return Math.min((totalVotes / quorumRequired) * 100, 100);
  };

  const isVotingActive = Date.now() >= Number(proposal.startTime) * 1000 && 
                       Date.now() <= Number(proposal.endTime) * 1000;
  
  const isVotingEnded = proposal.executed || Date.now() > Number(proposal.endTime) * 1000;

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:bg-gray-900/70 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(proposal)} bg-current/10`}>
              {getStatusText(proposal)}
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-medium text-gray-400 bg-gray-700/50">
              #{Number(proposal.id)}
            </span>
            <span className="px-2 py-0.5 rounded text-sm font-semibold text-purple-400 bg-purple-500/10">
              {['Reward Rate', 'Fee Change', 'Parameter', 'General'][proposal.proposalType]}
            </span>
          </div>
          
          <h3 className="text-lg font-bold text-white mb-1">{proposal.title}</h3>
          <p className="text-gray-300 font-medium mb-2 line-clamp-1">{proposal.description}</p>
          
          <div className="flex items-center space-x-3 text-sm text-gray-500 font-medium">
            <div className="flex items-center space-x-1">
              <Users className="w-3 h-3" />
              <span>by {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{getTimeRemaining(proposal.endTime)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Voting Progress */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center space-x-3 text-sm font-semibold">
            <span className="text-green-400">
              For: {parseFloat(formatEther(proposal.yesVotes)).toFixed(0)}
              ({Number(proposal.yesVotes) + Number(proposal.noVotes) > 0 
                ? Math.round((Number(proposal.yesVotes) / (Number(proposal.yesVotes) + Number(proposal.noVotes))) * 100)
                : 0}%)
            </span>
            <span className="text-red-400">
              Against: {parseFloat(formatEther(proposal.noVotes)).toFixed(0)}
              ({Number(proposal.yesVotes) + Number(proposal.noVotes) > 0 
                ? Math.round((Number(proposal.noVotes) / (Number(proposal.yesVotes) + Number(proposal.noVotes))) * 100)
                : 0}%)
            </span>
          </div>
          <span className="text-sm text-gray-400 font-semibold">
            Quorum: {Math.round(calculateQuorum(proposal))}%
          </span>
        </div>
        
        <div className="w-full bg-gray-700/50 rounded-full h-1.5">
          <div className="flex h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-green-500 transition-all duration-300"
              style={{ 
                width: `${Number(proposal.yesVotes) + Number(proposal.noVotes) > 0 
                  ? (Number(proposal.yesVotes) / (Number(proposal.yesVotes) + Number(proposal.noVotes))) * 100 
                  : 0}%` 
              }}
            />
            <div 
              className="bg-red-500 transition-all duration-300"
              style={{ 
                width: `${Number(proposal.yesVotes) + Number(proposal.noVotes) > 0 
                  ? (Number(proposal.noVotes) / (Number(proposal.yesVotes) + Number(proposal.noVotes))) * 100 
                  : 0}%` 
              }}
            />
          </div>
        </div>
      </div>

      {/* Voting Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isConnected && proposal.hasVoted && (
            <div className="flex items-center space-x-1 text-sm font-semibold">
              <div className={`w-2 h-2 rounded-full ${proposal.userVote ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-gray-400">
                You voted {proposal.userVote ? 'For' : 'Against'}
              </span>
            </div>
          )}
        </div>
        
        {!proposal.hasVoted && isVotingActive && isConnected && (
          <div className="flex space-x-2">
            <button
              onClick={() => onVote(proposal.id, false)}
              disabled={isVoting}
              className="flex items-center space-x-1 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded border border-red-600/30 disabled:opacity-50 text-sm font-semibold transition-colors"
            >
              <X className="w-3 h-3" />
              <span>{isVoting ? 'Voting...' : 'Against'}</span>
            </button>
            <button
              onClick={() => onVote(proposal.id, true)}
              disabled={isVoting}
              className="flex items-center space-x-1 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded border border-green-600/30 disabled:opacity-50 text-sm font-semibold transition-colors"
            >
              <Check className="w-3 h-3" />
              <span>{isVoting ? 'Voting...' : 'For'}</span>
            </button>
          </div>
        )}
        
        {isVotingEnded && (
          <div className="flex items-center space-x-1 text-sm text-gray-500 font-semibold">
            <AlertCircle className="w-3 h-3" />
            <span>Voting ended</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProposalCard;