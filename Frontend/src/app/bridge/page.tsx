'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { 
  Zap, 
  ArrowLeftRight, 
  // Cpu, 
  Globe, 
  Sparkles, 
  Shield,
  Rocket,
  Clock,
  ChevronDown,
  ExternalLink
} from 'lucide-react';

export default function BridgePage() {
  const { isConnected } = useAccount();
  // const [selectedFromChain, setSelectedFromChain] = useState('crossfi');
  // const [selectedToChain, setSelectedToChain] = useState('ethereum');
  // const [amount, setAmount] = useState('');
  const [isAnimating, setIsAnimating] = useState(true);

  // Cyberpunk glow animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(prev => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const chains = [
    { id: 'crossfi', name: 'CrossFi', icon: '⚡', color: 'from-purple-500 to-blue-500' },
    { id: 'ethereum', name: 'Ethereum', icon: '♦️', color: 'from-blue-500 to-cyan-500' },
    { id: 'arbitrum', name: 'Arbitrum', icon: '🔷', color: 'from-cyan-500 to-teal-500' },
    { id: 'polygon', name: 'Polygon', icon: '🟣', color: 'from-purple-500 to-pink-500' },
    { id: 'bsc', name: 'BSC', icon: '🟡', color: 'from-yellow-500 to-orange-500' },
  ];

  const features = [
    {
      icon: ArrowLeftRight,
      title: 'Cross-Chain Liquidity',
      description: 'Bridge sbFT tokens seamlessly across multiple blockchain networks'
    },
    {
      icon: Shield,
      title: 'Maximum Security',
      description: 'State-of-the-art cryptographic protocols ensure safe transfers'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Near-instant bridging with minimal fees and maximum efficiency'
    },
    {
      icon: Globe,
      title: 'Multi-Chain DeFi',
      description: 'Access yield farms, liquidity pools, and DeFi protocols everywhere'
    }
  ];

  if (!isConnected) {
    return (
      <div className="min-h-screen text-white flex flex-col items-center justify-center pt-20">
        <div className="bg-[#121212]/80 border border-[#3F3F46] rounded-xl p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Connect Wallet</h2>
          <p className="text-gray-400 mb-6">
            Please connect your wallet to access the sbFT bridge.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white pt-20 px-4 sm:px-8 relative overflow-hidden">
      {/* Cyberpunk Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-conic from-purple-500/5 via-cyan-500/5 to-purple-500/5 rounded-full blur-2xl animate-spin" style={{animationDuration: '20s'}}></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className={`p-4 rounded-2xl bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30 ${isAnimating ? 'animate-pulse' : ''}`}>
              <ArrowLeftRight className="w-8 h-8 text-cyan-400" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              sbFT Bridge
            </h1>
            <div className={`p-4 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 ${isAnimating ? 'animate-pulse' : ''}`}>
              <Zap className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-900/50 to-cyan-900/50 border border-purple-500/30 rounded-full px-6 py-3 mb-4">
            <Clock className="w-5 h-5 text-cyan-400" />
            <span className="text-cyan-300 font-medium">Coming Soon</span>
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>

          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            The future of cross-chain DeFi is here. Bridge your sbFT tokens across multiple blockchain networks and unlock unlimited yield opportunities in the multiverse of decentralized finance.
          </p>
        </div>

        {/* Main Bridge Interface (Preview) */}
        <div className="max-w-2xl mx-auto mb-16">
          <div className="bg-[#121212]/80 border border-purple-500/30 rounded-3xl p-8 relative overflow-hidden">
            {/* Animated border glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-purple-500/20 rounded-3xl opacity-50 animate-pulse"></div>
            
            <div className="relative z-10">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Cross-Chain Bridge</h3>
                <p className="text-gray-400">Transfer sbFT tokens across blockchain networks</p>
              </div>

              {/* From Chain */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">From</label>
                <div className="relative">
                  <div className="bg-[#1A1A1A] border border-gray-600 rounded-xl p-4 cursor-not-allowed opacity-75">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-sm">
                          ⚡
                        </div>
                        <span className="font-medium">CrossFi Testnet</span>
                      </div>
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="bg-[#1A1A1A] border border-gray-600 rounded-xl p-4 mt-3 w-full text-right text-lg font-medium cursor-not-allowed opacity-75"
                    disabled
                  />
                </div>
              </div>

              {/* Bridge Arrow */}
              <div className="flex justify-center mb-6">
                <div className={`p-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 border border-purple-500/50 ${isAnimating ? 'animate-bounce' : ''}`}>
                  <ArrowLeftRight className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* To Chain */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-300 mb-3">To</label>
                <div className="bg-[#1A1A1A] border border-gray-600 rounded-xl p-4 cursor-not-allowed opacity-75">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-sm">
                        ♦️
                      </div>
                      <span className="font-medium">Ethereum</span>
                    </div>
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Bridge Button */}
              <button
                disabled
                className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 py-4 rounded-xl font-semibold text-lg transition cursor-not-allowed opacity-75 relative overflow-hidden"
              >
                <span className="relative z-10">Bridge Coming Soon</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 animate-pulse"></div>
              </button>

              {/* Bridge Info */}
              <div className="mt-6 p-4 bg-purple-900/20 border border-purple-500/30 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Rocket className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-purple-300">Bridge Status</span>
                </div>
                <p className="text-sm text-gray-300">
                  The sbFT bridge is currently in development. Once live, you&apos;ll be able to transfer tokens across multiple chains and access DeFi protocols everywhere.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-[#121212]/80 border border-[#3F3F46] rounded-xl p-6 hover:border-purple-500/50 transition group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600/20 to-cyan-600/20 border border-purple-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                  <Icon className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* Supported Chains Preview */}
        <div className="bg-[#121212]/80 border border-[#3F3F46] rounded-xl p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-4">Supported Networks</h3>
            <p className="text-gray-400">Bridge sbFT across multiple blockchain ecosystems</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {chains.map((chain) => (
              <div
                key={chain.id}
                className="bg-[#1A1A1A] border border-gray-600 rounded-xl p-4 text-center hover:border-purple-500/50 transition group opacity-75"
              >
                <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${chain.color} flex items-center justify-center text-2xl mx-auto mb-3 group-hover:scale-110 transition`}>
                  {chain.icon}
                </div>
                <span className="font-medium text-sm">{chain.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16 mb-8">
          <div className="bg-gradient-to-r from-purple-900/50 to-cyan-900/50 border border-purple-500/30 rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-4">Ready to Bridge the Future?</h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Stay tuned for the launch of the sbFT bridge. Soon you&apos;ll unlock the full potential of cross-chain DeFi and maximize your yields across multiple networks.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 px-8 py-3 rounded-xl font-semibold transition">
                Get Notified
              </button>
              <button className="border border-gray-600 hover:border-purple-500/50 px-8 py-3 rounded-xl font-semibold transition flex items-center gap-2 justify-center">
                Learn More
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}