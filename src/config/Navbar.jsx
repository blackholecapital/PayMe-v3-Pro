import React, { useMemo } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import '../styles/Navbar.css'

function isMobile() {
  try { return window.matchMedia && window.matchMedia('(max-width: 900px)').matches } catch { return false }
}

function pickPrimary(connectors) {
  const injected = connectors.find((c) => c.type === 'injected')
  const wc = connectors.find((c) => c.type === 'walletConnect')
  if (isMobile()) return injected || wc || connectors[0]
  return injected || wc || connectors[0]
}

export default function Navbar() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const primary = useMemo(() => pickPrimary(connectors || []), [connectors])

  return (
    <header className="mm-nav">
      <div className="mm-nav-inner">
        <div className="mm-nav-left" />

        <div className="mm-nav-mid">
          <div className="mm-nav-midtext">*** PayMe Lte ***</div>
        </div>

        <div className="mm-nav-right">
          <button
            className="mm-nav-btn"
            onClick={() => (isConnected ? disconnect() : connect({ connector: primary }))}
            disabled={!primary || isPending}
          >
            {isConnected ? 'Disconnect' : isPending ? 'Connecting…' : 'Connect Wallet'}
          </button>
        </div>
      </div>
    </header>
  )
}
