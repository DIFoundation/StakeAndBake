// Create this as a separate component: components/DebugUnstaking.tsx
"use client";

import { useAccount, useReadContract } from "wagmi";
import { stakingContractAbi, stakingContractAddress } from "@/contractAddressAndABI";

// Define the type for unstake request
type UnstakeRequest = bigint;

export default function DebugUnstaking() {
  const { address } = useAccount();

  const { data: userUnstakeRequests, error, isLoading } = useReadContract({
    address: stakingContractAddress,
    abi: stakingContractAbi,
    functionName: "getUserUnstakeRequests",
    args: [address as `0x${string}`],
    query: { 
      enabled: !!address,
      refetchInterval: 5000
    }
  }) as { data: UnstakeRequest[] | undefined, error: Error | null, isLoading: boolean };

  return (
    <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-4">
      <h3 className="text-red-400 font-bold mb-2">🐛 DEBUG COMPONENT</h3>
      <div className="text-sm text-white space-y-1">
        <p><strong>Address:</strong> {address || "Not connected"}</p>
        <p><strong>Contract:</strong> {stakingContractAddress}</p>
        <p><strong>Loading:</strong> {isLoading ? "YES" : "NO"}</p>
        <p><strong>Error:</strong> {error ? error.message : "None"}</p>
        <p><strong>Raw Data:</strong> {userUnstakeRequests ? `Array with ${userUnstakeRequests.length} items` : "null/undefined"}</p>
        <p><strong>Data Type:</strong> {typeof userUnstakeRequests}</p>
        <p><strong>Is Array:</strong> {Array.isArray(userUnstakeRequests) ? "YES" : "NO"}</p>
        <p><strong>Length:</strong> {userUnstakeRequests?.length || "undefined"}</p>
        {userUnstakeRequests && Array.isArray(userUnstakeRequests) && (
          <div>
            <p><strong>Individual Requests:</strong></p>
            {userUnstakeRequests.map((id, index) => (
              <p key={index} className="ml-4">#{index}: {id.toString()}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}   