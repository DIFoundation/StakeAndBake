// hooks/useTransactionHistory.ts
import { useState, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { stakingContractAddress, stakingContractAbi } from '@/contractAddressAndABI';
// import { parseEventLogs, decodeEventLog } from 'viem';

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address || !publicClient) {
      console.log('Missing requirements:', { address: !!address, publicClient: !!publicClient });
      return;
    }

    const fetchTransactions = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Connected address:', address);
        console.log('Contract address:', stakingContractAddress);
        
        // Get current block number
        const currentBlock = await publicClient.getBlockNumber();
        console.log('Current block number:', currentBlock.toString());
        
        // Test contract connectivity first
        try {
          const totalStaked = await publicClient.readContract({
            address: stakingContractAddress,
            abi: stakingContractAbi,
            functionName: 'totalStaked',
          });
          console.log('Contract is accessible. Total staked:', totalStaked);
        } catch (contractError) {
          console.error('Contract not accessible:', contractError);
          throw new Error('Cannot connect to staking contract');
        }

        // Check available events in ABI
        const eventAbis = stakingContractAbi.filter(abi => abi.type === 'event');
        console.log('Available events:', eventAbis.map(e => e.name));
        
        // Define the events we're looking for
        const eventNames = ['Staked', 'Unstaked', 'RewardsClaimed', 'RewardsCompounded'];
        
        // Set reasonable block range (last 100,000 blocks or from deployment)
        const maxBlockRange = 100000n;
        const fromBlock = currentBlock > maxBlockRange ? currentBlock - maxBlockRange : 0n;
        
        console.log(`Querying logs from block ${fromBlock} to ${currentBlock}`);
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let allLogs: any[] = [];
        
        // Try to get all logs at once first, then fallback to batching if needed
        try {
          console.log('Attempting to fetch all logs at once...');
          
          // Get logs for each event type separately to avoid complex filtering issues
          for (const eventName of eventNames) {
            const eventAbi = eventAbis.find(e => e.name === eventName);
            if (!eventAbi) {
              console.warn(`Event ${eventName} not found in ABI`);
              continue;
            }
            
            console.log(`Fetching ${eventName} events...`);
            
            try {
              const logs = await publicClient.getLogs({
                address: stakingContractAddress as `0x${string}`,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                event: eventAbi as any,
                args: {
                  user: address, // This assumes the first indexed parameter is 'user'
                },
                fromBlock: fromBlock,
                toBlock: currentBlock,
              });
              
              console.log(`Found ${logs.length} ${eventName} events for user ${address}`);
              allLogs = [...allLogs, ...logs];
              
            } catch (eventError) {
              console.error(`Error fetching ${eventName} events:`, eventError);
              
              // Try without the user filter (get all events, then filter manually)
              try {
                console.log(`Retrying ${eventName} without user filter...`);
                const allEventLogs = await publicClient.getLogs({
                  address: stakingContractAddress as `0x${string}`,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  event: eventAbi as any,
                  fromBlock: fromBlock,
                  toBlock: currentBlock,
                });
                
                // Manually filter for the user
                const userLogs = allEventLogs.filter(log => {
                  const args = log as unknown as { user: string };
                  return args?.user?.toLowerCase() === address.toLowerCase();
                });
                
                console.log(`Found ${userLogs.length} ${eventName} events for user after manual filtering`);
                allLogs = [...allLogs, ...userLogs];
                
              } catch (retryError) {
                console.error(`Retry failed for ${eventName}:`, retryError);
              }
            }
          }
          
        } catch (batchError) {
          console.error('Batch fetch failed:', batchError);
          throw batchError;
        }

        console.log(`Total logs collected: ${allLogs.length}`);
        
        if (allLogs.length === 0) {
          console.log('No transactions found for this address');
          setTransactions([]);
          return;
        }

        // Process logs into transactions
        const processedTransactions: Transaction[] = [];
        
        for (const log of allLogs) {
          try {
            console.log('Processing log:', {
              eventName: log.eventName,
              transactionHash: log.transactionHash,
              blockNumber: log.blockNumber,
              args: log.args
            });
            
            // Get block information for timestamp
            const block = await publicClient.getBlock({ 
              blockNumber: log.blockNumber 
            });
            
            let type: Transaction['type'];
            let amount = '0';
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const args = log.args as any;
            
            switch (log.eventName) {
              case 'Staked':
                type = 'Stake';
                // Try different possible parameter names
                amount = formatAmount(args.xfiAmount || args.amount || args.value || '0');
                break;
                
              case 'Unstaked':
                type = 'Unstake';
                amount = formatAmount(args.xfiAmount || args.amount || args.value || '0');
                break;
                
              case 'RewardsClaimed':
                type = 'Claim';
                amount = formatAmount(args.amount || args.rewardAmount || args.value || '0');
                break;
                
              case 'RewardsCompounded':
                type = 'Compound';
                amount = formatAmount(args.amount || args.rewardAmount || args.value || '0');
                break;
                
              default:
                console.warn('Unknown event type:', log.eventName);
                continue;
            }

            const transaction: Transaction = {
              id: log.transactionHash,
              type,
              amount,
              timestamp: Number(block.timestamp) * 1000,
              status: 'Completed',
              blockNumber: Number(log.blockNumber)
            };
            
            processedTransactions.push(transaction);
            console.log('Successfully processed transaction:', transaction);
            
          } catch (logError) {
            console.error('Error processing individual log:', logError);
            console.error('Problematic log:', log);
          }
        }

        // Sort by block number (most recent first)
        processedTransactions.sort((a, b) => b.blockNumber - a.blockNumber);
        
        console.log(`Successfully processed ${processedTransactions.length} transactions`);
        setTransactions(processedTransactions);
    
      } catch (error) {
        console.error('=== Transaction History Fetch Failed ===');
        console.error('Error details:', error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [address, publicClient]);

  return { transactions, isLoading, error };
}

// Helper function to format amounts from wei to readable format
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatAmount(value: any): string {
  try {
    if (!value) return '0.0000';
    
    // Handle BigInt
    if (typeof value === 'bigint') {
      return (Number(value) / 1e18).toFixed(4);
    }
    
    // Handle string
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return (num / 1e18).toFixed(4);
    }
    
    // Handle number
    if (typeof value === 'number') {
      return (value / 1e18).toFixed(4);
    }
    
    console.warn('Unknown value type for amount:', typeof value, value);
    return '0.0000';
    
  } catch (error) {
    console.error('Error formatting amount:', error);
    return '0.0000';
  }
}