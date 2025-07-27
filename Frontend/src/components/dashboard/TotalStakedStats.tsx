'use client';

import { 
  Wallet, 
  Lock, 
  Gift, 
  TrendingUp, 
  Calendar,
  Coins,
  PiggyBank,
  BarChart3,
  Users,
  DollarSign,
  Clock
} from 'lucide-react';

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

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'orange' | 'cyan' | 'pink' | 'gray';
  trend?: string;
}

const StatCard = ({ title, value, subtitle, icon, color, trend }: StatCardProps) => {
  const colorClasses = {
    blue: {
      bg: 'from-blue-500/20 to-blue-600/20',
      border: 'border-blue-500/30',
      icon: 'text-blue-400',
      value: 'text-blue-100',
      glow: 'shadow-blue-500/10'
    },
    green: {
      bg: 'from-green-500/20 to-green-600/20',
      border: 'border-green-500/30',
      icon: 'text-green-400',
      value: 'text-green-100',
      glow: 'shadow-green-500/10'
    },
    purple: {
      bg: 'from-purple-500/20 to-purple-600/20',
      border: 'border-purple-500/30',
      icon: 'text-purple-400',
      value: 'text-purple-100',
      glow: 'shadow-purple-500/10'
    },
    yellow: {
      bg: 'from-yellow-500/20 to-yellow-600/20',
      border: 'border-yellow-500/30',
      icon: 'text-yellow-400',
      value: 'text-yellow-100',
      glow: 'shadow-yellow-500/10'
    },
    orange: {
      bg: 'from-orange-500/20 to-orange-600/20',
      border: 'border-orange-500/30',
      icon: 'text-orange-400',
      value: 'text-orange-100',
      glow: 'shadow-orange-500/10'
    },
    cyan: {
      bg: 'from-cyan-500/20 to-cyan-600/20',
      border: 'border-cyan-500/30',
      icon: 'text-cyan-400',
      value: 'text-cyan-100',
      glow: 'shadow-cyan-500/10'
    },
    pink: {
      bg: 'from-pink-500/20 to-pink-600/20',
      border: 'border-pink-500/30',
      icon: 'text-pink-400',
      value: 'text-pink-100',
      glow: 'shadow-pink-500/10'
    },
    gray: {
      bg: 'from-gray-500/20 to-gray-600/20',
      border: 'border-gray-500/30',
      icon: 'text-gray-400',
      value: 'text-gray-100',
      glow: 'shadow-gray-500/10'
    }
  };

  const styles = colorClasses[color];

  return (
    <div className={`
      relative overflow-hidden rounded-2xl border ${styles.border} 
      bg-gradient-to-br ${styles.bg} backdrop-blur-xl
      hover:shadow-2xl ${styles.glow} transition-all duration-300 hover:-translate-y-1
      group cursor-pointer
    `}>
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${styles.bg} ${styles.icon}`}>
            {icon}
          </div>
          {trend && (
            <div className="flex items-center space-x-1 text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-lg">
              <TrendingUp className="w-3 h-3" />
              <span>{trend}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
            {title}
          </h3>
          <div className={`text-2xl font-bold ${styles.value} group-hover:scale-105 transition-transform duration-200`}>
            {value}
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-xl -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500" />
      </div>
    </div>
  );
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
  const personalStats = [
    {
      title: "Stake and Bake XFI Balance",
      value: `${totalBals} XFI`,
      subtitle: "Available in your wallet for staking",
      icon: <Wallet className="w-6 h-6" />,
      color: 'blue' as const,
    },
    {
      title: "Staked Amount",
      value: `${totalStaked} XFI`,
      subtitle: "Currently locked in staking contract",
      icon: <Lock className="w-6 h-6" />,
      color: 'purple' as const,
    },
    {
      title: "sbFT Tokens",
      value: `${sbftWalletBalance} sbFT`,
      subtitle: "Staking receipt tokens in your wallet",
      icon: <Coins className="w-6 h-6" />,
      color: 'cyan' as const,
    },
    {
      title: "Pending Rewards",
      value: `${rewardsEarned} XFI`,
      subtitle: "Ready to claim or compound",
      icon: <Gift className="w-6 h-6" />,
      color: 'green' as const,
      trend: parseFloat(rewardsEarned) > 0 ? "+0.02%" : undefined
    }
  ];

  const earningsStats = [
    {
      title: "Current APY",
      value: `${apy}%`,
      subtitle: "Annual percentage yield on your stake",
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'purple' as const,
    },
    {
      title: "Monthly Projection",
      value: `${estimatedMonthlyEarnings} XFI`,
      subtitle: "Estimated earnings per month",
      icon: <Calendar className="w-6 h-6" />,
      color: 'blue' as const,
    },
    {
      title: "Yearly Projection",
      value: `${estimatedYearlyEarnings} XFI`,
      subtitle: "Estimated earnings per year",
      icon: <PiggyBank className="w-6 h-6" />,
      color: 'yellow' as const,
    },
    {
      title: "Reward Frequency",
      value: nextRewardDate,
      subtitle: "How often rewards are calculated",
      icon: <Clock className="w-6 h-6" />,
      color: 'gray' as const,
    }
  ];

  const protocolStats = [
    {
      title: "XFI Balance",  
      value: `${balance} XFI`,
      subtitle: "Available for transaction fees",
      icon: <DollarSign className="w-6 h-6" />,
      color: 'gray' as const,
    },
    {
      title: "Total Protocol TVL",
      value: `${totalStakedContract} XFI`,
      subtitle: "Total value locked across all users",
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'orange' as const,
    },
    {
      title: "Protocol Fees",
      value: `${totalFeesCollected} XFI`,
      subtitle: "Total fees collected by protocol",
      icon: <Users className="w-6 h-6" />,
      color: 'pink' as const,
    }
  ];

  return (
    <div className="space-y-8 mb-12">
      {/* Personal Stats Section */}
      <div>
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-blue-500/30">
            <Wallet className="w-5 h-5 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Your Portfolio</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {personalStats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>
      </div>

      {/* Earnings Section */}
      <div>
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30">
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Earnings & Projections</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {earningsStats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>
      </div>

      {/* Protocol Stats Section */}
      <div>
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-600/20 border border-orange-500/30">
            <BarChart3 className="w-5 h-5 text-orange-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Protocol Metrics</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {protocolStats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>
      </div>
    </div>
  );
}