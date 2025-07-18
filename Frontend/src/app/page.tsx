"use client";
import Head from "next/head";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Repeat, ShieldCheck, Gift, FileText, Link } from "lucide-react";
import Footer from "../components/Footer";

export default function Home() {
  const [timeLeft, setTimeLeft] = useState(60);
  const [isCancelled, setIsCancelled] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (isCancelled) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          router.push("/dashboard");
          return 0;
        }
        return prev - 1;
      });
    }, 500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCancelled, router]);

  const handleCancel = () => {
    setIsCancelled(true);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  return (
    <div className="min-h-screen text-white flex flex-col items-center justify-between pt-20">
      <Head>
        <title>StakeAndBake</title>
        <meta name="description" content="Stake XFI Token, Earn sbFTs" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <section className="relative w-full h-full max-w-5xl mx-auto mt-10 px-4 sm:px-8">
        {/* Background Image Layer */}
        <div
          className="absolute inset-0 bg-center bg-no-repeat bg-cover rounded-lg"
          style={{ backgroundImage: "url('/xfi.png')" }}
        />

        {/* Overlay Content */}
        <div className="relative z-10 backdrop-blur-xs p-8 sm:p-16 rounded-xl text-white text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
            Stake XFI Token, Earn sbFTs
          </h1>
          <p className="max-w-2xl mx-auto mb-8 text-gray-300">
            Participate in the Cross Finance ecosystem by staking your XFI token
            and receive sbFT as fractional NFTs (fNFTs) representing your stake.
            Sell portions of your sbFTs and earn rewards based on your retained
            share at the end of the staking period.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              className="bg-purple-600 px-6 py-2 rounded hover:bg-purple-700 transition flex flex-row items-center gap-2 justify-center"
              onClick={() => router.push("/dashboard")}
            >
              Get Started <Link className="text-purple-300 w-6 h-6" />
            </button>
            <button
              className="bg-purple-500/40 px-6 py-2 rounded hover:bg-purple-500/60 transition flex flex-row items-center gap-2 justify-center"
              onClick={() =>
                window.open(
                  "https://github.com/DIFoundation/StakeAndBake/blob/main/README.md",
                  "_blank"
                )
              }
            >
              Documentation <FileText className="text-purple-200 w-6 h-6" />
            </button>
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-gray-400 mb-2">
              {isCancelled
                ? "Auto redirect cancelled."
                : `You will be automatically redirected to the dashboard in ${timeLeft} seconds...`}
            </p>
            {!isCancelled && (
              <button
                className="bg-white text-gray-900 px-3 py-1 text-sm rounded border border-gray-600 hover:bg-purple-300 transition"
                onClick={handleCancel}
              >
                Cancel Auto Redirect
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 md:px-16 text-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Key Features</h2>
          <p className="text-gray-400 mb-12">
            Explore the benefits of staking with Cross Finance and earning
            fNFTs.
          </p>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-[#27272A] border border-[#3F3F46] rounded-xl p-6 hover:shadow-lg transition">
              <Repeat className="text-purple-400 w-8 h-8 mb-4" />
              <h3 className="font-semibold text-lg mb-2">Flexible Staking</h3>
              <p className="text-gray-400 text-sm">
                Stake either XFI and receive sbFTs representing your stake,
                allowing for flexible participation in the ecosystem.
              </p>
            </div>

            <div className="bg-[#27272A] border border-[#3F3F46] rounded-xl p-6 hover:shadow-lg transition">
              <ShieldCheck className="text-purple-400 w-8 h-8 mb-4" />
              <h3 className="font-semibold text-lg mb-2">
                Secure and Transparent
              </h3>
              <p className="text-gray-400 text-sm">
                Our platform ensures the security and transparency of your
                staked assets and sbFT transactions.
              </p>
            </div>

            <div className="bg-[#27272A] border border-[#3F3F46] rounded-xl p-6 hover:shadow-lg transition">
              <Gift className="text-purple-400 w-8 h-8 mb-4" />
              <h3 className="font-semibold text-lg mb-2">Dynamic Rewards</h3>
              <p className="text-gray-400 text-sm">
                Earn rewards based on your retained sbFT share at the end of the
                staking period, with the ability to sell portions of your fNFTs.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
