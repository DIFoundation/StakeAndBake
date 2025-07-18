"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
import { useAccount } from "wagmi";
import { usePathname } from "next/navigation";
import { EllipsisVertical, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function Navbar() {
  const { isConnected } = useAccount();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const navItems = isConnected
    ? [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/stake", label: "Stake" },
        { href: "/portfolio", label: "My sbFT" },
        { href: "https://crossfi.org/", label: "Crossfi", external: true },
        {
          href: "https://test.xfiscan.com/dashboard",
          label: "Explorer",
          external: true,
        },
        { href: "/contact-us", label: "Contact Us" },
      ]
    : [
        { href: "/", label: "Home" },
        {
          href: "https://www.investopedia.com/non-fungible-tokens-nft-5115211",
          label: "Explore NFTs",
          external: true,
        },
        { href: "/how-it-works", label: "How It Works" },
        {
          href: "https://github.com/DIFoundation/StakeAndBake/blob/main/README.md",
          label: "Docs",
          external: true,
        },
      ];

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.body.style.overflow = "hidden"; // prevent background scroll
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
                  className={`text-sm flex flex-col items-center ${
                    pathname === item.href
                      ? "text-white font-medium"
                      : "text-gray-300"
                  } hover:text-white`}
                >
                  {item.label}
                </Link>
              )
            )}
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
          <div className="hidden md:block">
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
          className={`md:hidden fixed top-16 left-0 right-0 py-6 px-6 bg-[#121212]/80 border-b border-gray-800 rounded-b-2xl z-40 backdrop-blur-md space-y-6 transition-transform duration-300 ${
            menuOpen ? "translate-y-0" : "translate-y-full"
          }`}
        >
          {navItems.map((item, id) =>
            item.external ? (
              <a
                key={id}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:underline hover:text-white block text-base font-medium"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={id}
                href={item.href}
                className={`block text-base font-medium ${
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

          {/* Mobile Wallet Button */}
          <div className="flex justify-center pt-4">
            <ConnectButton
              accountStatus="address"
              chainStatus="icon"
              showBalance={true}
            />
          </div>
        </div>
      )}
    </nav>
  );
}
