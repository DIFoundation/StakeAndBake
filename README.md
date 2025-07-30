# Stake and Bake 

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://stakeandbake.vercel.app/)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black)](https://vercel.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> A DeFi staking platform for the Cross Finance ecosystem that allows users to stake XFI tokens and earn sbFTs (fractional NFTs) representing their stake with flexible reward mechanisms.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Demo](#demo)
- [Faucet](#faucet)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Usage](#usage)
- [Smart Contract Integration](#smart-contract-integration)
- [Architecture](#architecture)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Security](#security)
- [FAQ](#faq)
- [License](#license)
- [Support](#support)

## Overview

Stake and Bake is a decentralized finance (DeFi) application built for the Cross Finance ecosystem. Users can stake their XFI tokens and receive sbFTs (staking-backed Fractional NFTs) that represent their stake. The platform offers unique flexibility by allowing users to sell portions of their sbFTs while still earning rewards based on their retained share at the end of the staking period.

### Key Concepts

- **XFI Token**: The native token of the Cross Finance ecosystem
- **sbFTs**: Staking-backed Fractional NFTs that represent your staked position
- **Flexible Staking**: Ability to sell portions of your stake while maintaining rewards
- **Dynamic Rewards**: Earnings based on retained sbFT share at period end

## Features

- 🪙 **XFI Token Staking**: Stake your XFI tokens securely in the Cross Finance ecosystem
- 🎨 **sbFT Generation**: Receive fractional NFTs (fNFTs) representing your staking position
- 💱 **Flexible Trading**: Sell portions of your sbFTs while maintaining staking rewards
- 📊 **Dynamic Rewards**: Earn rewards proportional to your retained share
- 🔒 **Secure & Transparent**: Built with security and transparency as core principles
- 📱 **Responsive Design**: Seamless experience across desktop and mobile devices
- ⚡ **Real-time Updates**: Live tracking of your staking positions and rewards

## Demo

### Live Application
🌐 **[Visit Stake and Bake](https://stakeandbake.vercel.app/)**

## Faucet
### Custom xfi token faucet for Stake And Bake
**[cXFI Token Faucet](https://xfi-faucet.vercel.app/)**

### Screenshots

#### Main Dashboard
![Main Dashboard](https://iili.io/F8DwKts.png)

#### Staking Interface
![Staking Interface](https://iili.io/F8DwJSI.png)

#### Marketplace
![Marketplace](https://iili.io/F8Dw29t.png)

#### sbFT Management
![sbFT Management](https://iili.io/F8DwFNn.png)


## Getting Started

### Prerequisites

Before you begin, ensure you have:

- **Web3 Wallet**: MetaMask or compatible wallet
- **XFI Tokens**: Available in your wallet for staking
- **Network Access**: Connected to the appropriate blockchain network
- **Modern Browser**: Chrome, Firefox, Safari, or Edge

### Quick Start

1. **Visit the Application**: Go to [stakeandbake.vercel.app](https://stakeandbake.vercel.app/)
2. **Connect Wallet**: Click "Connect Wallet" and approve the connection
3. **Stake XFI**: Enter the amount of XFI tokens you want to stake
4. **Receive sbFTs**: Get your fractional NFTs representing your stake
5. **Manage Position**: Trade portions or hold until the staking period ends

## Installation

### For Developers

```bash
# Clone the repository
git clone https://github.com/DIFoundation/StakeAndBake.git
cd StakeAndBake

# Install dependencies
npm install
# or
yarn install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run the development server
npm run dev
# or
yarn dev
```

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Blockchain Configuration
NEXT_PUBLIC_CHAIN_ID=1
NEXT_PUBLIC_RPC_URL=https://mainnet.infura.io/v3/your-project-id

# Smart Contract Addresses
NEXT_PUBLIC_XFI_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_SBFT_CONTRACT_ADDRESS=0x...

# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://api.crossfinance.com

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
```

## Usage

### Staking XFI Tokens

```javascript
// Example of staking interaction
import { useStaking } from './hooks/useStaking';

function StakingComponent() {
  const { stakeXFI, isLoading } = useStaking();
  
  const handleStake = async (amount) => {
    try {
      const tx = await stakeXFI(amount);
      console.log('Staking successful:', tx.hash);
    } catch (error) {
      console.error('Staking failed:', error);
    }
  };
  
  return (
    <div>
      <input 
        type="number" 
        placeholder="Amount to stake"
        onChange={(e) => setAmount(e.target.value)}
      />
      <button 
        onClick={() => handleStake(amount)}
        disabled={isLoading}
      >
        {isLoading ? 'Staking...' : 'Stake XFI'}
      </button>
    </div>
  );
}
```

### Managing sbFTs

```javascript
// Example of sbFT management
import { usesbFTs } from './hooks/usesbFTs';

function sbFTManager() {
  const { sbfts, sellPortion, isLoading } = usesbFTs();
  
  const handleSell = async (tokenId, percentage) => {
    try {
      const tx = await sellPortion(tokenId, percentage);
      console.log('Sale successful:', tx.hash);
    } catch (error) {
      console.error('Sale failed:', error);
    }
  };
  
  return (
    <div>
      {sbfts.map(nft => (
        <div key={nft.id}>
          <h3>sbFT #{nft.id}</h3>
          <p>Value: {nft.value} XFI</p>
          <button onClick={() => handleSell(nft.id, 25)}>
            Sell 25%
          </button>
        </div>
      ))}
    </div>
  );
}
```

## Smart Contract Integration

### Contract Addresses

```javascript
// Contract addresses (example - replace with actual)
const CONTRACTS = {
  XFI_TOKEN: "0x...", // XFI Token Contract
  STAKING: "0x...",   // Main Staking Contract  
  SBFT: "0x...",      // sbFT NFT Contract
  MARKETPLACE: "0x..." // sbFT Marketplace Contract
};
```

### Key Functions

#### Staking Contract
- `stake(uint256 amount)`: Stake XFI tokens
- `unstake(uint256 tokenId)`: Unstake and claim rewards
- `getRewards(uint256 tokenId)`: Check pending rewards

#### sbFT Contract
- `mint(address to, uint256 stakeAmount)`: Mint new sbFT
- `fractionalize(uint256 tokenId, uint256 percentage)`: Sell portion
- `getStakeInfo(uint256 tokenId)`: Get staking details

## Architecture

### Tech Stack

- **Frontend**: Next.js, React, TypeScript
- **Styling**: Tailwind CSS
- **Web3**: ethers.js / wagmi
- **State Management**: Zustand / Redux
- **Deployment**: Vercel
- **Blockchain**: Ethereum (or compatible EVM chain)

### Project Structure

```
StakeAndBake/
├── components/          # React components
│   ├── staking/        # Staking-related components
│   ├── sbft/           # sbFT management components
│   └── ui/             # Reusable UI components
├── hooks/              # Custom React hooks
├── pages/              # Next.js pages
├── public/             # Static assets
├── styles/             # CSS/styling files
├── utils/              # Utility functions
├── contracts/          # Smart contract ABIs
└── types/              # TypeScript type definitions
```

### Data Flow

1. **User connects wallet** → Web3 provider initialization
2. **Stake XFI tokens** → Smart contract interaction
3. **Receive sbFTs** → NFT minting and metadata update
4. **Trade portions** → Fractionalization contract calls
5. **Claim rewards** → Reward calculation and distribution

## Development

### Running Locally

```bash
# Start development server
npm run dev

# Run tests
npm test

# Build for production  
npm run build

# Start production server
npm start
```

### Testing

```bash
# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run e2e tests (requires running app)
npm run test:e2e

# Test coverage
npm run test:coverage
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type checking
npm run type-check
```

## Deployment

### Vercel Deployment (Recommended)

The project is configured for seamless Vercel deployment:

```bash
# Deploy to Vercel
vercel

# Or connect your GitHub repo to Vercel for automatic deployments
```

### Manual Deployment

```bash
# Build the project
npm run build

# Deploy the 'out' or '.next' directory to your hosting provider
```

### Environment Setup

Ensure these environment variables are set in your deployment:

- `NEXT_PUBLIC_CHAIN_ID`
- `NEXT_PUBLIC_RPC_URL`
- `NEXT_PUBLIC_XFI_TOKEN_ADDRESS`
- `NEXT_PUBLIC_STAKING_CONTRACT_ADDRESS`

## Contributing

We welcome contributions to Stake and Bake! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and add tests
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style and conventions
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR
- Keep commits atomic and well-described

## Security

### Smart Contract Security

- All contracts should be audited before mainnet deployment
- Use established patterns and libraries (OpenZeppelin)
- Implement proper access controls and validation
- Regular security reviews and updates

### Frontend Security

- Validate all user inputs
- Sanitize data before display
- Use secure communication (HTTPS)
- Implement proper error handling
- Regular dependency updates

### Reporting Security Issues

If you discover a security vulnerability, please email us at [StakeAndBake Admin Email](mailto:adeniranibrahim165@gmail.com) instead of opening a public issue.

## FAQ

### General Questions

**Q: What is sbFT?**
A: sbFT stands for "staking-backed Fractional NFT." It's a unique NFT that represents your staked XFI tokens and can be partially sold while maintaining staking rewards.

**Q: How do rewards work?**
A: Rewards are calculated based on your retained sbFT share at the end of the staking period. If you sell 25% of your sbFT, you'll receive 75% of the rewards.

**Q: What happens if I sell my entire sbFT?**
A: Selling your entire sbFT means you forfeit all staking rewards, but you receive the immediate sale value.

### Technical Questions

**Q: Which networks are supported?**
A: Currently supports Ethereum mainnet and testnets. Check the app for current network status.

**Q: What wallets are compatible?**
A: MetaMask, WalletConnect-compatible wallets, and other standard Web3 wallets.

**Q: Are there any fees?**
A: Standard blockchain gas fees apply. Platform fees (if any) are displayed before transactions.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Stake and Bake Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

## Support

<!-- ### Community -->
<!-- 
- 💬 **Discord**: [Join our community](https://discord.gg/stakeandbake)
- 🐦 **Twitter**: [@StakeAndBake](https://twitter.com/stakeandbake)
- 📧 **Email**: [support@stakeandbake.com](mailto:support@stakeandbake.com) -->

<!-- ### Documentation -->

<!-- - 📚 **Full Documentation**: [docs.stakeandbake.com](https://docs.stakeandbake.com) -->
<!-- - 🎥 **Video Tutorials**: [YouTube Channel](https://youtube.com/stakeandbake) -->
<!-- - 📖 **Developer Guide**: [dev.stakeandbake.com](https://dev.stakeandbake.com) -->

### Issues & Bug Reports

- 🐛 **Report Bug**: [GitHub Issues](https://github.com/DIFoundation/stakeAndBake/issues)
- 💡 **Feature Request**: [GitHub Discussions](https://github.com/DIFoundation/StakeAndBake/discussions)

---

<div align="center">
  <strong>🥩 Built with passion for DeFi 🔥</strong>
  <br>
  <a href="https://stakeandbake.vercel.app/">Live App</a> •
  <!-- <a href="https://docs.stakeandbake.com">Documentation</a> • -->
  <a href="https://github.com/DIFoundation/StakeAndBake">GitHub</a>
</div>
