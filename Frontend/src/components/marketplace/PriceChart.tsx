'use client';

import { useState, useEffect } from 'react';
import { useReadContracts } from 'wagmi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Clock, BarChart2 } from 'lucide-react';
import { sbFTMarketplaceAddress, sbFTMarketplaceAbi } from '@/contractAddressAndABI';

type Props = {
  refreshTrigger: number;
};

type PricePoint = {
  timestamp: number;
  price: number;
  volume: number;
  time: string;
  date: string;
};

type TimeRange = '1H' | '24H' | '7D' | '30D';

export default function PriceChart({ refreshTrigger }: Props) {
  const [priceData, setPriceData] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('24H');
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);

  // Get active orders to calculate current market price
  const {  } = useReadContracts({
    contracts: [
      {
        address: sbFTMarketplaceAddress as `0x${string}`,
        abi: sbFTMarketplaceAbi,
        functionName: 'getActiveBuyOrders',
      },
      {
        address: sbFTMarketplaceAddress as `0x${string}`,
        abi: sbFTMarketplaceAbi,
        functionName: 'getActiveSellOrders',
      },
    ],
    query: {
      refetchInterval: 30000,
    },
  });

  // Generate mock historical data (in a real app, this would come from your backend/subgraph)
  const generateMockData = (range: TimeRange): PricePoint[] => {
    const now = Date.now();
    const basePrice = 2.45; // Base price in USDC
    const dataPoints: PricePoint[] = [];
    
    let intervals: number;
    let timeStep: number;
    
    switch (range) {
      case '1H':
        intervals = 60;
        timeStep = 60 * 1000; // 1 minute intervals
        break;
      case '24H':
        intervals = 24;
        timeStep = 60 * 60 * 1000; // 1 hour intervals
        break;
      case '7D':
        intervals = 7;
        timeStep = 24 * 60 * 60 * 1000; // 1 day intervals
        break;
      case '30D':
        intervals = 30;
        timeStep = 24 * 60 * 60 * 1000; // 1 day intervals
        break;
      default:
        intervals = 24;
        timeStep = 60 * 60 * 1000;
    }

    for (let i = intervals; i >= 0; i--) {
      const timestamp = now - (i * timeStep);
      const randomFactor = 0.9 + Math.random() * 0.2; // ±10% variation
      const trendFactor = 1 + (Math.sin(i / intervals * Math.PI * 2) * 0.05); // Slight trend
      const price = basePrice * randomFactor * trendFactor;
      const volume = Math.random() * 50000 + 10000; // Random volume
      
      dataPoints.push({
        timestamp,
        price: parseFloat(price.toFixed(4)),
        volume: parseFloat(volume.toFixed(2)),
        time: new Date(timestamp).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }),
        date: new Date(timestamp).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
      });
    }

    return dataPoints;
  };

  useEffect(() => {
    setLoading(true);
    
    // Generate mock data based on selected time range
    const mockData = generateMockData(timeRange);
    setPriceData(mockData);
    
    // Calculate current price and change
    if (mockData.length > 1) {
      const latest = mockData[mockData.length - 1];
      const previous = mockData[mockData.length - 2];
      
      setCurrentPrice(latest.price);
      const change = ((latest.price - previous.price) / previous.price) * 100;
      setPriceChange(change);
    }
    
    setLoading(false);
  }, [timeRange, refreshTrigger]);

  const timeRanges: { value: TimeRange; label: string }[] = [
    { value: '1H', label: '1H' },
    { value: '24H', label: '24H' },
    { value: '7D', label: '7D' },
    { value: '30D', label: '30D' },
  ];

  const formatXAxisLabel = (timestamp: number) => {
    const date = new Date(timestamp);
    switch (timeRange) {
      case '1H':
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
      case '24H':
        return date.toLocaleTimeString('en-US', { 
          hour: '2-digit',
          hour12: false 
        });
      case '7D':
      case '30D':
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
      default:
        return date.toLocaleTimeString('en-US', { hour: '2-digit', hour12: false });
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#1F1F23] border border-[#3F3F46] rounded-lg p-3 shadow-lg">
          <p className="text-gray-400 text-sm mb-2">
            {new Date(label).toLocaleString()}
          </p>
          <p className="text-white font-mono">
            Price: <span className="text-purple-400">${data.price}</span>
          </p>
          <p className="text-gray-400 text-sm">
            Volume: ${data.volume.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-[#121212]/80 border border-[#3F3F46] rounded-xl p-6 mb-6">
        <div className="animate-pulse">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="h-6 bg-[#3F3F46] rounded w-32 mb-2"></div>
              <div className="h-8 bg-[#3F3F46] rounded w-24"></div>
            </div>
            <div className="flex gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 bg-[#3F3F46] rounded w-12"></div>
              ))}
            </div>
          </div>
          <div className="h-64 bg-[#3F3F46] rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#121212]/80 border border-[#3F3F46] rounded-xl p-6 mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-bold">sbFT Price Chart</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-mono font-bold">
                ${currentPrice.toFixed(4)}
              </span>
              <span className="text-sm text-gray-400">USDC</span>
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${
              priceChange >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {priceChange >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-1 bg-[#1F1F23] rounded-lg p-1">
          {timeRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded transition ${
                timeRange === range.value
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-[#3F3F46]'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={priceData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3F3F46" />
            <XAxis 
              dataKey="timestamp"
              tickFormatter={formatXAxisLabel}
              stroke="#9CA3AF"
              fontSize={12}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              domain={['dataMin - 0.1', 'dataMax + 0.1']}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
              stroke="#9CA3AF"
              fontSize={12}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#A855F7" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: '#A855F7', strokeWidth: 2, fill: '#1F1F23' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Info */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#3F3F46]">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Clock className="w-4 h-4" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
        <div className="text-sm text-gray-400">
          Showing {timeRange} price movement
        </div>
      </div>
    </div>
  );
}