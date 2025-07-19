import { Chain } from 'viem';

export const xfiTestnet = {
  id: 4157,
  name: 'XFI Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'XFI',
    symbol: 'XFI',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.ms'],
    },
    public: {
      http: ['https://rpc.testnet.ms'],
    },
  },
  blockExplorers: {
    default: { name: 'XFIScan', url: 'https://test.xfiscan.com' },
  },
  testnet: true,
} as const satisfies Chain;
