import React, { useMemo } from 'react'
import PaymentLanding from './PaymentLanding.jsx'
import { getParam } from '../utils/query.js'

export default function PayLocked() {
  const { lockedAmount, invoiceValue, invoiceEditable, toAddress } = useMemo(() => {
    const amt = getParam('amt') || getParam('amount') || ''
    const inv = getParam('inv') || getParam('invoiceNumber') || ''
    const to = getParam('to') || ''
    return {
      lockedAmount: amt,
      invoiceValue: inv,
      invoiceEditable: inv ? false : true,
      toAddress: to,
    }
  }, [])

  return (
    <PaymentLanding
      mode="locked"
      lockedAmount={lockedAmount}
      invoiceValue={invoiceValue}
      invoiceEditable={invoiceEditable}
      receivingAddressOverride={toAddress}
    />
  )
}
