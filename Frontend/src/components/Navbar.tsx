'use client';

import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Image from 'next/image';
import { useAccount } from 'wagmi';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { isConnected } = useAccount();
  const pathname = usePathname();
  
  const navItems = isConnected
    ? [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/stake', label: 'Stake' },
        { href: '/portfolio', label: 'My sbFT' },
        { href: 'https://crossfi.org/', label: 'Crossfi', external: true },
        { href: 'https://test.xfiscan.com/dashboard', label: 'Explorer', external: true },
        { href: '/contact-us', label: 'Contact Us' }
      ]
    : [
        { href: '/', label: 'Home' },
        { href: 'https://www.investopedia.com/non-fungible-tokens-nft-5115211', label: 'Explore NFTs', external: true },
        { href: '/how-it-works', label: 'How It Works' },
        { href: 'https://github.com/DIFoundation/StakeAndBake/blob/main/README.md', label: 'Docs', external: true }
      ];

  return (
    <nav className="bg-[#121212]/50 border-b border-gray-800 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="StakeAndBake Logo"
                width={40}
                height={40}
                className="rounded-full"
              />
            </Link>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex space-x-6">
            {navItems.map((item, id) =>
              item.external ? (
                <a
                  key={id}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white text-sm"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={id}
                  href={item.href}
                  className={`text-sm ${
                    pathname === item.href ? 'text-white font-medium' : 'text-gray-300'
                  } hover:text-white`}
                >
                  {item.label}
                </Link>
              )
            )}
          </div>

          {/* Wallet connect button */}
          <div className="hidden md:block">
            <ConnectButton accountStatus="address" chainStatus="icon" showBalance={true} />
          </div>
        </div>
      </div>
    </nav>
  );
}
