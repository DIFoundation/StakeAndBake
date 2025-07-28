"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

type Props = {
  stakedAmount: number;
  claimedAmount: number;
  totalFeesCollected: number;
};

export default function RewardsBreakdownChart({
  stakedAmount,
  claimedAmount,
  totalFeesCollected,
}: Props) {
  // Create data for the charts
  const barData = [
    { name: "Currently Staked", value: stakedAmount, color: "#8b5cf6" },
    { name: "Pending Rewards", value: claimedAmount, color: "#10b981" },
    { name: "Protocol Fees", value: totalFeesCollected, color: "#f59e0b" },
  ];

  const pieData = [
    { name: "Your Stake", value: stakedAmount, fill: "#8b5cf6" },
    { name: "Your Rewards", value: claimedAmount, fill: "#10b981" },
    { name: "Fees Collected", value: totalFeesCollected, fill: "#f59e0b" },
  ].filter((item) => item.value > 0); // Only show non-zero values

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1A1A1A] border border-[#3F3F46] rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{`${label}`}</p>
          <p className="text-green-400">
            {`Value: ${payload[0].value.toFixed(4)} XFI`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card bg-[#121212]/80 border border-[#3F3F46] text-white rounded-xl p-6 hover:shadow-lg transition mb-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Staking Overview</h2>
        <div className="text-sm text-gray-400">
          Total Value: {(stakedAmount + claimedAmount).toFixed(4)} XFI
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Bar Chart */}
        <div>
          <h3 className="text-lg font-medium text-gray-300 mb-4">
            Value Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={barData}
              margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
            >
              <XAxis
                dataKey="name"
                stroke="#ccc"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#ccc" tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    cursor="pointer"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div>
          <h3 className="text-lg font-medium text-gray-300 mb-4">
            Distribution
          </h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => 
                    `${name}: ${((percent ?? 0) * 100).toFixed(1)}%`}
                  labelLine={false}
                  stroke="#3F3F46"
                  strokeWidth={2}
                />
                
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ color: "#ccc", fontSize: "14px" }}
                  iconType="circle"
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-2">📊</div>
                <p>No data to display</p>
                <p className="text-sm">
                  Start staking to see your distribution
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mt-8 grid md:grid-cols-3 gap-4">
        <div className="bg-[#1A1A1A] rounded-lg p-4 border border-[#3F3F46]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Stake</p>
              <p className="text-2xl font-bold text-purple-400">
                {stakedAmount.toFixed(4)}
              </p>
            </div>
            <div className="text-purple-400 text-2xl">🔒</div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Currently earning rewards
          </p>
        </div>

        <div className="bg-[#1A1A1A] rounded-lg p-4 border border-[#3F3F46]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pending Rewards</p>
              <p className="text-2xl font-bold text-green-400">
                {claimedAmount.toFixed(4)}
              </p>
            </div>
            <div className="text-green-400 text-2xl">💰</div>
          </div>
          <p className="text-xs text-gray-500 mt-1">Ready to claim</p>
        </div>

        <div className="bg-[#1A1A1A] rounded-lg p-4 border border-[#3F3F46]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Protocol Fees</p>
              <p className="text-2xl font-bold text-yellow-400">
                {totalFeesCollected.toFixed(4)}
              </p>
            </div>
            <div className="text-yellow-400 text-2xl">⚡</div>
          </div>
          <p className="text-xs text-gray-500 mt-1">Total fees collected</p>
        </div>
      </div>
    </div>
  );
}
