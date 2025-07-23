'use client';

type Props = {
  totalBals: string;
  totalStaked: string;
  rewardsEarned: string;
  apy: string;
  nextRewardDate: string;
  balance: string
};

export default function TotalStakedStats({ totalBals, totalStaked, rewardsEarned, apy, nextRewardDate, balance }: Props) {
  return (
    <div className="bg-[#121212]/80 border border-[#3F3F46] text-white rounded-xl p-6 hover:shadow-lg transition grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      <div className="card">
        <h3 className="text-lg font-medium text-gray-400 mb-2">Total Bals</h3>
        <p className="text-3xl font-bold">{totalBals} XFI</p>
        <p className="text-sm text-gray-400 mt-2">≈ $0.00</p>
      </div>

      <div className="card">
        <h3 className="text-lg font-medium text-gray-400 mb-2">Total Staked</h3>
        <p className="text-3xl font-bold">{totalStaked} XFI</p>
        <p className="text-sm text-gray-400 mt-2">≈ $0.00</p>
      </div>

      <div className="card">
        <h3 className="text-lg font-medium text-gray-400 mb-2">Wallet Balance</h3>
        <p className="text-3xl font-bold">{balance} XFI</p>
        <p className="text-sm text-gray-400 mt-2">≈ $0.00</p>
      </div>

      <div className="card">
        <h3 className="text-lg font-medium text-gray-400 mb-2">Rewards Earned</h3>
        <p className="text-3xl font-bold text-green-400">{rewardsEarned} sbFT</p>
        <p className="text-sm text-gray-400 mt-2">≈ $0.00</p>
      </div>

      <div className="card">
        <h3 className="text-lg font-medium text-gray-400 mb-2">Current APY</h3>
        <p className="text-3xl font-bold">{apy}%</p>
        <p className="text-sm text-gray-400 mt-2">Annual Percentage Yield</p>
      </div>

      <div className="card">
        <h3 className="text-lg font-medium text-gray-400 mb-2">Next Reward</h3>
        <p className="text-3xl font-bold">{nextRewardDate}</p>
        <p className="text-sm text-gray-400 mt-2">Estimated next reward date</p>
      </div>
    </div>
  );
}
