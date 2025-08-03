// pages/how-it-works.tsx
import Head from 'next/head';

export default function HowItWorks() {
  return (
    <>
      <Head>
        <title>How It Works | XFI Liquid Staking Protocol</title>
        <meta name="description" content="Learn how XFI liquid staking with auto-compounding sbFT tokens works." />
      </Head>

      <main className="bg-[#0F172A]/50 mt-16 mx-40 text-[#F1F5F9] min-h-screen px-6 py-12 md:px-24">
        <div className="max-w-5xl mx-auto space-y-12">
          <h1 className="text-4xl md:text-5xl font-bold text-center text-white">
            How Liquid Staking Works
          </h1>

          {/* Innovation Highlight */}
          <section className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-blue-300">🚀 The Innovation</h2>
            <p className="text-[#CBD5E1] text-lg">
              Unlike traditional staking that locks your tokens, you receive <strong>liquid sbFT tokens</strong> that 
              automatically appreciate in value through an increasing exchange rate. Earn <strong>8% APY continuously</strong> 
              without manual claiming while maintaining full liquidity!
            </p>
          </section>

          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Stake XFI → Receive Liquid sbFT</h2>
            <p className="text-[#CBD5E1]">
              Stake your <strong>XFI tokens</strong> and instantly receive <strong>sbFT tokens</strong> at the current exchange rate. 
              These sbFT tokens are fully liquid and tradeable.
            </p>
            <p className="mt-2 text-[#94A3B8] italic">
              Example: If exchange rate is 1.05, stake 100 XFI → receive ~95.24 sbFT (after 1% fee)
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Auto-Compounding Through Exchange Rate</h2>
            <p className="text-[#CBD5E1] mb-4">
              Your sbFT tokens automatically become worth more XFI over time through exchange rate appreciation:
            </p>
            <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-4 font-mono text-sm">
              <div className="text-green-400">Initial: 1 sbFT = 1.0 XFI</div>
              <div className="text-yellow-400">After 1 month: 1 sbFT = 1.067 XFI</div>
              <div className="text-blue-400">After 1 year: 1 sbFT = 1.08 XFI (8% APY)</div>
            </div>
            <p className="mt-4 text-[#94A3B8] italic">
              ✨ No manual claiming needed - rewards compound every second automatically!
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Stay Liquid - Use Your sbFT</h2>
            <ul className="list-disc pl-5 space-y-2 text-[#CBD5E1]">
              <li><strong>Trade:</strong> Sell sbFT on our built-in marketplace for USDC</li>
              <li><strong>Transfer:</strong> Send sbFT to other wallets or protocols</li>
              <li><strong>Governance:</strong> Vote on protocol proposals with your sbFT</li>
              <li><strong>Hold:</strong> Keep earning as exchange rate appreciates</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Flexible Exit Options</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-[#1E293B] border border-green-500/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-400 mb-2">Regular Unstaking</h3>
                <p className="text-[#CBD5E1] text-sm">Request unstake → Wait 7 days → Get full XFI value</p>
                <p className="text-[#94A3B8] text-xs mt-2">Best rate, just requires patience</p>
              </div>
              <div className="bg-[#1E293B] border border-yellow-500/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">Emergency Unstaking</h3>
                <p className="text-[#CBD5E1] text-sm">Pay 5-25% penalty → Get XFI instantly</p>
                <p className="text-[#94A3B8] text-xs mt-2">For urgent liquidity needs</p>
              </div>
              <div className="bg-[#1E293B] border border-blue-500/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-400 mb-2">Marketplace Trading</h3>
                <p className="text-[#CBD5E1] text-sm">Sell sbFT for USDC → Market-driven pricing</p>
                <p className="text-[#94A3B8] text-xs mt-2">Immediate settlement</p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Dual Reward System</h2>
            <div className="space-y-4">
              <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-400 mb-2">Primary: Auto-Compounding (8% APY)</h3>
                <p className="text-[#CBD5E1]">
                  Exchange rate increases continuously based on 8% annual yield. Your sbFT automatically 
                  becomes worth more XFI - no action required!
                </p>
              </div>
              <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-4">
                <h3 className="text-lg font-semibold text-purple-400 mb-2">Secondary: Master NFT Distributions</h3>
                <p className="text-[#CBD5E1]">
                  Weekly revenue sharing from platform fees (staking, trading, penalties). 
                  These rewards are claimable separately in XFI tokens.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Governance Participation</h2>
            <p className="text-[#CBD5E1]">
              Your sbFT tokens give you voting power in protocol governance. Participate in decisions about 
              reward rates, fee structures, and protocol upgrades. More sbFT = more voting influence.
            </p>
          </section>

          {/* Comparison Table */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Traditional vs Liquid Staking</h2>
            <div className="overflow-auto border border-[#334155] rounded-lg">
              <table className="w-full table-auto text-left text-sm text-[#CBD5E1]">
                <thead className="bg-[#1E293B] text-[#F1F5F9] uppercase">
                  <tr>
                    <th className="px-4 py-3">Feature</th>
                    <th className="px-4 py-3">Traditional Staking</th>
                    <th className="px-4 py-3">Stake and Bake</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-[#334155]">
                    <td className="px-4 py-2 font-medium">Token Status</td>
                    <td className="px-4 py-2 text-red-400">Locked</td>
                    <td className="px-4 py-2 text-green-400">Liquid (tradeable)</td>
                  </tr>
                  <tr className="border-t border-[#334155]">
                    <td className="px-4 py-2 font-medium">Reward Claiming</td>
                    <td className="px-4 py-2 text-red-400">Manual</td>
                    <td className="px-4 py-2 text-green-400">Automatic</td>
                  </tr>
                  <tr className="border-t border-[#334155]">
                    <td className="px-4 py-2 font-medium">Compounding</td>
                    <td className="px-4 py-2 text-red-400">Manual</td>
                    <td className="px-4 py-2 text-green-400">Automatic (every second)</td>
                  </tr>
                  <tr className="border-t border-[#334155]">
                    <td className="px-4 py-2 font-medium">Exit Options</td>
                    <td className="px-4 py-2">Fixed unlock period</td>
                    <td className="px-4 py-2 text-green-400">Multiple flexible options</td>
                  </tr>
                  <tr className="border-t border-[#334155]">
                    <td className="px-4 py-2 font-medium">Gas Costs</td>
                    <td className="px-4 py-2 text-red-400">High (frequent claiming)</td>
                    <td className="px-4 py-2 text-green-400">Low (minimal transactions)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Fee Structure */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Fee Structure</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-400">Staking Fee</h3>
                <p className="text-2xl font-bold text-white">1%</p>
                <p className="text-[#94A3B8] text-sm">Deducted when staking XFI</p>
              </div>
              <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-400">Emergency Unstaking</h3>
                <p className="text-2xl font-bold text-white">5-25%</p>
                <p className="text-[#94A3B8] text-sm">User-selectable penalty</p>
              </div>
              <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-4">
                <h3 className="text-lg font-semibold text-purple-400">Trading Fee</h3>
                <p className="text-2xl font-bold text-white">2.5%</p>
                <p className="text-[#94A3B8] text-sm">Marketplace transactions</p>
              </div>
            </div>
          </section>

          {/* Quick Summary */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Quick Summary</h2>
            <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 border border-green-500/30 rounded-lg p-6">
              <p className="text-[#CBD5E1] text-lg leading-relaxed">
                <strong className="text-white">Stake XFI</strong> → Get liquid <strong className="text-blue-400">sbFT tokens</strong> → 
                Earn <strong className="text-green-400">8% APY automatically</strong> through exchange rate appreciation → 
                Stay <strong className="text-yellow-400">fully liquid</strong> with multiple exit options → 
                Participate in <strong className="text-purple-400">governance</strong> and earn 
                <strong className="text-pink-400"> bonus distributions</strong>
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}