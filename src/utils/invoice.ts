import type { Appointment } from "../shared/types";
import { CLINIC } from "../shared/constants";


const LOGO_URL = () => `${window.location.origin}/images/logo.png`;

function formatTime12h(time: string) {
  if (!time) return "";

  const [hours, minutes] = time.split(":").map(Number);

  return new Date(
    0,
    0,
    0,
    hours,
    minutes
  ).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}


/** Opens a printable Daily Record sheet — one row per appointment, dental clinic format. */
export function downloadTreatmentNotes(a: Appointment) {
  const apptDate  = new Date(a.date).toLocaleDateString("en-PH", { month: "2-digit", day: "2-digit", year: "2-digit" });
  const issuedAt  = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });

  // Build tooth numbers string from toothChart if available
  const toothNos = a.toothChart ? Object.keys(a.toothChart).join(", ") : "—";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Daily Record – ${a.patientName} – ${a.date}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #111; background: #fff; padding: 28px 32px; }

  /* ── Clinic header ── */
  .header { display: flex; align-items: center; gap: 14px; border-bottom: 3px solid #8b6914; padding-bottom: 14px; margin-bottom: 18px; }
  .header img { width: 56px; height: 56px; object-fit: contain; }
  .header-text .clinic { font-size: 17px; font-weight: 700; color: #8b6914; }
  .header-text .sub    { font-size: 10px; color: #555; line-height: 1.6; margin-top: 2px; }
  .header-right { margin-left: auto; text-align: right; }
  .header-right .doc-title { font-size: 18px; font-weight: 800; color: #c9a227; text-transform: uppercase; letter-spacing: 2px; }
  .header-right .doc-sub   { font-size: 10px; color: #888; margin-top: 3px; }

  /* ── Meta row ── */
  .meta { display: flex; gap: 32px; margin-bottom: 18px; padding: 10px 14px; background: #fdf9f0; border: 1px solid #e8d89a; border-radius: 4px; }
  .meta-item { display: flex; flex-direction: column; gap: 2px; }
  .meta-item .lbl { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #999; font-weight: 600; }
  .meta-item .val { font-size: 13px; font-weight: 600; color: #1a1a1a; }

  /* ── Daily record table ── */
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  thead tr { background: #8b6914; color: #fff; }
  thead th { padding: 9px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 700; text-align: left; border: 1px solid #7a5c10; }
  tbody td { padding: 10px 10px; border: 1px solid #e0e0e0; font-size: 12px; vertical-align: top; }
  tbody tr:nth-child(even) { background: #fdf9f0; }
  .tooth-cell { font-weight: 700; font-size: 13px; color: #8b6914; text-align: center; }
  .value-cell { font-weight: 700; text-align: right; color: #1a1a1a; }

  /* ── Clinical notes ── */
  .notes-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px; }
  .note-box { border: 1px solid #e0e0e0; border-radius: 4px; overflow: hidden; }
  .note-box .note-head { background: #8b6914; color: #fff; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; padding: 6px 10px; }
  .note-box .note-body { padding: 10px; font-size: 12px; color: #333; line-height: 1.7; min-height: 60px; white-space: pre-wrap; background: #fafafa; }
  .note-box .note-body.empty { color: #bbb; font-style: italic; }

  /* ── Signature row ── */
  .sig-row { display: flex; justify-content: space-between; margin-top: 32px; padding-top: 16px; border-top: 1px solid #ddd; }
  .sig-box { text-align: center; width: 180px; }
  .sig-line { border-top: 1px solid #333; margin-top: 36px; padding-top: 4px; font-size: 10px; color: #555; }

  /* ── Footer ── */
  .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #aaa; border-top: 1px solid #eee; padding-top: 10px; line-height: 1.8; }

  @media print {
    body { padding: 16px 20px; }
    .print-btn { display: none !important; }
  }
</style>
</head>
<body>

  <!-- Clinic Header -->
  <div class="header">
    <img src="${LOGO_URL()}" alt="Logo" onerror="this.style.display='none'"/>
    <div class="header-text">
      <div class="clinic">${CLINIC.name}</div>
      <div class="sub">${CLINIC.address}<br/>${CLINIC.phone} &nbsp;·&nbsp; ${CLINIC.email}</div>
    </div>
    <div class="header-right">
      <div class="doc-title">Daily Record</div>
      <div class="doc-sub">Issued: ${issuedAt}</div>
    </div>
  </div>

  <!-- Meta -->
  <div class="meta">
    <div class="meta-item"><span class="lbl">Date</span><span class="val">${apptDate}</span></div>
    <div class="meta-item"><span class="lbl">Patient</span><span class="val">${a.patientName}</span></div>
    <div class="meta-item"><span class="lbl">Dentist</span><span class="val">${a.doctor}</span></div>
    <div class="meta-item"><span class="lbl">Time</span><span class="val">${formatTime12h(a.time)}</span></div>
    <div class="meta-item"><span class="lbl">Status</span><span class="val" style="text-transform:capitalize">${a.status}</span></div>
  </div>

  <!-- Main Record Table -->
  <table>
    <thead>
      <tr>
        <th style="width:90px">Date</th>
        <th style="width:80px">Tooth #</th>
        <th>Services Rendered</th>
        <th style="width:120px">Dentist</th>
        <th style="width:110px">Value of Work</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${apptDate}</td>
        <td class="tooth-cell">${toothNos}</td>
        <td>
          <strong>${a.serviceName}</strong>
          ${a.diagnosis ? `<br/><span style="font-size:11px;color:#666">Dx: ${a.diagnosis}</span>` : ""}
        </td>
        <td>${a.doctor}</td>
        <td class="value-cell">₱${a.price.toLocaleString()}</td>
      </tr>
      <!-- Blank rows for manual additions -->
      <tr><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>
      <tr><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>
    </tbody>
  </table>

  <!-- Clinical Notes -->
  <div class="notes-grid">
    <div class="note-box">
      <div class="note-head">Diagnosis</div>
      <div class="note-body ${!a.diagnosis ? "empty" : ""}">${a.diagnosis || "No diagnosis recorded."}</div>
    </div>
    <div class="note-box">
      <div class="note-head">Treatment Plan</div>
      <div class="note-body ${!a.treatmentPlan ? "empty" : ""}">${a.treatmentPlan || "No treatment plan recorded."}</div>
    </div>
    <div class="note-box">
      <div class="note-head">Dental / Medical History</div>
      <div class="note-body ${!a.dentalHistory ? "empty" : ""}">${a.dentalHistory || "No history recorded."}</div>
    </div>
    <div class="note-box">
      <div class="note-head">Doctor's Notes</div>
      <div class="note-body ${!a.notes ? "empty" : ""}">${a.notes || "No notes recorded."}</div>
    </div>
  </div>

  <!-- Signature Row -->
  <div class="sig-row">
    <div class="sig-box">
      <div class="sig-line">Patient's Signature</div>
    </div>
    <div class="sig-box">
      <div class="sig-line">${a.doctor}<br/>Attending Dentist</div>
    </div>
    <div class="sig-box">
      <div class="sig-line">Prepared by (Staff)</div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    ${CLINIC.name} &nbsp;·&nbsp; ${CLINIC.address}<br/>
    ${CLINIC.phone} &nbsp;·&nbsp; ${CLINIC.email} &nbsp;·&nbsp; ${CLINIC.facebookUrl}
  </div>

  <div style="text-align:center;margin-top:20px">
    <button class="print-btn" onclick="window.print()" style="padding:9px 28px;background:#8b6914;color:#fff;border:none;border-radius:5px;font-size:13px;font-weight:600;cursor:pointer">🖨&nbsp; Print Daily Record</button>
  </div>

<script>window.onload = () => window.print();</script>
</body>
</html>`;

  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
}


/** Opens a professional A4 invoice with logo in a new window. */
export function downloadInvoice(a: Appointment) {
  const invoiceNo = a.receiptNumber || `INV-${a.id.slice(-8).toUpperCase()}`;
  const now = new Date();
  const issuedDate = now.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
  const apptDate   = new Date(a.date).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
  const dueDate    = issuedDate; // paid on issue

  const subtotal = a.price;
  const isPaid   = a.paymentStatus === "paid";

  // Absolute URL for the logo so it works in a new window
  const logoUrl = `${window.location.origin}/images/logo.png`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Invoice ${invoiceNo} – ${a.patientName}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 13px;
    color: #1a1a1a;
    background: #f4f4f4;
    padding: 32px 16px;
  }
  .page {
    background: #fff;
    max-width: 780px;
    margin: 0 auto;
    padding: 48px 52px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.10);
    border-radius: 4px;
  }

  /* ── Header ── */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 28px;
    border-bottom: 3px solid #c9a227;
    margin-bottom: 32px;
  }
  .brand { display: flex; align-items: center; gap: 14px; }
  .brand img { width: 64px; height: 64px; object-fit: contain; }
  .brand-text .name { font-size: 20px; font-weight: 700; color: #8b6914; letter-spacing: 0.3px; }
  .brand-text .sub  { font-size: 11px; color: #666; margin-top: 3px; line-height: 1.6; }
  .invoice-meta { text-align: right; }
  .invoice-meta .title { font-size: 32px; font-weight: 800; color: #c9a227; letter-spacing: 3px; text-transform: uppercase; }
  .invoice-meta table { margin-top: 8px; margin-left: auto; font-size: 12px; }
  .invoice-meta td { padding: 2px 0 2px 16px; color: #555; }
  .invoice-meta td:first-child { color: #999; text-align: right; }

  /* ── Bill to / From ── */
  .parties {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 32px;
  }
  .party-box { background: #fafafa; border: 1px solid #eee; border-radius: 6px; padding: 16px 18px; }
  .party-box .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #999; font-weight: 600; margin-bottom: 8px; }
  .party-box .value { font-size: 13px; color: #1a1a1a; line-height: 1.7; }
  .party-box .value strong { font-size: 14px; color: #111; }

  /* ── Items table ── */
  table.items { width: 100%; border-collapse: collapse; margin-bottom: 0; }
  table.items thead tr { background: #8b6914; color: #fff; }
  table.items thead th { padding: 10px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; text-align: left; }
  table.items thead th:last-child { text-align: right; }
  table.items tbody tr { border-bottom: 1px solid #f0f0f0; }
  table.items tbody tr:nth-child(even) { background: #fdf9f0; }
  table.items tbody td { padding: 12px 14px; font-size: 13px; vertical-align: top; }
  table.items tbody td:last-child { text-align: right; font-weight: 600; }

  /* ── Totals ── */
  .totals { display: flex; justify-content: flex-end; margin-top: 0; }
  .totals-box { width: 280px; }
  .totals-box table { width: 100%; border-collapse: collapse; }
  .totals-box td { padding: 6px 14px; font-size: 13px; }
  .totals-box td:last-child { text-align: right; }
  .totals-box .sub-row td { color: #555; border-bottom: 1px solid #f0f0f0; }
  .totals-box .total-row { background: #8b6914; color: #fff; border-radius: 0 0 4px 4px; }
  .totals-box .total-row td { font-size: 15px; font-weight: 700; padding: 10px 14px; }

  /* ── Payment info ── */
  .payment-section {
    margin-top: 32px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
  .info-box { border: 1px solid #eee; border-radius: 6px; padding: 16px 18px; }
  .info-box .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #999; font-weight: 600; margin-bottom: 10px; }
  .info-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 12px; }
  .info-row span:first-child { color: #888; }
  .info-row span:last-child  { font-weight: 500; color: #1a1a1a; }

  /* ── Status badge ── */
  .badge { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  .badge-paid    { background: #d4edda; color: #155724; }
  .badge-pending { background: #fff3cd; color: #856404; }
  .badge-unpaid  { background: #f8d7da; color: #721c24; }

  /* ── Notes ── */
  .notes { margin-top: 28px; padding: 14px 18px; background: #fdf9f0; border-left: 4px solid #c9a227; border-radius: 0 6px 6px 0; font-size: 12px; color: #555; line-height: 1.7; }

  /* ── Footer ── */
  .footer { margin-top: 40px; padding-top: 18px; border-top: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #aaa; }
  .footer .thank { font-size: 13px; font-weight: 600; color: #8b6914; }

  /* ── Print button ── */
  .print-btn { display: block; margin: 28px auto 0; padding: 11px 32px; background: #8b6914; color: #fff; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; letter-spacing: 0.3px; }
  .print-btn:hover { background: #c9a227; }

  @media print {
    body { background: #fff; padding: 0; }
    .page { box-shadow: none; padding: 24px 28px; }
    .print-btn { display: none; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="brand">
      <img src="${logoUrl}" alt="Logo" onerror="this.style.display='none'"/>
      <div class="brand-text">
        <div class="name">${CLINIC.name}</div>
        <div class="sub">
          ${CLINIC.address}<br/>
          ${CLINIC.phone} &nbsp;·&nbsp; ${CLINIC.email}<br/>
          ${CLINIC.hours}
        </div>
      </div>
    </div>
    <div class="invoice-meta">
      <div class="title">Invoice</div>
      <table>
        <tr><td>Invoice No.</td><td><strong>${invoiceNo}</strong></td></tr>
        <tr><td>Date Issued</td><td>${issuedDate}</td></tr>
        <tr><td>Due Date</td><td>${dueDate}</td></tr>
        <tr><td>Appointment</td><td>${apptDate} &nbsp;${formatTime12h(a.time)}</td></tr>
      </table>
    </div>
  </div>

  <!-- Bill To / Provider -->
  <div class="parties">
    <div class="party-box">
      <div class="label">Bill To</div>
      <div class="value">
        <strong>${a.patientName}</strong><br/>
        ${a.patientEmail ? a.patientEmail + "<br/>" : ""}
        ${a.patientPhone ? a.patientPhone : ""}
      </div>
    </div>
    <div class="party-box">
      <div class="label">Service Provider</div>
      <div class="value">
        <strong>${a.doctor}</strong><br/>
        ${CLINIC.name}<br/>
        ${CLINIC.address}
      </div>
    </div>
  </div>

  <!-- Items -->
  <table class="items">
    <thead>
      <tr>
        <th>#</th>
        <th>Description</th>
        <th>Date</th>
        <th>Qty</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td>
          <strong>${a.serviceName}</strong>
          ${a.diagnosis ? `<br/><span style="font-size:11px;color:#888">Diagnosis: ${a.diagnosis}</span>` : ""}
        </td>
        <td>${apptDate}</td>
        <td>1</td>
        <td>₱${subtotal.toLocaleString()}</td>
      </tr>
    </tbody>
  </table>

  <!-- Totals -->
  <div class="totals">
    <div class="totals-box">
      <table>
        <tr class="sub-row"><td>Subtotal</td><td>₱${subtotal.toLocaleString()}</td></tr>
        <tr class="sub-row"><td>Tax (0%)</td><td>₱0.00</td></tr>
        <tr class="total-row"><td>Total Due</td><td>₱${subtotal.toLocaleString()}</td></tr>
      </table>
    </div>
  </div>

  <!-- Payment Info -->
  <div class="payment-section">
    <div class="info-box">
      <div class="label">Payment Details</div>
      <div class="info-row"><span>Method</span><span>Cash</span></div>
      <div class="info-row"><span>Date</span><span>${issuedDate}</span></div>
      <div class="info-row"><span>Status</span>
        <span>
          <span class="badge ${isPaid ? "badge-paid" : "badge-unpaid"}">
            ${isPaid ? "Paid" : "Unpaid"}
          </span>
        </span>
      </div>
    </div>
    <div class="info-box">
      <div class="label">Appointment Info</div>
      <div class="info-row"><span>Date</span><span>${apptDate}</span></div>
      <div class="info-row"><span>Time</span><span>${formatTime12h(a.time)}</span></div>
      <div class="info-row"><span>Status</span><span style="text-transform:capitalize">${a.status}</span></div>
      ${a.source ? `<div class="info-row"><span>Source</span><span style="text-transform:capitalize">${a.source}</span></div>` : ""}
    </div>
  </div>

  <!-- Notes -->
  <div class="notes">
    📅 &nbsp;Please schedule your next visit in 6 months for a routine check-up.<br/>
    Thank you for trusting <strong>${CLINIC.name}</strong> with your dental care.<br/>
    For questions, contact us at <strong>${CLINIC.phone}</strong> or <strong>${CLINIC.email}</strong>.
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="thank">Thank you for your business!</div>
    <div>${CLINIC.facebookUrl}</div>
    <div>${invoiceNo} &nbsp;·&nbsp; ${issuedDate}</div>
  </div>

</div>

<button class="print-btn" onclick="window.print()">🖨&nbsp; Print / Save as PDF</button>

<script>window.onload = () => window.print();</script>
</body>
</html>`;

  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
}
