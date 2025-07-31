import React from 'react';
import { Vote, Target, TrendingUp, Users } from 'lucide-react';
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

interface AnalyticsCardsProps {
  proposals: Proposal[];
  votingPower: bigint | undefined;
}

const AnalyticsCards: React.FC<AnalyticsCardsProps> = ({ proposals, votingPower }) => {
  const activeProposalsCount = proposals.filter(
    p => !p.executed && Date.now() >= Number(p.startTime) * 1000 && Date.now() <= Number(p.endTime) * 1000
  ).length;

  const participationRate = proposals.length > 0 
    ? Math.round((proposals.filter(p => p.hasVoted).length / proposals.length) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm font-medium">Active Proposals</p>
            <p className="text-2xl font-bold text-white">{activeProposalsCount}</p>
          </div>
          <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <Vote className="w-4 h-4 text-purple-400" />
          </div>
        </div>
      </div>

      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm font-medium">Total Proposals</p>
            <p className="text-2xl font-bold text-white">{proposals.length}</p>
          </div>
          <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">
            <Target className="w-4 h-4 text-indigo-400" />
          </div>
        </div>
      </div>

      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm font-medium">Your Voting Power</p>
            <p className="text-2xl font-bold text-white">
              {votingPower ? parseFloat(formatEther(votingPower)).toFixed(0) : '0'}
            </p>
          </div>
          <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-violet-400" />
          </div>
        </div>
      </div>

      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm font-medium">Participation Rate</p>
            <p className="text-2xl font-bold text-white">{participationRate}%</p>
          </div>
          <div className="w-8 h-8 bg-fuchsia-500/20 rounded-lg flex items-center justify-center">
            <Users className="w-4 h-4 text-fuchsia-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCards;