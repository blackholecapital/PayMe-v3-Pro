import React from 'react';
import useLightCrm from '../hooks/useLightCrm.js';
import CompanyProfileCard from './CompanyProfileCard.jsx';
import CustomersCard from './CustomersCard.jsx';
import InvoiceGeneratorCard from './InvoiceGeneratorCard.jsx';
import InvoicePreviewCard from './InvoicePreviewCard.jsx';
import RecurringBillingCard from './RecurringBillingCard.jsx';
import OpenInvoicesCard from './OpenInvoicesCard.jsx';
import TxHistoryCard from './TxHistoryCard.jsx';

const pillStyle = (active) => ({
  background: active ? '#2f7df6' : '#fff',
  color: active ? '#fff' : '#2f7df6',
  border: active ? 'none' : '1px solid #d5dce5',
  fontWeight: 600,
  fontSize: 13,
  padding: '7px 16px',
  borderRadius: 20,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
});

export default function LightCrmAdmin() {
  const crm = useLightCrm();

  function renderLeftPanel() {
    switch (crm.activeTab) {
      case 'company':
        return (
          <CompanyProfileCard
            company={crm.company}
            onPatch={crm.handleCompanyPatch}
            onSave={crm.handleCompanySave}
            savedMessage={crm.savedMessage}
            collapsed={crm.companyCollapsed}
            onToggleCollapse={() => crm.setCompanyCollapsed((v) => !v)}
          />
        );
      case 'customers':
        return (
          <CustomersCard
            customers={crm.customers}
            selectedCustomerId={crm.selectedCustomerId}
            customerDraft={crm.customerDraft}
            onSelect={crm.handleCustomerSelect}
            onDraftChange={crm.setCustomerDraft}
            onSave={crm.handleCustomerSave}
            onDelete={crm.handleCustomerDelete}
            onToggleRecurring={crm.handleToggleRecurring}
            onExport={crm.handleExportCustomers}
            onImport={crm.handleImportCustomers}
          />
        );
      case 'preview':
        return (
          <InvoicePreviewCard
            company={crm.company}
            customer={crm.selectedCustomer || crm.customerDraft}
            invoiceNumber={crm.invoiceNumber}
            subject={crm.subject}
            amount={crm.effectiveAmount}
            items={crm.invoiceItems}
            generatedLink={crm.generatedLink}
            onPrint={crm.handlePrintPdf}
          />
        );
      case 'recurring':
        return (
          <RecurringBillingCard
            recurringCustomers={crm.recurringCustomers}
            runDate={crm.recurringRunDate}
            onRunDateChange={crm.setRecurringRunDate}
            onPrintAll={crm.handlePrintRecurringPdf}
            company={crm.company}
            invoiceNumber={crm.invoiceNumber}
            amount={crm.effectiveAmount}
            items={crm.invoiceItems}
          />
        );
      case 'open':
        return <OpenInvoicesCard openInvoices={crm.openInvoices} />;
      case 'history':
        return <TxHistoryCard timeline={crm.timeline} onRefresh={crm.refreshTimeline} />;
      default:
        return null;
    }
  }

  const invoiceGenerator = (
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
  );

  return (
    <div style={{ overflowX: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
        <h2 style={{ color: '#2f7df6', margin: 0 }}>PayMe-Pro</h2>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {crm.CRM_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => crm.setActiveTab(tab.key)}
              style={pillStyle(crm.activeTab === tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop: side-by-side | Mobile: invoice generator on top, active tab below */}
      <div className="crm-layout" style={{ display: 'grid', gap: 16, alignItems: 'start' }}>
        <div className="crm-left" style={{ minWidth: 0 }}>{renderLeftPanel()}</div>
        <div className="crm-right" style={{ minWidth: 0 }}>{invoiceGenerator}</div>
      </div>

      <style>{`
        .crm-layout {
          grid-template-columns: 1fr 1fr;
        }
        .crm-right { order: 0; }
        .crm-left  { order: 0; }

        @media (max-width: 768px) {
          .crm-layout {
            grid-template-columns: 1fr !important;
          }
          .crm-right { order: -1; }
          .crm-left  { order: 0; }
        }
      `}</style>
    </div>
  );
}
