'use client';
import React, { useState, useEffect } from 'react';
import { Clock, Users, TrendingUp, Plus, Check, X, AlertCircle, Vote, Calendar, Target } from 'lucide-react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useBalance, useReadContracts } from 'wagmi';
import { Abi, formatEther } from 'viem';
import { VotingAddress, VotingAbi } from '@/contractAddressAndABI';
// import { parseEther } from 'viem';

interface Proposal {
  id: bigint;
  title: string;
  description: string;
  proposer: string;
  startTime: bigint;
  endTime: bigint;
  hasVoted: boolean;
  userVote: boolean | null; // null if not voted
  yesVotes: bigint;
  noVotes: bigint;
  totalVotingPower: bigint;
  executed: boolean;
  passed: boolean;
  proposalType: number;
}

const VotingDashboard = () => {
  const { address, isConnected } = useAccount();
  const [selectedTab, setSelectedTab] = useState('active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProposal, setNewProposal] = useState({ title: '', description: '', type: '0' });

  // Fetch active proposals
  const { data: activeProposalIds } = useReadContract({
    address: VotingAddress,
    abi: VotingAbi,
    functionName: 'getActiveProposals',
  });
  

  // Fetch all proposals
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const { data: proposalsData } = useReadContracts({
  contracts: (activeProposalIds as bigint[] || []).map((id) => ({
    address: VotingAddress as `0x${string}`,
    abi: VotingAbi as Abi,
    functionName: 'getProposal',
    args: [id],
  })),
  query: {
    enabled: !!activeProposalIds && (activeProposalIds as bigint[]).length > 0,
  },
});

useEffect(() => {
  const activeProposalId = (activeProposalIds as bigint[]) || [];

  if (proposalsData) {
    const parsed = proposalsData.map((p, i) => ({
  ...(p.result as Proposal),
  proposalId: activeProposalId[i], // use a different name
}));
    setProposals(parsed);
  }
}, [proposalsData, activeProposalIds]);

  // Fetch user's voting power
  const { data: votingPower } = useReadContract({
    address: VotingAddress,
    abi: VotingAbi,
    functionName: 'getVotingPower',
    args: [address],
  });

  // Handle voting
  const { writeContract, data: voteTxHash } = useWriteContract();
  const { isLoading: isVoting, isSuccess: voteSuccess } = useWaitForTransactionReceipt({ hash: voteTxHash });

  const handleVote = async (proposalId: bigint, support: boolean) => {
    writeContract({
      address: VotingAddress,
      abi: VotingAbi,
      functionName: 'vote',
      args: [proposalId, support],
    });
  };

  // Handle proposal creation
  const { writeContract: createProposal, data: createTxHash } = useWriteContract();
  const { isLoading: isCreating, isSuccess: createSuccess } = useWaitForTransactionReceipt({ hash: createTxHash });

  const handleCreateProposal = async () => {
    if (!newProposal.title || !newProposal.description) return;
    createProposal({
      address: VotingAddress,
      abi: VotingAbi,
      functionName: 'createProposal',
      args: [newProposal.title, newProposal.description, parseInt(newProposal.type)],
    });
    setShowCreateModal(false);
    setNewProposal({ title: '', description: '', type: '0' });
  };

  // Fetch user balance
  const { data: balance } = useBalance({ address });

  // Constants from contract
  const { data: minSbftToPropose } = useReadContract({
    address: VotingAddress,
    abi: VotingAbi,
    functionName: 'MIN_SBFT_TO_PROPOSE',
  });

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
    const quorumRequired = Number(proposal.totalVotingPower) * 0.1; // Assuming 10% quorum from contract
    return Math.min((totalVotes / quorumRequired) * 100, 100);
  };

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

  return (
    <div className="min-h-screen relative py-25">
      {/* Header */}
      

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Active Proposals', value: filteredProposals.length, icon: TrendingUp, color: 'from-blue-500 to-cyan-500' },
            { label: 'Total Voters', value: '1,247', icon: Users, color: 'from-purple-500 to-pink-500' },
            { label: 'Total Votes Cast', value: '48,392', icon: Target, color: 'from-green-500 to-emerald-500' },
            { label: 'Participation Rate', value: '67%', icon: Calendar, color: 'from-orange-500 to-red-500' }
          ].map((stat, idx) => (
            <div key={idx} className="group relative overflow-hidden rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 p-6 hover:bg-black/50 transition-all duration-300 transform hover:scale-105">
              <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="w-8 h-8 text-gray-400 group-hover:text-white transition-colors duration-300" />
                  <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl opacity-20 group-hover:opacity-30 transition-opacity duration-300`}></div>
                </div>
                <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex space-x-1 bg-black/40 backdrop-blur-xl rounded-xl p-1 border border-white/10">
            {[
              { id: 'active', label: 'Active', count: filteredProposals.length },
              { id: 'ended', label: 'Ended', count: proposals.filter(p => p.executed || Date.now() > Number(p.endTime) * 1000).length },
              { id: 'upcoming', label: 'Upcoming', count: proposals.filter(p => Date.now() < Number(p.startTime) * 1000).length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                  selectedTab === tab.id
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  selectedTab === tab.id ? 'bg-white/20' : 'bg-white/20'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          
          {(typeof votingPower === 'bigint' || typeof votingPower === 'number' || typeof votingPower === 'string') &&
            (typeof minSbftToPropose === 'bigint' || typeof minSbftToPropose === 'number' || typeof minSbftToPropose === 'string') &&
            Number(formatEther(votingPower as bigint)) >= Number(formatEther(minSbftToPropose as bigint)) ? (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-xl text-white"
            >
              <Plus className="w-5 h-5" />
              <span>Create Proposal</span>
            </button>
          ) : null}
        </div>

        {/* Create Proposal Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-black/80 border border-white/10 rounded-2xl p-8 w-full max-w-md">
              <h2 className="text-2xl font-bold text-white mb-6">Create New Proposal</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-300">Title</label>
                  <input
                    type="text"
                    value={newProposal.title}
                    onChange={(e) => setNewProposal({ ...newProposal, title: e.target.value })}
                    className="w-full mt-1 p-3 bg-gray-800/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter proposal title"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-300">Description</label>
                  <textarea
                    value={newProposal.description}
                    onChange={(e) => setNewProposal({ ...newProposal, description: e.target.value })}
                    className="w-full mt-1 p-3 bg-gray-800/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter proposal description"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-300">Proposal Type</label>
                  <select
                    value={newProposal.type}
                    onChange={(e) => setNewProposal({ ...newProposal, type: e.target.value })}
                    className="w-full mt-1 p-3 bg-gray-800/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="0">Reward Rate Change</option>
                    <option value="1">Fee Change</option>
                    <option value="2">Parameter Change</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateProposal}
                    disabled={isCreating}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50"
                  >
                    {isCreating ? 'Creating...' : 'Create Proposal'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Proposals Grid */}
        <div className="grid gap-6">
          {filteredProposals.map((proposal, idx) => (
            <div key={Number(proposal.id)} className="group relative overflow-hidden rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 hover:bg-black/50 transition-all duration-300 transform hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal)} bg-current/10`}>
                        {getStatusText(proposal)}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium text-gray-400 bg-gray-700/50">
                        #{Number(proposal.id)}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium text-purple-400 bg-purple-500/10">
                        {['Reward Rate Change', 'Fee Change', 'Parameter Change'][proposal.proposalType]}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors duration-200">
                      {proposal.title}
                    </h3>
                    <p className="text-gray-300 mb-4 leading-relaxed">
                      {proposal.description}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>by {proposal.proposer.slice(0, 8)}...</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{getTimeRemaining(proposal.endTime)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Voting Progress */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">Voting Progress</span>
                    <span className="text-sm text-purple-400">
                      {Math.round(calculateQuorum(proposal))}% Quorum
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="relative">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-green-400">Yes ({formatEther(proposal.yesVotes)})</span>
                        <span className="text-sm text-green-400">
                          {Number(proposal.yesVotes) + Number(proposal.noVotes) > 0 
                            ? Math.round((Number(proposal.yesVotes) / (Number(proposal.yesVotes) + Number(proposal.noVotes))) * 100)
                            : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-700/50 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-1000 ease-out"
                          style={{ 
                            width: `${Number(proposal.yesVotes) + Number(proposal.noVotes) > 0 
                              ? (Number(proposal.yesVotes) / (Number(proposal.yesVotes) + Number(proposal.noVotes))) * 100 
                              : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-red-400">No ({formatEther(proposal.noVotes)})</span>
                        <span className="text-sm text-red-400">
                          {Number(proposal.yesVotes) + Number(proposal.noVotes) > 0 
                            ? Math.round((Number(proposal.noVotes) / (Number(proposal.yesVotes) + Number(proposal.noVotes))) * 100)
                            : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-700/50 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full transition-all duration-1000 ease-out"
                          style={{ 
                            width: `${Number(proposal.yesVotes) + Number(proposal.noVotes) > 0 
                              ? (Number(proposal.noVotes) / (Number(proposal.yesVotes) + Number(proposal.noVotes))) * 100 
                              : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Voting Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {isConnected && (
                      <div className="flex items-center space-x-2 text-sm">
                        <div className={`w-2 h-2 rounded-full ${proposal.hasVoted ? (proposal.userVote ? 'bg-green-400' : 'bg-red-400') : 'bg-gray-400'}`}></div>
                        <span className="text-gray-400">
                          {proposal.hasVoted ? `You voted ${proposal.userVote ? 'Yes' : 'No'}` : 'Not voted'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {!proposal.hasVoted && Date.now() >= Number(proposal.startTime) * 1000 && Date.now() <= Number(proposal.endTime) * 1000 && isConnected && (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleVote(proposal.id, false)}
                        disabled={isVoting}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-xl transition-all duration-200 transform hover:scale-105 border border-red-600/30 disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        <span>{isVoting ? 'Voting...' : 'Vote No'}</span>
                      </button>
                      <button
                        onClick={() => handleVote(proposal.id, true)}
                        disabled={isVoting}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-xl transition-all duration-200 transform hover:scale-105 border border-green-600/30 disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        <span>{isVoting ? 'Voting...' : 'Vote Yes'}</span>
                      </button>
                    </div>
                  )}
                  
                  {(proposal.executed || Date.now() > Number(proposal.endTime) * 1000) && (
                    <div className="flex items-center space-x-2 text-sm">
                      <AlertCircle className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400">Voting ended</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProposals.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Vote className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No proposals found</h3>
            <p className="text-gray-400 mb-6">
              {selectedTab === 'active' 
                ? 'There are no active proposals at the moment.'
                : `No ${selectedTab} proposals to display.`
              }
            </p>
            {(typeof votingPower === 'bigint' || typeof votingPower === 'number' || typeof votingPower === 'string') &&
              (typeof minSbftToPropose === 'bigint' || typeof minSbftToPropose === 'number' || typeof minSbftToPropose === 'string') &&
              Number(formatEther(votingPower as bigint)) >= Number(formatEther(minSbftToPropose as bigint)) &&
              selectedTab === 'active' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl transition-all duration-200 mx-auto text-white"
              >
                <Plus className="w-5 h-5" />
                <span>Create First Proposal</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VotingDashboard;