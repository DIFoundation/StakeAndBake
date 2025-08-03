"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
import { useAccount } from "wagmi";
import { usePathname } from "next/navigation";

import { EllipsisVertical, X, ChevronDown, ArrowLeftRight, TrendingUp, ExternalLink, Vote, Layers2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";

interface NavItem {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  external?: boolean;
  comingSoon?: boolean;
}

export default function Navbar() {
  const { isConnected, address } = useAccount();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [tradingDropdownOpen, setTradingDropdownOpen] = useState(false);
  const [resourcesDropdownOpen, setResourcesDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const tradingDropdownRef = useRef<HTMLDivElement>(null);
  const resourcesDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }

      if (tradingDropdownRef.current && !tradingDropdownRef.current.contains(e.target as Node)) {
        setTradingDropdownOpen(false);
      }
      if (resourcesDropdownRef.current && !resourcesDropdownRef.current.contains(e.target as Node)) {
        setResourcesDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // toast when connectt to wallet
  useEffect(() => {
    if (isConnected) {
      toast.success(`Connected to wallet address: ${address}`);
    }
  }, [address, isConnected]);

  const tradingItems: NavItem[] = [
    { href: "/marketplace", label: "Marketplace", icon: TrendingUp },
    { href: "/bridge", label: "Bridge", icon: ArrowLeftRight, comingSoon: true },
  ];

  const resourcesItems: NavItem[] = [
    { href: "https://crossfi.org/", label: "Crossfi", external: true },
    { href: "https://test.xfiscan.com/dashboard", label: "Explorer", external: true },
    { href: "/contact-us", label: "Contact Us" },
  ];

  const navItems: NavItem[] = isConnected
    ? [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/stake", label: "Stake" },
        { href: "/portfolio", label: "Portfolio" },

        { href: "/protocol", label: "Governance", icon: Vote },

        
      ]
    : [
        { href: "/", label: "Home" },
        { href: "https://www.investopedia.com/non-fungible-tokens-nft-5115211", label: "Explore NFTs", external: true },
        { href: "/how-it-works", label: "How It Works" },
        { href: "https://github.com/DIFoundation/StakeAndBake/blob/main/README.md", label: "Docs", external: true },
      ];

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.body.style.overflow = "hidden";
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

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

          {/* Desktop Nav */}
          <div className="hidden md:flex space-x-6 items-center">
            {/* Regular nav items */}
            {navItems.map((item, id) =>
              item.external ? (
                <a
                  key={id}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white text-sm flex items-center gap-1"
                >
                  {item.label}
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <Link
                  key={id}
                  href={item.href}

                  className={`text-sm flex items-center gap-1.5 ${

                    pathname === item.href
                      ? "text-purple-400 font-semibold"
                      : "text-gray-300"
                  } hover:text-white transition-colors`}
                >
                  {item.icon && <item.icon className="w-4 h-4" />}
                  {item.label}
                </Link>
              )
            )}

            {/* Trading Dropdown - Only show when connected */}
            {isConnected && (
              <div className="relative" ref={tradingDropdownRef}>
                <button
                  onClick={() => setTradingDropdownOpen(!tradingDropdownOpen)}
                  className="text-gray-300 hover:text-white text-sm flex items-center gap-1"
                >
                  Trading
                  <ChevronDown className="w-4 h-4" />
                </button>

                
                {tradingDropdownOpen && (
                  <div className="absolute top-full mt-2 right-0 bg-[#121212]/95 border border-gray-700 rounded-lg shadow-xl min-w-[200px] backdrop-blur-md">
                    {tradingItems.map((item, id) => {
                      return (
                        <Link
                          key={id}
                          href={item.href}
                          className={`flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-800/50 transition ${

                            pathname === item.href ? "text-white bg-gray-800/30" : "text-gray-300"
                          } ${id === 0 ? "rounded-t-lg" : ""} ${id === tradingItems.length - 1 ? "rounded-b-lg" : ""}`}
                          onClick={() => setTradingDropdownOpen(false)}
                        >
                          <Layers2 className="w-4 h-4" />

                          {item.label}
                          {item.comingSoon && (
                            <span className="ml-auto text-xs bg-purple-600/20 text-purple-300 px-2 py-0.5 rounded-full">
                              Soon
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Resources Dropdown */}
            <div className="relative" ref={resourcesDropdownRef}>
              <button
                onClick={() => setResourcesDropdownOpen(!resourcesDropdownOpen)}
                className="text-gray-300 hover:text-white text-sm flex items-center gap-1"
              >
                Resources
                <ChevronDown className="w-4 h-4" />
              </button>

              
              {resourcesDropdownOpen && (
                <div className="absolute top-full mt-2 right-0 bg-[#121212]/95 border border-gray-700 rounded-lg shadow-xl min-w-[160px] backdrop-blur-md">
                  {resourcesItems.map((item, id) => (

                    item.external ? (
                      <a
                        key={id}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"

                        className={`flex items-center gap-2 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 transition ${id === 0 ? "rounded-t-lg" : ""} ${id === resourcesItems.length - 1 ? "rounded-b-lg" : ""}`}

                        onClick={() => setResourcesDropdownOpen(false)}
                      >
                        {item.label}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <Link
                        key={id}
                        href={item.href}
                        className={`block px-4 py-3 text-sm hover:bg-gray-800/50 transition ${
                          pathname === item.href ? "text-white bg-gray-800/30" : "text-gray-300"
                        } ${id === 0 ? "rounded-t-lg" : ""} ${id === resourcesItems.length - 1 ? "rounded-b-lg" : ""}`}
                        onClick={() => setResourcesDropdownOpen(false)}
                      >
                        {item.label}
                      </Link>
                    )
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="md:hidden bg-gray-600/50 p-2 rounded-lg focus:outline-none"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <X size={28} className="text-white" />
            ) : (
              <EllipsisVertical size={28} className="text-white" />
            )}
          </button>

          {/* Desktop Wallet */}
          <div className="hidden md:flex items-center space-x-4">
            <ConnectButton
              accountStatus="address"
              chainStatus="icon"
              showBalance={true}
            />
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div
          ref={menuRef}
          className={`md:hidden fixed top-16 left-0 right-0 py-6 px-6 bg-[#121212]/95 border-b border-gray-800 rounded-b-2xl z-40 backdrop-blur-md space-y-6 transition-transform duration-300 ${
            menuOpen ? "translate-y-0" : "translate-y-full"
          }`}
        >
          {/* Regular Nav Items */}
          {navItems.map((item, id) =>
            item.external ? (
              <a
                key={id}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:underline hover:text-white text-base font-medium flex items-center gap-2"
              >
                {item.label}
                <ExternalLink className="w-4 h-4" />
              </a>
            ) : (
              <Link
                key={id}
                href={item.href}
                className={`flex items-center gap-2 text-base font-medium ${
                  pathname === item.href
                    ? "text-purple-400 font-semibold underline"
                    : "text-gray-300"
                } hover:text-white hover:underline`}
                onClick={() => setMenuOpen(false)}
              >
                {item.icon && <item.icon className="w-4 h-4" />}
                {item.label}
              </Link>
            )
          )}

          {/* Trading Section - Mobile */}
          {isConnected && (
            <div className="border-t border-gray-700 pt-4">

              <h4 className="text-sm font-semibold text-gray-400 mb-3">TRADING</h4>
              {tradingItems.map((item, id) => {

                return (
                  <Link
                    key={id}
                    href={item.href}
                    className={`flex items-center gap-3 text-base font-medium mb-3 ${
                      pathname === item.href
                        ? "text-white font-semibold"
                        : "text-gray-300"
                    } hover:text-white`}
                    onClick={() => setMenuOpen(false)}
                  >

                    <Layers2 className="w-4 h-4" />

                    {item.label}
                    {item.comingSoon && (
                      <span className="text-xs bg-purple-600/20 text-purple-300 px-2 py-0.5 rounded-full">
                        Soon
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Resources Section - Mobile */}
          <div className="border-t border-gray-700 pt-4">

            <h4 className="text-sm font-semibold text-gray-400 mb-3">RESOURCES</h4>

            {resourcesItems.map((item, id) =>
              item.external ? (
                <a
                  key={id}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:underline hover:text-white text-base font-medium mb-3 flex items-center gap-2"
                >
                  {item.label}
                  <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <Link
                  key={id}
                  href={item.href}
                  className={`block text-base font-medium mb-3 ${
                    pathname === item.href
                      ? "text-white font-semibold underline"

                    : "text-gray-300"

                  } hover:text-white hover:underline`}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              )
            )}
          </div>

          {/* Mobile Wallet */}
          <div className="border-t border-gray-700 pt-4">
            <div className="flex justify-center">
              <ConnectButton
                accountStatus="address"
                chainStatus="icon"
                showBalance={true}
              />
            </div>
          </div>
        </div>
      )}

      <div className="w-full overflow-hidden bg-gray-100/20 rounded-md py-1 text-center">
        <span className="mx-2 text-sm font-medium text-gray-300">
          You can get the custon xfi token through the faucet with the link: {" "}
          <Link href="https://xfi-faucet.vercel.app/" className="text-white">
            https://xfi-faucet.vercel.app/
          </Link>
        </span>
      </div>
    </nav>
  );
}
