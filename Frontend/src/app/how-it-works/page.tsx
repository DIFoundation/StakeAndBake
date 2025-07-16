// pages/how-it-works.tsx
import Head from 'next/head';

export default function HowItWorks() {
  return (
    <>
      <Head>
        <title>How It Works | XFI Staking Protocol</title>
        <meta name="description" content="Learn how the XFI staking and sbFT fractional NFT system works." />
      </Head>

      <main className="bg-[#0F172A]/50 mt-16 mx-40 text-[#F1F5F9] min-h-screen px-6 py-12 md:px-24">
        <div className="max-w-5xl mx-auto space-y-12">
          <h1 className="text-4xl md:text-5xl font-bold text-center text-white">
            How It Works
          </h1>

          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Stake Your XFI</h2>
            <p className="text-[#CBD5E1]">
              Stake your <strong>XFI tokens</strong> and instantly mint a fractional NFT token called <strong>sbFT</strong>, which represents the exact value of your staked amount.
            </p>
            <p className="mt-2 text-[#94A3B8] italic">Example: Stake 100 XFI → Receive 100 sbFT</p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Use Your sbFT</h2>
            <ul className="list-disc pl-5 space-y-2 text-[#CBD5E1]">
              <li><strong>Trade:</strong> Sell or transfer sbFT on supported marketplaces.</li>
              <li><strong>Governance:</strong> Use sbFT for voting or DAO elections.</li>
              <li><strong>Bridging:</strong> Use sbFT for cross-chain access (coming soon).</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Staking Duration</h2>
            <p className="text-[#CBD5E1]">
              Each staking round lasts <strong>15 days</strong>. You can stake at any time. The longer you hold sbFT, the more rewards you earn.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Earning Rewards</h2>
            <p className="text-[#CBD5E1]">
              At the end of the staking cycle:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-[#CBD5E1] mt-2">
              <li>Rewards are based on how much sbFT you still hold and for how long.</li>
              <li>Burn your sbFT to claim your proportional reward.</li>
            </ul>
            <p className="mt-2 text-[#94A3B8] italic">More sbFT held for longer = more rewards</p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Force Withdrawals</h2>
            <p className="text-[#CBD5E1]">
              You may withdraw your XFI before 15 days, but you’ll <span className="text-[#EF4444] font-semibold">forfeit any rewards</span> and your sbFT will be burned.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Redemption</h2>
            <p className="text-[#CBD5E1]">
              After the staking period ends, users can burn their sbFT and receive XFI rewards proportional to their remaining stake.
            </p>
          </section>

          {/* Summary Table */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Quick Summary</h2>
            <div className="overflow-auto border border-[#334155] rounded-lg">
              <table className="w-full table-auto text-left text-sm text-[#CBD5E1]">
                <thead className="bg-[#1E293B] text-[#F1F5F9] uppercase">
                  <tr>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Result</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-[#334155]">
                    <td className="px-4 py-2">Stake XFI</td>
                    <td className="px-4 py-2">Mint sbFT of equal value</td>
                  </tr>
                  <tr className="border-t border-[#334155]">
                    <td className="px-4 py-2">Hold sbFT</td>
                    <td className="px-4 py-2">Earn proportional rewards</td>
                  </tr>
                  <tr className="border-t border-[#334155]">
                    <td className="px-4 py-2">Sell sbFT</td>
                    <td className="px-4 py-2">Lower your reward eligibility</td>
                  </tr>
                  <tr className="border-t border-[#334155]">
                    <td className="px-4 py-2">Burn sbFT</td>
                    <td className="px-4 py-2">Claim final rewards</td>
                  </tr>
                  <tr className="border-t border-[#334155]">
                    <td className="px-4 py-2">Withdraw early</td>
                    <td className="px-4 py-2 text-[#EF4444]">No rewards, sbFT is burned</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
