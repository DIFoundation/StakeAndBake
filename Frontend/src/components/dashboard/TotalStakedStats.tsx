'use client';

type Props = {
  totalBals: string;
  totalStaked: string;
  rewardsEarned: string;
  apy: string;
  nextRewardDate: string;
  balance: string;
  totalStakedContract: string;
  totalFeesCollected: string;
  estimatedYearlyEarnings: string;
  estimatedMonthlyEarnings: string;
  sbftWalletBalance: string;
};

export default function TotalStakedStats({ 
  totalBals, 
  totalStaked, 
  rewardsEarned, 
  apy, 
  nextRewardDate, 
  balance,
  totalStakedContract,
  totalFeesCollected,
  estimatedYearlyEarnings,
  estimatedMonthlyEarnings,
  sbftWalletBalance
}: Props) {
  return (
    <div className="bg-[#121212]/80 border border-[#3F3F46] text-white rounded-xl p-6 hover:shadow-lg transition grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
      <div className="card">
        <h3 className="text-lg font-medium text-gray-400 mb-2">XFI Balance</h3>
        <p className="text-2xl font-bold">{totalBals} XFI</p>
        <p className="text-sm text-gray-400 mt-2">Available to stake</p>
      </div>

      <div className="card">
        <h3 className="text-lg font-medium text-gray-400 mb-2">Your Staked</h3>
        <p className="text-2xl font-bold">{totalStaked} XFI</p>
        <p className="text-sm text-gray-400 mt-2">Currently staked</p>
      </div>

      <div className="card">
        <h3 className="text-lg font-medium text-gray-400 mb-2">XFI Balance</h3>
        <p className="text-2xl font-bold">{balance} XFI</p>
        <p className="text-sm text-gray-400 mt-2">For gas fees</p>
      </div>

      <div className="card">
        <h3 className="text-lg font-medium text-gray-400 mb-2">sbFT Balance</h3>
        <p className="text-2xl font-bold text-green-400">{sbftWalletBalance} sbFT</p>
        <p className="text-sm text-gray-400 mt-2">In your wallet</p>
      </div>

      <div className="card">
        <h3 className="text-lg font-medium text-gray-400 mb-2">Claimable Rewards</h3>
        <p className="text-2xl font-bold text-green-400">{rewardsEarned} XFI</p>
        <p className="text-sm text-gray-400 mt-2">Ready to claim</p>
      </div>

      <div className="card">
        <h3 className="text-lg font-medium text-gray-400 mb-2">Current APY</h3>
        <p className="text-2xl font-bold text-purple-400">{apy}%</p>
        <p className="text-sm text-gray-400 mt-2">Annual Percentage Yield</p>
      </div>

      <div className="card">
        <h3 className="text-lg font-medium text-gray-400 mb-2">Monthly Earnings</h3>
        <p className="text-2xl font-bold text-blue-400">{estimatedMonthlyEarnings} XFI</p>
        <p className="text-sm text-gray-400 mt-2">Estimated monthly</p>
      </div>

      <div className="card">
        <h3 className="text-lg font-medium text-gray-400 mb-2">Yearly Earnings</h3>
        <p className="text-2xl font-bold text-yellow-400">{estimatedYearlyEarnings} XFI</p>
        <p className="text-sm text-gray-400 mt-2">Estimated yearly</p>
      </div>

      <div className="card">
        <h3 className="text-lg font-medium text-gray-400 mb-2">Total Protocol Staked</h3>
        <p className="text-2xl font-bold">{totalStakedContract} XFI</p>
        <p className="text-sm text-gray-400 mt-2">Protocol total</p>
      </div>

      <div className="card">
        <h3 className="text-lg font-medium text-gray-400 mb-2">Total Fees Collected</h3>
        <p className="text-2xl font-bold text-orange-400">{totalFeesCollected} XFI</p>
        <p className="text-sm text-gray-400 mt-2">Protocol fees</p>
      </div>

      <div className="card">
        <h3 className="text-lg font-medium text-gray-400 mb-2">Next Reward</h3>
        <p className="text-2xl font-bold">{nextRewardDate}</p>
        <p className="text-sm text-gray-400 mt-2">Reward frequency</p>
      </div>
    </div>
  );
}