import React, { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useAccount, useChainId } from 'wagmi'
import { watchAccount, getAccount } from 'wagmi/actions'
import '../styles/PaymentLanding.css'

import { BASE_CHAIN_ID, RECEIVING_ADDRESS } from '../config/constants.js'
import { displayToRaw } from '../utils/amounts.js'
import { getParam } from '../utils/query.js'
import { shortAddr, copyText } from '../utils/format.js'

import { loadAdminConfig, appendInboundPing, appendLocalHistory } from '../services/adminStore.js'
import { submitPayment, confirmPayment, getPaymentStatus } from '../services/paymentsApi.js'
import { connectWallet, selectNetwork, sendUsdc, wagmiConfig } from '../services/usdcTransfer.js'

function stableInvoiceRefFromLocation() {
  try {
    const raw = `${window.location.pathname}${window.location.search}`
    let hash = 0
    for (let i = 0; i < raw.length; i += 1) {
      hash = (hash * 31 + raw.charCodeAt(i)) >>> 0
    }
    return `LOCK-${hash.toString(36).toUpperCase()}`
  } catch {
    return 'LOCK-LOCAL'
  }
}

const STAGES = {
  IDLE: 'DISCONNECTED',
  CONNECTED: 'CONNECTED',
  SENDING: 'SENDING',
  SENT: 'SENT',
  CONFIRMED: 'CONFIRMED',
  RECEIVED: 'RECEIVED',
  ERROR: 'ERROR',
}


const LOCKED_RECEIPT_KEY = 'usdc_xyz_locked_receipts_v1'

function getLockedReceiptSignature() {
  try {
    return `${window.location.pathname}${window.location.search}`
  } catch {
    return ''
  }
}

function readLockedReceipts() {
  try {
    const raw = localStorage.getItem(LOCKED_RECEIPT_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function getLockedReceipt() {
  const sig = getLockedReceiptSignature()
  if (!sig) return null
  const map = readLockedReceipts()
  return map[sig] || null
}

function saveLockedReceipt(receipt) {
  const sig = getLockedReceiptSignature()
  if (!sig) return
  const next = {
    txHash: String(receipt?.txHash || ''),
    invoiceRef: String(receipt?.invoiceRef || ''),
    amountDisplay: String(receipt?.amountDisplay || ''),
    stage: String(receipt?.stage || STAGES.SENT),
    ts: Date.now(),
  }
  try {
    const map = readLockedReceipts()
    map[sig] = next
    localStorage.setItem(LOCKED_RECEIPT_KEY, JSON.stringify(map))
  } catch {}
}

export default function PaymentLanding({
  mode = 'pay', // pay | locked
  lockedAmount = '',
  invoiceValue = '',
  invoiceEditable = true,
  receivingAddressOverride = '',
}) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()

   const [networkChoice, setNetworkChoice] = useState('base')
  const [invoiceRef, setInvoiceRef] = useState('UNKNOWN')
  const [amountDisplay, setAmountDisplay] = useState('')
  const [txHash, setTxHash] = useState('')
  const [stage, setStage] = useState(STAGES.IDLE)
  const [forcedAddress, setForcedAddress] = useState(null)
  const [observedChainId, setObservedChainId] = useState(null)
  const [err, setErr] = useState('')
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const [showTxInfo, setShowTxInfo] = useState(false)
  const [lockedReceipt, setLockedReceipt] = useState(null)

  const effectiveAddress = address || forcedAddress
  const effectiveConnected = isConnected || !!forcedAddress
  const effectiveChainId = effectiveConnected
    ? observedChainId
    : chainId

  const { receivingAddress, alertEmail } = useMemo(() => {
    const cfg = loadAdminConfig()
    const adminReceive = (cfg?.receiveAddress || '').trim()
    const adminAlert = (cfg?.alertEmail || '').trim()
    const envReceive = (RECEIVING_ADDRESS || '').trim()
    const resolved = (receivingAddressOverride || '').trim() || adminReceive || envReceive
    return { receivingAddress: resolved, alertEmail: adminAlert }
  }, [receivingAddressOverride])

  const lockedFallbackInvoiceRef = useMemo(() => {
    if (mode !== 'locked') return ''
    return stableInvoiceRefFromLocation()
  }, [mode])
  
  const lockedInvoiceRefValue = invoiceValue || invoiceRef || lockedFallbackInvoiceRef  
  const resolvedInvoiceRef = (mode === 'locked' ? lockedInvoiceRefValue : invoiceRef) || 'UNKNOWN'
    
  useEffect(() => {
    const inv = getParam('inv') || getParam('invoiceNumber')
    const amt = getParam('amt') || getParam('amount')
    if (!invoiceValue) setInvoiceRef(inv ? inv : mode === 'locked' ? lockedFallbackInvoiceRef : 'UNKNOWN')
    if (mode === 'locked') setAmountDisplay(lockedAmount ? lockedAmount : '')
    else setAmountDisplay(amt ? amt : '')
  }, [mode, lockedAmount, invoiceValue, lockedFallbackInvoiceRef])

  useEffect(() => {
    if (chainId === BASE_CHAIN_ID) setNetworkChoice('base')
    else if (chainId === 1) setNetworkChoice('ethereum')
  }, [chainId])

  useEffect(() => {
    if (!effectiveConnected) setStage(STAGES.IDLE)
    else setStage(STAGES.CONNECTED)
  }, [effectiveConnected])

  // Ensure UI updates immediately after wallet connect without manual page refresh
  useEffect(() => {
    const unwatch = watchAccount(wagmiConfig, {
      onChange: (acct) => {
        const connected = !!acct?.address
        if (!connected) {
          setForcedAddress(null)
          setObservedChainId(null)
          setStage(STAGES.IDLE)
          return
        }

        setForcedAddress(acct.address)
        setObservedChainId(typeof acct.chainId === 'number' ? acct.chainId : null)
        setStage(STAGES.CONNECTED)
      },
    })

    // one-time sync in case provider state is already connected
    const acct = getAccount(wagmiConfig)
    if (acct?.address) {
      setForcedAddress(acct.address)
      setObservedChainId(typeof acct.chainId === 'number' ? acct.chainId : null)
      setStage(STAGES.CONNECTED)
    }

    return () => {
      try {
        unwatch?.()
      } catch {
        // noop
      }
    }
  }, [])

  const amountRaw = useMemo(() => {
    try {
      if (!amountDisplay) return null
      const normalized = String(amountDisplay).trim().replace(/^\./, '0.')
      return displayToRaw(normalized)
    } catch {
      return null
    }
  }, [amountDisplay])

  const connectMut = useMutation({
    mutationFn: async () => {
      setErr('')

      // Connect via wagmi actions (MetaMask injected preferred)
      const res = await connectWallet()

      // Immediately reflect connected state in UI (no second click / no manual refresh)
      const acct = getAccount(wagmiConfig)
      const addr = (res?.accounts && res.accounts[0]) || acct?.address
      const cid = res?.chainId || acct?.chainId

      if (!addr) throw new Error('Wallet connection was not detected — please retry')

      setForcedAddress(addr)
      setObservedChainId(typeof cid === 'number' ? cid : null)
    },
    onSuccess: () => setStage(STAGES.CONNECTED),
    onError: (e) => {
      setErr(e?.message || 'Connect failed')
      setStage(STAGES.ERROR)
    },
  })

  const confirmMut = useMutation({
    mutationFn: async (overrideTxHash) => {
      setErr('')
      if (!receivingAddress) throw new Error('Receiving address is not configured (env or admin)')
      const safeTx = overrideTxHash || txHash || ''
      const txLink = safeTx ? `https://basescan.org/tx/${safeTx}` : ''
      const res = await confirmPayment({
        invoiceRef: resolvedInvoiceRef,
        chainId: BASE_CHAIN_ID,
        fromAddress: effectiveAddress || '',
        toAddress: receivingAddress,
        amountDisplay,
        txHash: safeTx,
        alertEmail,
      })
      const historyRow = {
        invoiceRef: resolvedInvoiceRef,
        amountDisplay,
        chainId: BASE_CHAIN_ID,
        fromAddress: effectiveAddress || '',
        toAddress: receivingAddress,
        txHash: safeTx,
        status: 'CONFIRMED',
        txLink,
      }
      appendLocalHistory(historyRow)
      appendInboundPing({
        kind: 'PING',
        message: 'Payment sent confirmation received',
        invoiceRef: resolvedInvoiceRef,
        amountDisplay,
        chainId: BASE_CHAIN_ID,
        txHash: safeTx,
        txLink,
        status: 'PAYMENT_SENT',
      })
      return res
    },
    onSuccess: () => setStage(STAGES.CONFIRMED),
    onError: (e) => {
      setErr(e?.message || 'Confirm failed')
      setStage(STAGES.ERROR)
    },
  })

  const sendMut = useMutation({
    mutationFn: async () => {
      setErr('')
      if (!receivingAddress) throw new Error('Receiving address is not configured (env or admin)')
      if (!amountRaw) throw new Error('Enter a valid amount')
      setStage(STAGES.SENDING)
      const hash = await sendUsdc({ to: receivingAddress, amountRaw })
      setTxHash(hash)
      setStage(STAGES.SENT)
      return hash
    },
    onSuccess: async (hash) => {
      appendLocalHistory({
        invoiceRef: resolvedInvoiceRef,
        amountDisplay,
        amountRaw: amountRaw ? amountRaw.toString() : '',
        chainId: BASE_CHAIN_ID,
        fromAddress: address || '',
        toAddress: receivingAddress,
        txHash: hash,
        status: 'SENT',
      })
      if (mode === 'locked') {
        const receipt = { txHash: hash, invoiceRef: resolvedInvoiceRef, amountDisplay, stage: STAGES.SENT }
        setLockedReceipt(receipt)
        saveLockedReceipt(receipt)
      }
      try {
        await submitPayment({
          invoiceRef: resolvedInvoiceRef,
          amountDisplay,
          amountRaw: amountRaw ? amountRaw.toString() : '',
          chainId: BASE_CHAIN_ID,
          fromAddress: address || '',
          toAddress: receivingAddress,
          txHash: hash,
          alertEmail,
        })
      } catch (e) {
        setErr((e?.message || 'Backend submit failed') + ' (tx sent)')
      }
    },
    onError: (e) => {
      setErr(e?.message || 'Send failed')
      setStage(STAGES.ERROR)
    },
  })

  const statusQuery = useQuery({
    queryKey: ['paymentStatus', resolvedInvoiceRef, txHash],
    queryFn: async () => getPaymentStatus({ invoiceRef: resolvedInvoiceRef, txHash }),
    enabled: Boolean(txHash) && stage === STAGES.SENT,
    refetchInterval: 5000,
  })

  useEffect(() => {
    if (mode !== 'locked') return
    const existing = getLockedReceipt()
    if (!existing) return
    setLockedReceipt(existing)
    if (existing.txHash) setTxHash(existing.txHash)
    if (existing.stage) setStage(existing.stage)
   }, [mode])

  const lockedStatusQuery = useQuery({
    queryKey: ['lockedInvoiceStatus', lockedInvoiceRefValue],
    queryFn: async () => getPaymentStatus({ invoiceRef: lockedInvoiceRefValue, txHash: '' }),
    enabled: mode === 'locked' && Boolean(lockedInvoiceRefValue),
    refetchInterval: 15000,
  })

  useEffect(() => {
    const st = String(lockedStatusQuery.data?.status || '').toUpperCase()
    const knownPaid = st === 'RECEIVED' || st === 'CONFIRMED' || st === 'PAYMENT_SENT' || st === 'SENT'
    if (!knownPaid) return

    const knownTx = lockedStatusQuery.data?.txHash || txHash || lockedReceipt?.txHash
    if (knownTx) setTxHash(knownTx)
    const nextStage = st === 'RECEIVED' ? STAGES.RECEIVED : STAGES.SENT
    setStage(nextStage)
    const receipt = {
      txHash: knownTx || '',
      invoiceRef: lockedInvoiceRefValue,
      amountDisplay,
      stage: nextStage,
    }
    setLockedReceipt(receipt)
    saveLockedReceipt(receipt)
  }, [lockedStatusQuery.data, txHash, lockedReceipt?.txHash, lockedInvoiceRefValue, amountDisplay])

  useEffect(() => {
    const st = statusQuery.data?.status
    if (st === 'RECEIVED') {
      setStage(STAGES.RECEIVED)
      appendLocalHistory({
        invoiceRef: resolvedInvoiceRef,
        amountDisplay,
        chainId: BASE_CHAIN_ID,
        fromAddress: address || '',
        toAddress: receivingAddress,
        txHash,
        status: 'RECEIVED',
      })
    }
    if (st === 'FAILED') setStage(STAGES.ERROR)
  }, [statusQuery.data, resolvedInvoiceRef, amountDisplay, address, receivingAddress, txHash])

  const walletLabel = effectiveConnected ? `connected (${shortAddr(effectiveAddress)})` : 'disconnected'
  const isOnBase = effectiveConnected && effectiveChainId === BASE_CHAIN_ID
  const warnOk = effectiveConnected && isOnBase
  const lockedStatus = String(lockedStatusQuery.data?.status || '').toUpperCase()
  const hasPaymentReceipt = Boolean(txHash) || Boolean(lockedReceipt?.txHash) || stage === STAGES.SENT || stage === STAGES.CONFIRMED || stage === STAGES.RECEIVED
  const isLockedLinkPaid = mode === 'locked' && (hasPaymentReceipt || lockedStatus === 'RECEIVED' || lockedStatus === 'CONFIRMED' || lockedStatus === 'PAYMENT_SENT' || lockedStatus === 'SENT')
  const warnClass = isLockedLinkPaid
    ? 'pl-warning pl-warning-paid'
    : warnOk
      ? 'pl-warning pl-warning-ok'
      : 'pl-warning pl-warning-bad'

  const warningLine1 = isLockedLinkPaid ? 'Payment Sent' : 'Base Network Only'
  const warningLine2 = isLockedLinkPaid ? 'Thank you.' : warnOk ? 'Payment rail is ready' : 'Wrong Network'

  const lockedStatusPending = mode === 'locked' && !txHash && !lockedReceipt?.txHash && lockedStatusQuery.isFetching
  const canSend = !!amountRaw && warnOk && !isLockedLinkPaid && !lockedStatusPending
  const canConfirmPayment = !!txHash && stage !== STAGES.RECEIVED

  async function onNetworkChange(e) {
    if (mode === 'locked') return
    const v = e.target.value
    setNetworkChoice(v)
    try {
      setErr('')
      if (v === 'base') await selectNetwork(BASE_CHAIN_ID)
      if (v === 'ethereum') await selectNetwork(1)
    } catch (ex) {
      setErr(ex?.message || 'Network switch failed')
    }
  }

 return (
    <div className="pl-root">
      <div className="pl-stack">
        {showHowItWorks ? (
          <div className="window-card pl-info-card">
            <div className="pl-info-top">
              <div className="pl-title">How payments work</div>
              <button
                type="button"
                className="pl-infoclose"
                onClick={() => setShowHowItWorks(false)}
                aria-label="Close how payments work"
                title="Close"
              >
                ✕
              </button>
            </div>

            <div className="pl-info-body">
              <div className="pl-info-step"><b>1)</b> Send a recipient a link to this page. They enter an invoice # and dollar amount, connect a wallet, and send.</div>
              <div className="pl-info-step"><b>•</b> The TXID is the confirmation receipt (sender → receiving wallet address).</div>
              <div className="pl-info-step"><b>•</b> The UI only allows sending <b>USDC on Base</b> to the configured receiving address.</div>
              <div className="pl-info-step"><b>2)</b> From the Admin panel you can generate a <b>locked</b> payment request.</div>
              <div className="pl-info-step"><b>•</b> The recipient gets an email link where the invoice # and amount are locked. They can only connect a wallet and send the pre-configured amount.</div>
              <div className="pl-info-step"><b>Keep it simple:</b> make it hard to send the wrong amount or the wrong asset.</div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="pl-helpbtn"
            onClick={() => setShowHowItWorks(true)}
            aria-label="Open how payments work"
            title="How payments work"
          >
            ? How it works
          </button>
        )}

        <div className="window-card pl-card pl-card--sm">
        <div className="pl-card-top">
          <div>
            <div className="pl-title">USDC Payment Request</div>
          </div>

          {mode === 'locked' ? (
            <div className="pl-net">
              <label>Network</label>
              <div className="pl-dim" style={{ textAlign: 'right' }}>Base</div>
            </div>
          ) : (
            <div className="pl-net">
              <label>Network</label>
              <select value={networkChoice} onChange={onNetworkChange}>
                <option value="base">Base</option>
                <option value="ethereum">Ethereum</option>
              </select>
            </div>
          )}
        </div>

        <div className="pl-field">
          <label>Invoice #</label>
          <input
            value={invoiceValue || invoiceRef}
            readOnly={mode === 'locked' ? !invoiceEditable : false}
            onChange={(e) => {
              if (mode === 'locked' && !invoiceEditable) return
              setInvoiceRef(e.target.value)
            }}
          />
        </div>

        <div className="pl-field">
          <label>Amount (USDC)</label>
          <input
            placeholder="e.g. 100.00"
            value={amountDisplay}
            readOnly={mode === 'locked'}
            onChange={(e) => {
              if (mode === 'locked') return
              setAmountDisplay(e.target.value)
            }}
          />
        </div>

        <div className={warnClass}>
          <div className="pl-warning-line1">{warningLine1}</div>
          <div className="pl-warning-line2">{warningLine2}</div>
        </div>

        <div className="pl-buttons">
          <button
            className={effectiveConnected ? 'pl-btn-ok' : 'pl-btn-bad'}
            onClick={() => connectMut.mutate()}
            disabled={connectMut.isPending || effectiveConnected}
          >
            {effectiveConnected ? 'Wallet Connected' : connectMut.isPending ? 'Connecting…' : 'Connect Wallet'}
          </button>

          {mode === 'locked' && !isOnBase ? (
            <button
              className={`pl-btn-bad ${effectiveConnected ? 'pl-pulse-red' : 'pl-pulse-red-strong'}`}
              onClick={() => selectNetwork(BASE_CHAIN_ID)}
              disabled={!effectiveConnected || isOnBase}
              title={!effectiveConnected ? 'Connect wallet first' : 'Switch to Base network to continue'}
            >
              Switch to Base Network
            </button>
          ) : null}

          <button
            className={isLockedLinkPaid ? 'pl-btn-info' : canSend ? 'pl-btn-ok pl-pulse-green' : 'pl-btn-bad'}
            onClick={() => sendMut.mutate()}
            disabled={!canSend || sendMut.isPending}
            title={isLockedLinkPaid ? 'Payment has already been sent for this request' : lockedStatusPending ? 'Checking if this locked request has already been paid' : !effectiveConnected ? 'Connect wallet first' : !isOnBase ? 'Switch to Base to send' : !amountRaw ? 'Enter a valid amount' : ''}
          >
            {sendMut.isPending ? 'Sending…' : isLockedLinkPaid ? 'Payment Sent' : lockedStatusPending ? 'Checking status…' : 'Send USDC'}
          </button>
        </div>

        <div className="pl-tabs">
          <button
            className={`pl-tab ${canConfirmPayment ? 'pl-tab-confirm-ok pl-pulse-green' : 'pl-tab-confirm-bad'}`}
            onClick={() => confirmMut.mutate()}
            disabled={!canConfirmPayment || confirmMut.isPending}
            title={!txHash ? 'Send funds first to unlock payment confirmation' : ''}
          >
            {confirmMut.isPending ? 'Sending confirmation…' : canConfirmPayment ? 'Confirm Payment Sent' : 'Confirm Payment'}
          </button>
          <button
            className="pl-tab"
            onClick={() => setShowTxInfo((v) => !v)}
            aria-expanded={showTxInfo}
          >
            {showTxInfo ? 'Hide TX Info' : 'TX Info'}
          </button>
        </div>

        {showTxInfo ? (
        <div className="pl-status">
          <div className="pl-status-row">
            <span>Wallet:</span>
            <span>{walletLabel}</span>
          </div>
          <div className="pl-status-row">
            <span>Network:</span>
            <span>{effectiveChainId === BASE_CHAIN_ID ? 'Base' : effectiveChainId === 1 ? 'Ethereum' : String(effectiveChainId || '')}</span>
          </div>
          <div className="pl-status-row">
            <span>Invoice:</span>
            <span>{invoiceValue || invoiceRef || 'UNKNOWN'}</span>
          </div>
          <div className="pl-status-row">
            <span>Amount:</span>
            <span>{amountDisplay || '(enter amount)'}</span>
          </div>
          <div className="pl-status-row">
            <span>To:</span>
            <span className="pl-mono">{receivingAddress ? shortAddr(receivingAddress) : '(not set)'}</span>
          </div>
          <div className="pl-status-row">
            <span>txHash:</span>
            <span className="pl-tx">
              {txHash ? (
                <>
                  <a
                    className="pl-a pl-mono pl-tx-link"
                    href={`https://basescan.org/tx/${txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    title={txHash}
                  >
                    {shortAddr(txHash)}
                  </a>
                  <button className="pl-copy" onClick={() => copyText(txHash)}>copy</button>
                </>
              ) : (
                <span className="pl-dim">(none)</span>
              )}
            </span>
          </div>
          <div className="pl-status-row">
            <span>Stage:</span>
            <span>{stage}</span>
          </div>
          {statusQuery.isFetching && stage === STAGES.SENT ? (
            <div className="pl-status-row">
              <span>Polling:</span>
              <span>{statusQuery.data?.status || '…'}</span>
            </div>
          ) : null}
        </div>
        ) : null}

        {err ? <div className="pl-error">{err}</div> : null}
      </div>
    </div>
  </div>
  )
}

    
