import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "@/components/Web3Provider";
import Navbar from "@/components/Navbar";
import ToastConfig from '@/components/ToastConfig';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stake & Bake | Stake XFI, Earn sbFTs",
  description:
    "Stake your XFI tokens to earn sbFTs and participate in the ecosystem",
  themeColor: "#121212",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-dark text-light min-h-screen`}
      >
        <Web3Provider>
          <Navbar />
          <main className="min-h-screen relative w-full bg-cover overflow-auto">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute -z-20 top-0 left-0 w-full h-full object-cover"
            >
              <source src="/stake.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div className="absolute inset-0 bg-black -z-10 opacity-80"></div>

            {children}
            <ToastConfig />
          </main>
        </Web3Provider>
      </body>
    </html>
  );
}
