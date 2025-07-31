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
import { toast } from 'react-toastify';

// Import components
import VotingHeader from '@/components/voting/VotingHeader';
import AnalyticsCards from '@/components/voting/AnalyticsCards';
import TabNavigation from '@/components/voting/TabNavigation';
import CreateProposalModal from '@/components/voting/CreateProposalModal';
import InsufficientBalanceWarning from '@/components/voting/InsufficientBalanceWarning';
import ProposalsList from '@/components/voting/ProposalsList';

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

  // Contract reads
  const { data: activeProposalIds, refetch: refetchActiveProposals } = useReadContract({
    address: VotingAddress,
    abi: VotingAbi,
    functionName: 'getActiveProposals',
  });

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

  const { data: votingPower } = useReadContract({
    address: VotingAddress,
    abi: VotingAbi,
    functionName: 'getVotingPower',
    args: [address],
  }) as { data: bigint | undefined };

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

        <ProposalsList
          proposals={proposals}
          selectedTab={selectedTab}
          isConnected={isConnected}
          isVoting={isVoting}
          canCreateProposal={canCreateProposal()}
          onVote={handleVote}
          onCreateProposal={() => setShowCreateModal(true)}
        />
      </div>
    </div>
  );
};

export default VotingDashboard;