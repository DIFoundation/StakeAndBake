import React from 'react';

interface TabNavigationProps {
  selectedTab: string;
  onTabChange: (tab: string) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ selectedTab, onTabChange }) => {
  const tabs = ['active', 'ended', 'upcoming'];

  return (
    <div className="flex space-x-1 mb-6 bg-gray-800/50 p-1 rounded-lg w-fit">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`px-4 py-2 rounded-md font-semibold transition-colors capitalize ${
            selectedTab === tab
              ? 'bg-purple-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export default TabNavigation;