// hooks/useTransactionHistory.ts
import { useState, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { stakingContractAddress, stakingContractAbi } from '@/contractAddressAndABI';
import { parseEventLogs } from 'viem';

type Transaction = {
  id: string;
  type: 'Stake' | 'Unstake' | 'Claim' | 'Compound';
  amount: string;
  timestamp: number;
  status: 'Completed';
  blockNumber: number;
};

export function useTransactionHistory() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!address || !publicClient) return;

    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        // Get logs from the last 10,000 blocks (adjust as needed)
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock - 10000n;

        // Fetch all relevant events for the user
        const logs = await publicClient.getLogs({
          address: stakingContractAddress,
          events: [
            {
              type: 'event',
              name: 'Staked',
              inputs: [
                { name: 'user', type: 'address', indexed: true },
                { name: 'xfiAmount', type: 'uint256', indexed: false },
                { name: 'sbftAmount', type: 'uint256', indexed: false },
                { name: 'fee', type: 'uint256', indexed: false },
                { name: 'unlockTime', type: 'uint256', indexed: false }
              ]
            },
            {
              type: 'event',
              name: 'Unstaked',
              inputs: [
                { name: 'user', type: 'address', indexed: true },
                { name: 'xfiAmount', type: 'uint256', indexed: false },
                { name: 'sbftAmount', type: 'uint256', indexed: false }
              ]
            },
            {
              type: 'event',
              name: 'RewardsClaimed',
              inputs: [
                { name: 'user', type: 'address', indexed: true },
                { name: 'amount', type: 'uint256', indexed: false }
              ]
            },
            {
              type: 'event',
              name: 'RewardsCompounded',
              inputs: [
                { name: 'user', type: 'address', indexed: true },
                { name: 'amount', type: 'uint256', indexed: false }
              ]
            }
          ],
          args: {
            user: address
          },
          fromBlock,
          toBlock: 'latest'
        });

        // Process logs into transactions
        const processedTransactions = await Promise.all(
          logs.map(async (log) => {
            const block = await publicClient.getBlock({ blockHash: log.blockHash });
            
            let type: Transaction['type'] = 'Stake';
            let amount = '0';

            if (log.eventName === 'Staked') {
              type = 'Stake';
              amount = (Number(log.args.xfiAmount) / 1e18).toFixed(4);
            } else if (log.eventName === 'Unstaked') {
              type = 'Unstake';
              amount = (Number(log.args.xfiAmount) / 1e18).toFixed(4);
            } else if (log.eventName === 'RewardsClaimed') {
              type = 'Claim';
              amount = (Number(log.args.amount) / 1e18).toFixed(4);
            } else if (log.eventName === 'RewardsCompounded') {
              type = 'Compound';
              amount = (Number(log.args.amount) / 1e18).toFixed(4);
            }

            return {
              id: log.transactionHash,
              type,
              amount,
              timestamp: Number(block.timestamp) * 1000,
              status: 'Completed' as const,
              blockNumber: Number(log.blockNumber)
            };
          })
        );

        // Sort by timestamp (newest first)
        processedTransactions.sort((a, b) => b.timestamp - a.timestamp);
        setTransactions(processedTransactions);

      } catch (error) {
        console.error('Error fetching transaction history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [address, publicClient]);

  return { transactions, isLoading };
}