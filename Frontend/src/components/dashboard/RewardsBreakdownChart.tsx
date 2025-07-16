"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const data = [
  { name: "Staked", value: 150.75 },
  { name: "Claimed", value: 7.5 },
  { name: "Unstake", value: 10.5 },

];

const COLORS = ["#8b5cf6", "#10b981", "red"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleClick = (data: any, index: number) => {
  console.log("Clicked bar index:", index, "Data:", data);
};

export default function RewardsBreakdownChart() {
  return (
    <div className="card bg-[#121212]/80 border border-[#3F3F46] text-white rounded-xl p-6 hover:shadow-lg transition mb-12">
      <h2 className="text-xl font-semibold mb-4">Rewards Breakdown</h2>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
          <XAxis dataKey="name" stroke="#ccc" />
          <YAxis stroke="#ccc" />
          <Tooltip cursor={{ fill: "rgba(255,255,255,0.1)" }} />
          <Bar dataKey="value" onClick={handleClick}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                cursor="pointer"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
