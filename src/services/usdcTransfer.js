import { http, createConfig } from 'wagmi'
import { base, mainnet } from 'wagmi/chains'
import { walletConnect, injected } from 'wagmi/connectors'
import { connect, getAccount, getChainId, writeContract, switchChain } from 'wagmi/actions'
import { BASE_CHAIN_ID, USDC_BASE_ADDRESS } from '../config/constants.js'

const wcProjectId = import.meta.env.VITE_WC_PROJECT_ID || ''

export const wagmiConfig = createConfig({
  chains: [base, mainnet],
  connectors: [
    injected(),
    walletConnect({
      projectId: wcProjectId,
      metadata: {
        name: 'usdc.xyz-labs.xyz',
        description: 'USDC Payment Link',
        url: window.location.origin,
        icons: [],
      },
    }),
  ],
  transports: {
    [base.id]: http(),
    [mainnet.id]: http(),
  },
})

const USDC_ABI = [
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
]

function pickPrimaryConnector() {
  const connectors = wagmiConfig.connectors || []
  const isMobile = window.matchMedia && window.matchMedia('(max-width: 900px)').matches
  const injectedConn = connectors.find((c) => c.type === 'injected')
  const wcConn = connectors.find((c) => c.type === 'walletConnect')
  if (isMobile) return injectedConn || wcConn || connectors[0]
  return injectedConn || wcConn || connectors[0]
}

export async function connectWallet() {
  const connector = pickPrimaryConnector()
  if (!connector) throw new Error('No wallet connector available')
  return connect(wagmiConfig, { connector })
}

export async function selectNetwork(chainId) {
  return switchChain(wagmiConfig, { chainId })
}

export async function sendUsdc({ to, amountRaw }) {
  const chainId = getChainId(wagmiConfig)
  if (chainId !== BASE_CHAIN_ID) {
    throw new Error(`Wrong network. Please switch to Base (${BASE_CHAIN_ID}) before sending.`)
  }
  const account = getAccount(wagmiConfig)
  if (!account?.address) throw new Error('Wallet not connected')

  const txHash = await writeContract(wagmiConfig, {
    address: USDC_BASE_ADDRESS,
    abi: USDC_ABI,
    functionName: 'transfer',
    args: [to, amountRaw],
    chainId: BASE_CHAIN_ID,
  })

  return txHash
}
