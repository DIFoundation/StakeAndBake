'use client';

import { useState, useEffect } from 'react';

type Props = {
  stakedAmount: string;
  sbftBalance: string; // This is now the wallet balance
  pendingRewards: string;
  unlockTime: number;
  lockPeriod: number;
  canUnstake: boolean;
  timeRemaining: number;
  apy: string;
  sbftInContract: string; // Amount recorded in staking contract
};

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function UserStakeInfo({
  stakedAmount,
  sbftBalance, // Wallet balance
  pendingRewards,
  unlockTime,
  lockPeriod,
  canUnstake,
  timeRemaining,
  apy,
  sbftInContract // Contract balance
}: Props) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!canUnstake && timeRemaining > 0) {
      const timer = setInterval(() => {
        const now = Math.floor(Date.now() / 1000);
        const remaining = unlockTime - now;
        
        if (remaining <= 0) {
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
          return;
        }

        const days = Math.floor(remaining / (24 * 60 * 60));
        const hours = Math.floor((remaining % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((remaining % (60 * 60)) / 60);
        const seconds = remaining % 60;

        setTimeLeft({ days, hours, minutes, seconds });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [unlockTime, canUnstake, timeRemaining]);

  const formatLockPeriod = (periodInSeconds: number): string => {
    const days = Math.floor(periodInSeconds / (24 * 60 * 60));
    if (days >= 365) return `${Math.floor(days / 365)} year(s)`;
    if (days >= 30) return `${Math.floor(days / 30)} month(s)`;
    if (days >= 7) return `${Math.floor(days / 7)} week(s)`;
    return `${days} day(s)`;
  };

  const unlockDate = new Date(unlockTime * 1000);

  return (
    <div className="bg-[#121212]/80 border border-[#3F3F46] text-white rounded-xl p-6 hover:shadow-lg transition mb-12">
      <h2 className="text-2xl font-semibold mb-6">Your Stake Details</h2>
      
      {parseFloat(stakedAmount) > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Stake Overview */}
          <div className="bg-[#1A1A1A] rounded-lg p-4 border border-[#3F3F46]">
            <h3 className="text-lg font-medium text-gray-300 mb-3">Stake Overview</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">XFI Staked:</span>
                <span className="text-white font-medium">{stakedAmount} XFI</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">sbFT in Wallet:</span>
                <span className="text-green-400 font-medium">{sbftBalance} sbFT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">sbFT from Stake:</span>
                <span className="text-blue-400 font-medium">{sbftInContract} sbFT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Current APY:</span>
                <span className="text-purple-400 font-medium">{apy}%</span>
              </div>
            </div>
          </div>

          {/* Lock Period Info */}
          <div className="bg-[#1A1A1A] rounded-lg p-4 border border-[#3F3F46]">
            <h3 className="text-lg font-medium text-gray-300 mb-3">Lock Period</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Lock Duration:</span>
                <span className="text-white font-medium">{formatLockPeriod(lockPeriod)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Unlock Date:</span>
                <span className="text-white font-medium">{unlockDate.toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className={`font-medium ${canUnstake ? 'text-green-400' : 'text-yellow-400'}`}>
                  {canUnstake ? 'Unlocked' : 'Locked'}
                </span>
              </div>
            </div>
          </div>

          {/* Countdown Timer */}
          <div className="bg-[#1A1A1A] rounded-lg p-4 border border-[#3F3F46]">
            <h3 className="text-lg font-medium text-gray-300 mb-3">
              {canUnstake ? 'Ready to Unstake' : 'Time Until Unlock'}
            </h3>
            {canUnstake ? (
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400 mb-2">✓ Unlocked</div>
                <p className="text-sm text-gray-400">You can now unstake your tokens</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-[#2A2A2A] rounded-lg p-2">
                  <div className="text-xl font-bold text-white">{timeLeft.days}</div>
                  <div className="text-xs text-gray-400">Days</div>
                </div>
                <div className="bg-[#2A2A2A] rounded-lg p-2">
                  <div className="text-xl font-bold text-white">{timeLeft.hours}</div>
                  <div className="text-xs text-gray-400">Hours</div>
                </div>
                <div className="bg-[#2A2A2A] rounded-lg p-2">
                  <div className="text-xl font-bold text-white">{timeLeft.minutes}</div>
                  <div className="text-xs text-gray-400">Minutes</div>
                </div>
                <div className="bg-[#2A2A2A] rounded-lg p-2">
                  <div className="text-xl font-bold text-white">{timeLeft.seconds}</div>
                  <div className="text-xs text-gray-400">Seconds</div>
                </div>
              </div>
            )}
          </div>

          {/* Rewards Section */}
          <div className="bg-[#1A1A1A] rounded-lg p-4 border border-[#3F3F46] md:col-span-2 lg:col-span-3">
            <h3 className="text-lg font-medium text-gray-300 mb-3">Rewards Information</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{pendingRewards} XFI</div>
                <div className="text-sm text-gray-400">Pending Rewards</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {(parseFloat(stakedAmount) * parseFloat(apy) / 100 / 12).toFixed(4)} XFI
                </div>
                <div className="text-sm text-gray-400">Monthly Estimate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {(parseFloat(stakedAmount) * parseFloat(apy) / 100).toFixed(4)} XFI
                </div>
                <div className="text-sm text-gray-400">Yearly Estimate</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-medium text-gray-300 mb-2">No Active Stakes</h3>
          <p className="text-gray-400">Start staking to see your stake details here</p>
        </div>
      )}
    </div>
  );
}