'use client';
import React, { useState, useEffect } from 'react';
import { 
  useAccount, 
  useReadContract, 
  useWriteContract, 
  useWaitForTransactionReceipt, 
  // useBalance, 
  useReadContracts } from 'wagmi';
import { Abi, formatEther } from 'viem';
import { VotingAddress, VotingAbi } from '@/contractAddressAndABI';
<<<<<<< HEAD
import { toast } from 'react-toastify';

// Import components
import VotingHeader from '@/components/voting/VotingHeader';
import AnalyticsCards from '@/components/voting/AnalyticsCards';
import TabNavigation from '@/components/voting/TabNavigation';
import CreateProposalModal from '@/components/voting/CreateProposalModal';
import InsufficientBalanceWarning from '@/components/voting/InsufficientBalanceWarning';
import ProposalsList from '@/components/voting/ProposalsList';
=======
>>>>>>> 745f3bf (proposal creation failing. victor wants to check through)

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

const VotingDashboard = () => {
  const { address, isConnected } = useAccount();
  const [selectedTab, setSelectedTab] = useState('active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);

<<<<<<< HEAD
  // Contract reads
=======
>>>>>>> 745f3bf (proposal creation failing. victor wants to check through)
  const { data: activeProposalIds, refetch: refetchActiveProposals } = useReadContract({
    address: VotingAddress,
    abi: VotingAbi,
    functionName: 'getActiveProposals',
  });

<<<<<<< HEAD
=======
  const [proposals, setProposals] = useState<Proposal[]>([]);
>>>>>>> 745f3bf (proposal creation failing. victor wants to check through)
  const { data: proposalsData, refetch: refetchProposalsData } = useReadContracts({
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

<<<<<<< HEAD
=======
  useEffect(() => {
    const activeProposalId = (activeProposalIds as bigint[]) || [];
    if (proposalsData) {
      const parsed = proposalsData.map((p, i) => ({
        ...(p.result as Proposal),
        proposalId: activeProposalId[i],
      }));
      setProposals(parsed);
    }
  }, [proposalsData, activeProposalIds]);

>>>>>>> 745f3bf (proposal creation failing. victor wants to check through)
  const { data: votingPower } = useReadContract({
    address: VotingAddress,
    abi: VotingAbi,
    functionName: 'getVotingPower',
    args: [address],
  }) as { data: bigint | undefined };

<<<<<<< HEAD
=======
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

  useEffect(() => {
    if (createSuccess) {
      refetchActiveProposals();
      refetchProposalsData();
    }
  }, [createSuccess, refetchActiveProposals, refetchProposalsData]);

  const { data: balance } = useBalance({ address });

>>>>>>> 745f3bf (proposal creation failing. victor wants to check through)
  const { data: minSbftToPropose } = useReadContract({
    address: VotingAddress,
    abi: VotingAbi,
    functionName: 'MIN_SBFT_TO_PROPOSE',
  }) as { data: bigint | undefined };

  // const { data: balance } = useBalance({ address });

  // Contract writes
  const { writeContract, data: voteTxHash, error: voteError } = useWriteContract();
  const { isLoading: isVoting, isSuccess: voteSuccess } = useWaitForTransactionReceipt({ hash: voteTxHash });

  const { writeContract: createProposal, data: createTxHash, error: createError } = useWriteContract();
  const { isLoading: isCreating, isSuccess: createSuccess } = useWaitForTransactionReceipt({ hash: createTxHash });

  // Effects
  useEffect(() => {
    const activeProposalId = (activeProposalIds as bigint[]) || [];
    if (proposalsData) {
      const parsed = proposalsData.map((p, i) => ({
        ...(p.result as Proposal),
        proposalId: activeProposalId[i],
      }));
      setProposals(parsed);
    }
  }, [proposalsData, activeProposalIds]);

  useEffect(() => {
    if (createError) {
      toast.error('Failed to create proposal');
    }
  }, [createError]);

  useEffect(() => {
    if (voteError) {
      toast.error('Failed to submit vote');
    }
  }, [voteError]);

  useEffect(() => {
    if (createSuccess) {
      toast.success('Proposal created successfully!');
      refetchActiveProposals();
      refetchProposalsData();
    }
  }, [createSuccess, refetchActiveProposals, refetchProposalsData]);

  useEffect(() => {
    if (voteSuccess) {
      toast.success(`Vote submitted successfully with option: ${voteSuccess ? 'Yes' : 'No'}`);
      refetchProposalsData();
    }
  }, [voteSuccess, refetchProposalsData]);

  // Handlers
  const handleVote = async (proposalId: bigint, support: boolean) => {
    try {
      writeContract({
        address: VotingAddress,
        abi: VotingAbi,
        functionName: 'vote',
        args: [proposalId, support],
      });
      toast.info(`Submitting ${support ? 'Yes' : 'No'} vote...`);
    } catch (error) {
      console.error('Vote error:', error);
      toast.error('Failed to submit vote');
    }
  };

<<<<<<< HEAD
  const handleCreateProposal = async (newProposal: { title: string; description: string; type: string }) => {
    if (!newProposal.title || !newProposal.description) return;
    
    try {
      const proposalTypeNum = parseInt(newProposal.type);
      
      createProposal({
        address: VotingAddress,
        abi: VotingAbi,
        functionName: 'createProposal',
        args: [
          newProposal.title, 
          newProposal.description, 
          proposalTypeNum
        ],
        gas: BigInt(500000),
      });
      
      toast.info('Creating proposal...');
      setShowCreateModal(false);
    } catch (error) {
      console.error('Create proposal error:', error);
      toast.error('Failed to create proposal');
    }
  };

  const canCreateProposal = () => {
    if (!isConnected || !votingPower || !minSbftToPropose) return false;
    return Number(formatEther(votingPower)) >= Number(formatEther(minSbftToPropose));
=======
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
>>>>>>> 745f3bf (proposal creation failing. victor wants to check through)
  };

  if (!isConnected) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4 mt-16">
        <div className="text-center text-white">
          <h1 className="text-3xl font-bold mb-4">Governance</h1>
          <p className="text-gray-400">
            Please connect your wallet to exercise your power
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative py-25">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
<<<<<<< HEAD
        <VotingHeader
          isConnected={isConnected}
          canCreateProposal={canCreateProposal()}
          onCreateProposal={() => setShowCreateModal(true)}
        />

        <AnalyticsCards
          proposals={proposals}
          votingPower={votingPower}
        />

        <TabNavigation
          selectedTab={selectedTab}
          onTabChange={setSelectedTab}
        />
=======

        {/* Create Proposal Button */}
        <div className="flex justify-end mb-4">
          {isConnected && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-xl text-white"
            >
              <Plus className="w-5 h-5" />
              <span>Create Proposal</span>
            </button>
          )}
        </div>

        {/* Create Proposal Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-black/90 border border-white/10 rounded-2xl p-8 w-full max-w-md">
              <h2 className="text-2xl font-bold text-white mb-6">Create New Proposal</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-300">Title</label>
                  <input
                    type="text"
                    value={newProposal.title}
                    onChange={(e) => setNewProposal({ ...newProposal, title: e.target.value })}
                    className="w-full mt-1 p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter proposal title"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-300">Description</label>
                  <textarea
                    value={newProposal.description}
                    onChange={(e) => setNewProposal({ ...newProposal, description: e.target.value })}
                    className="w-full mt-1 p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter proposal description"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-300">Proposal Type</label>
                  <select
                    value={newProposal.type}
                    onChange={(e) => setNewProposal({ ...newProposal, type: e.target.value })}
                    className="w-full mt-1 p-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="0">Reward Rate Change</option>
                    <option value="1">Fee Change</option>
                    <option value="2">Parameter Change</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
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
>>>>>>> 745f3bf (proposal creation failing. victor wants to check through)

        <InsufficientBalanceWarning
          isConnected={isConnected}
          canCreateProposal={canCreateProposal()}
          minSbftToPropose={minSbftToPropose}
          votingPower={votingPower}
        />

        <CreateProposalModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateProposal}
          isCreating={isCreating}
        />

<<<<<<< HEAD
        <ProposalsList
          proposals={proposals}
          selectedTab={selectedTab}
          isConnected={isConnected}
          isVoting={isVoting}
          canCreateProposal={canCreateProposal()}
          onVote={handleVote}
          onCreateProposal={() => setShowCreateModal(true)}
        />
=======
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
            {isConnected && (
              <button
                onClick={() => { 
                  console.log('Button clicked, showCreateModal:', !showCreateModal); 
                  setShowCreateModal(true); 
                }}
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl transition-all duration-200 mx-auto text-white"
                disabled={typeof votingPower !== 'bigint' || typeof minSbftToPropose !== 'bigint' || Number(formatEther(votingPower)) < Number(formatEther(minSbftToPropose))}
              >
                <Plus className="w-5 h-5" />
                <span>Create First Proposal</span>
              </button>
            )}
          </div>
        )}
>>>>>>> 745f3bf (proposal creation failing. victor wants to check through)
      </div>
    </div>
  );
};

export default VotingDashboard;