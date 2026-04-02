import React, { useCallback, useEffect, useMemo, useState } from "react";
import "../styles/PaymentLanding.css";

import { loadAdminConfig, saveAdminConfig, getLocalHistory, appendLocalHistory, clearLocalHistory } from "../services/adminStore.js";
import { shortAddr, copyText } from "../utils/format.js";

function buildMailtoHref({ emailTo, subject, body }) {
  if (!emailTo) return "";
  const u = new URL(`mailto:${emailTo}`);
  if (subject) u.searchParams.set("subject", subject);
  if (body) u.searchParams.set("body", body);
  return u.toString();
}

function buildTxUrl(txHash, chainId) {
  if (!txHash) return '';
  if (chainId === 8453) return `https://basescan.org/tx/${txHash}`;
  if (chainId === 1) return `https://etherscan.io/tx/${txHash}`;
  return '';
}

function buildEmailBody({ emailFrom, invoiceNumber, amount, subject, generatedLink }) {
  const lines = [];
  if (emailFrom) lines.push(`From: ${emailFrom}`);
  if (subject) lines.push(`Subject: ${subject}`);
  lines.push("");
  if (invoiceNumber) lines.push(`Memo: ${invoiceNumber}`);
  if (amount) lines.push(`Amount: ${amount} USDC`);
  lines.push("");
  if (generatedLink) lines.push(`Pay link: ${generatedLink}`);
  return lines.join("\n");
}

export default function AdminPanel() {
  const [receiveAddress, setReceiveAddress] = useState("");
  const [alertEmail, setAlertEmail] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  // invoice fields
  const [emailTo, setEmailTo] = useState("");
  const [emailFrom, setEmailFrom] = useState("");
  const [subject, setSubject] = useState("USDC payment request");
  const [invoiceNumber, setInvoiceNumber] = useState("INV-888XYZ");
  const [amount, setAmount] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [copyMsg, setCopyMsg] = useState("");

  const [history, setHistory] = useState([]);

  const refreshHistory = useCallback(() => {
    setHistory(getLocalHistory());
  }, []);

  useEffect(() => {
    const s = loadAdminConfig();
    const savedAlert = s.alertEmail || "";
    setReceiveAddress(s.receiveAddress || "");
    setAlertEmail(savedAlert);
    setEmailFrom(savedAlert || "");
    refreshHistory();
  }, [refreshHistory]);

  useEffect(() => {
    const onFocusRefresh = () => refreshHistory();
    const onVisibilityRefresh = () => {
      if (document.visibilityState === "visible") refreshHistory();
    };
    window.addEventListener("focus", onFocusRefresh);
    window.addEventListener("storage", onFocusRefresh);
    document.addEventListener("visibilitychange", onVisibilityRefresh);
    return () => {
      window.removeEventListener("focus", onFocusRefresh);
      window.removeEventListener("storage", onFocusRefresh);
      document.removeEventListener("visibilitychange", onVisibilityRefresh);
    };
  }, [refreshHistory]);

  useEffect(() => {
    if (!emailFrom && alertEmail) setEmailFrom(alertEmail);
  }, [alertEmail, emailFrom]);

  const mailtoHref = useMemo(() => {
    if (!generatedLink) return "";
    const body = buildEmailBody({ emailFrom, invoiceNumber, amount, subject, generatedLink });
    return buildMailtoHref({
      emailTo,
      subject: subject || "Invoice",
      body,
    });
  }, [generatedLink, invoiceNumber, amount, emailFrom, alertEmail, emailTo, subject]);

  const emailBodyText = useMemo(() => {
    return buildEmailBody({ emailFrom, invoiceNumber, amount, subject, generatedLink });
  }, [emailFrom, invoiceNumber, amount, subject, generatedLink]);

  const onSave = () => {
    saveAdminConfig({ receiveAddress, alertEmail });
    setSavedMsg("Saved.");
    setTimeout(() => setSavedMsg(""), 1500);
  };

  function onGenerateLink() {
    const u = new URL(window.location.origin + "/");
    u.searchParams.set("locked", "1");
    if (amount) u.searchParams.set("amt", String(amount));
    if (invoiceNumber) u.searchParams.set("inv", String(invoiceNumber));
    if (toAddress) u.searchParams.set("to", String(toAddress));
    const link = u.toString();
    setGeneratedLink(link);

    appendLocalHistory({
      kind: "INVOICE",
      status: "GENERATED",
      invoiceRef: invoiceNumber || "",
      amountDisplay: amount || "",
      toAddress: toAddress || receiveAddress || "",
      link,
      emailTo,
      emailFrom,
      subject,
      ts: Date.now(),
    });
    refreshHistory();
  }

  function onCopyLink() {
    if (!generatedLink) return;
    copyText(generatedLink);
  }

  function onCopyEmail() {
    const to = emailTo ? `To: ${emailTo}\n` : "";
    const subj = subject ? `Subject: ${subject}\n` : "";
    const full = `${to}${subj}\n${emailBodyText}`;
    copyText(full);
    setCopyMsg("Copied!");
    setTimeout(() => setCopyMsg(""), 1500);
  }

  return (
    <div className="pl-root">
      <div className="pl-admin-grid">
        <div className="window-card pl-card pl-card--admin pl-card--admin-fixed">
        <div className="pl-card-top">
          <div className="pl-title pl-title--center">*** USDC Payment Request ***</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <a className="pl-linkbtn" href="/?locked=1">Pmt Card</a>
          </div>
        </div>

        {/* Quick recipient row */}
        <div style={{ marginTop: 14 }}>
          <div className="pl-box-title" style={{ marginBottom: 8 }}>Recipient</div>
          <div className="pl-two-col">
            <div className="pl-field" style={{ marginTop: 0 }}>
              <div className="pl-label">Email to recipient</div>
              <input
                className="pl-input"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                placeholder="to@domain.com"
              />
            </div>
            <div className="pl-field" style={{ marginTop: 0 }}>
              <div className="pl-label">Email From (label only)</div>
              <input
                className="pl-input"
                value={emailFrom}
                onChange={(e) => setEmailFrom(e.target.value)}
                placeholder="billing@domain.com"
              />
            </div>
          </div>
        </div>

        {/* Invoice section */}
        <div style={{ marginTop: 14 }}>
          <div className="pl-box-title" style={{ marginBottom: 8 }}>Payment request memo</div>
          <div className="pl-two-col">
            <div className="pl-field" style={{ marginTop: 0 }}>
              <div className="pl-label">Memo</div>
              <input
                className="pl-input"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="INV-1234"
              />
            </div>
            <div className="pl-field" style={{ marginTop: 0 }}>
              <div className="pl-label">Total due (USDC)</div>
              <input
                className="pl-input"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 100.00"
              />
            </div>
          </div>

          <div className="pl-field">
            <div className="pl-label">Subject</div>
            <input
              className="pl-input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Invoice for services"
            />
          </div>

          <div className="pl-field">
            <div className="pl-label">Wallet address to receive (override optional)</div>
            <input
              className="pl-input"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              placeholder="0x... (optional — uses default if blank)"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="pl-sizebtn" onClick={onGenerateLink}>
            Generate locked link
          </button>
          <button className="pl-sizebtn" onClick={onCopyLink} disabled={!generatedLink}>
            Copy link
          </button>
          <a
            className="pl-linkbtn"
            href={mailtoHref || "#"}
            style={{ pointerEvents: mailtoHref ? "auto" : "none", opacity: mailtoHref ? 1 : 0.55 }}
          >
            Email draft (Gmail)
          </a>
          <button className="pl-sizebtn" onClick={onCopyEmail} disabled={!generatedLink}>
            {copyMsg || "Copy email"}
          </button>
        </div>

        {generatedLink ? (
          <div className="pl-field" style={{ marginTop: 12 }}>
            <div className="pl-label">Generated link</div>
            <input className="pl-input" value={generatedLink} readOnly />
          </div>
        ) : null}

        {/* Settings — collapsed at bottom */}
        <div style={{ marginTop: 24, borderTop: "1px solid rgba(0,255,170,.12)", paddingTop: 14 }}>
          <div className="pl-box-title" style={{ marginBottom: 8, opacity: 0.7 }}>Settings</div>
          <div className="pl-two-col">
            <div className="pl-field" style={{ marginTop: 0 }}>
              <div className="pl-label">Default receive address</div>
              <input
                className="pl-input"
                value={receiveAddress}
                onChange={(e) => setReceiveAddress(e.target.value)}
                placeholder="0x..."
              />
            </div>
            <div className="pl-field" style={{ marginTop: 0 }}>
              <div className="pl-label">Alert email (notifications)</div>
              <input
                className="pl-input"
                value={alertEmail}
                onChange={(e) => setAlertEmail(e.target.value)}
                placeholder="you@domain.com"
              />
            </div>
          </div>
          <button className="pl-btn" onClick={onSave} style={{ marginTop: 4 }}>
            Save Settings
          </button>
          {savedMsg ? <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>{savedMsg}</div> : null}
        </div>

        </div>

        <div className="window-card pl-card pl-card--history">
          <div className="pl-box-title" style={{ marginBottom: 8, opacity: 0.7 }}>History</div>
          <div style={{ marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ color: "var(--muted)", fontSize: 12 }}>Refresh history to update payment status.</div>
            <button className="pl-sizebtn" onClick={refreshHistory}>Refresh</button>
          </div>

          {history.length === 0 ? (
            <div style={{ color: "var(--muted)", fontSize: 12 }}>No local history yet.</div>
          ) : (
            <div className="pl-history-scroll pl-history-list" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="pl-history-row pl-history-row--head">
                <div className="pl-history-col">TXID Link</div>
                <div className="pl-history-col">Amount</div>
                <div className="pl-history-col">Status</div>
                <div className="pl-history-col">Date / Time</div>
              </div>
              {history.map((row, idx) => {
                const rawStatus = String(row.status || row.kind || "UNKNOWN").toUpperCase();
                const statusText = rawStatus === "SENT" ? "PMT RECEIVED" : rawStatus;
                const amountText = row.amountDisplay ? String(row.amountDisplay) : "—";
                const txUrl = row.txLink || buildTxUrl(row.txHash, row.chainId) || row.link || "";
                const isTxRow = !!row.txHash;
                const linkLabel = isTxRow ? "TXID link" : row.kind === "INVOICE" && row.link ? "Invoice link" : "(no link)";
                const linkTitle = row.txHash || row.link || row.invoiceRef || "no-link";
                return (
                  <div key={idx} className="pl-kv-row pl-history-row">
                    <div className="pl-history-col pl-history-col--txlink">
                      {txUrl ? (
                        <a className="pl-a pl-history-primary-link" href={txUrl} target={isTxRow ? "_blank" : undefined} rel={isTxRow ? "noreferrer" : undefined} title={linkTitle}>
                          {linkLabel}
                        </a>
                      ) : (
                        <span style={{ color: "var(--muted)" }}>{linkLabel}</span>
                      )}
                      {row.txHash ? (
                        <>
                          <span className="pl-mono" title={row.txHash}>{shortAddr(row.txHash)}</span>
                          <button className="pl-sizebtn" onClick={() => copyText(row.txHash)}>copy</button>
                        </>
                      ) : null}
                    </div>
                    <div className="pl-history-col pl-history-col--amount" title={amountText}>{amountText}</div>
                    <div className="pl-history-col pl-history-col--status" title={statusText}>{statusText}</div>
                    <div className="pl-history-col pl-history-col--time">
                      {row.ts ? new Date(row.ts).toLocaleString() : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button className="pl-sizebtn" onClick={refreshHistory}>
              Refresh History
            </button>
            <button className="pl-sizebtn" onClick={() => { clearLocalHistory(); refreshHistory(); }}>
              Clear History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
