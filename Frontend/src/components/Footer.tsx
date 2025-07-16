import React from "react";
import Link from "next/link";

function Footer() {
  return (
    <footer className="bg-[#121212] border-t border-[#2A2A2A] py-8 px-6 text-gray-400 text-sm w-full text-center space-y-4">
      <div className="flex justify-center gap-6">
        <a href="#" className="hover:text-white">
          Terms of Service
        </a>
        <a href="#" className="hover:text-white">
          Privacy Policy
        </a>
        <a href="#" className="hover:text-white">
          Contact Us
        </a>
      </div>
      <div className="flex justify-center gap-4 text-gray-500">
        <Link href="https://github.com/DIFoundation/StakeAndBake">
          <i className="fa-brands fa-github"></i>
        </Link>
        <Link href="https://x.com/stakeandbake">
          <i className="fa-brands fa-x-twitter"></i>
        </Link>
        <Link href="https://t.me/stakeandbake">
          <i className="fa-brands fa-telegram"></i>
        </Link>
        <Link href="https://discord.com/invite/stakeandbake">
          <i className="fa-brands fa-discord"></i>
        </Link>
      </div>
      <p className="text-xs text-gray-500">
        © {new Date().getFullYear()} StakeAndBake. All rights reserved.
      </p>
    </footer>
  );
}

export default Footer;
