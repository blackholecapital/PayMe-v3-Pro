import React from 'react';
import useLightCrm from '../hooks/useLightCrm.js';
import CompanyProfileCard from './CompanyProfileCard.jsx';
import CustomersCard from './CustomersCard.jsx';
import InvoiceGeneratorCard from './InvoiceGeneratorCard.jsx';
import TxHistoryCard from './TxHistoryCard.jsx';

export default function LightCrmAdmin() {
  const crm = useLightCrm();

  return (
    <div>
      <h2 style={{ color: '#2f7df6', marginTop: 0 }}>Light CRM</h2>
      <div style={{ color: '#5f6c7b', marginBottom: 18 }}>
        v2 CRM records now live as a modular feature inside v3, without merging directly into host checkout logic.
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        <CompanyProfileCard
          company={crm.company}
          onPatch={crm.handleCompanyPatch}
          savedMessage={crm.savedMessage}
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          <CustomersCard
            customers={crm.customers}
            selectedCustomerId={crm.selectedCustomerId}
            customerDraft={crm.customerDraft}
            onSelect={crm.handleCustomerSelect}
            onDraftChange={crm.setCustomerDraft}
            onSave={crm.handleCustomerSave}
            onDelete={crm.handleCustomerDelete}
          />

          <InvoiceGeneratorCard
            invoiceNumber={crm.invoiceNumber}
            subject={crm.subject}
            invoiceItems={crm.invoiceItems}
            effectiveAmount={crm.effectiveAmount}
            generatedLink={crm.generatedLink}
            selectedCustomer={crm.selectedCustomer}
            setInvoiceNumber={crm.setInvoiceNumber}
            setSubject={crm.setSubject}
            setAmount={crm.setAmount}
            setInvoiceItems={crm.setInvoiceItems}
            onCreateLink={crm.createPaymentRequest}
            onCopyLink={crm.handleCopyLink}
            onDownloadText={crm.handleDownloadText}
            onDownloadHtml={crm.handleDownloadHtml}
            mailtoHref={crm.mailtoHref}
            statusMessage={crm.statusMessage}
          />
        </div>

        <TxHistoryCard timeline={crm.timeline} onRefresh={crm.refreshTimeline} />
      </div>
    </div>
  );
}
