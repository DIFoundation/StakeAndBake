import { cookieStorage, createStorage } from '@wagmi/core'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { xfiTestnet } from '@/lib/chains'

export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || "3815d2e1168083c700a0d194dafdb7d2"

if (!projectId) {
  throw new Error('Project ID is not defined')
}

export const networks = [xfiTestnet]

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage
  }),
  ssr: true,
  projectId,
  networks
})

export const config = wagmiAdapter.wagmiConfig
