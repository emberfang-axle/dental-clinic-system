import type { Appointment } from "../shared/types";
import { CLINIC } from "../shared/constants";

/** Generates a printable HTML invoice and triggers a download. */
export function downloadInvoice(a: Appointment) {
  const invoiceNo = a.receiptNumber || `INV-${a.id.slice(-8).toUpperCase()}`;
  const issuedDate = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
  const apptDate = new Date(a.date).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Invoice ${invoiceNo}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Georgia, serif; color: #1a1a1a; background: #fff; padding: 48px; max-width: 720px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #c9a227; padding-bottom: 24px; margin-bottom: 32px; }
  .clinic-name { font-size: 22px; font-weight: bold; color: #8b6914; letter-spacing: 0.5px; }
  .clinic-sub { font-size: 11px; color: #666; margin-top: 4px; line-height: 1.6; }
  .invoice-meta { text-align: right; }
  .invoice-title { font-size: 28px; color: #c9a227; letter-spacing: 2px; text-transform: uppercase; }
  .invoice-no { font-size: 13px; color: #555; margin-top: 6px; }
  .invoice-date { font-size: 12px; color: #888; margin-top: 2px; }
  .section { margin-bottom: 28px; }
  .section-title { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #999; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 6px; }
  .row { display: flex; justify-content: space-between; font-size: 13px; padding: 5px 0; }
  .label { color: #666; }
  .value { color: #1a1a1a; font-weight: 500; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #999; padding: 8px 0; border-bottom: 1px solid #eee; }
  td { padding: 12px 0; border-bottom: 1px solid #f5f5f5; vertical-align: top; }
  .total-row { display: flex; justify-content: space-between; padding: 14px 0; border-top: 2px solid #c9a227; margin-top: 8px; }
  .total-label { font-size: 14px; font-weight: bold; color: #555; }
  .total-amount { font-size: 22px; font-weight: bold; color: #8b6914; }
  .status-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
  .status-paid { background: #d4edda; color: #155724; }
  .status-unpaid { background: #fff3cd; color: #856404; }
  .status-pending { background: #cce5ff; color: #004085; }
  .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 11px; color: #aaa; line-height: 1.8; }
  @media print { body { padding: 24px; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="clinic-name">${CLINIC.name}</div>
      <div class="clinic-sub">
        ${CLINIC.address}<br/>
        ${CLINIC.phone} · ${CLINIC.email}<br/>
        ${CLINIC.hours}
      </div>
    </div>
    <div class="invoice-meta">
      <div class="invoice-title">Invoice</div>
      <div class="invoice-no"># ${invoiceNo}</div>
      <div class="invoice-date">Issued: ${issuedDate}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Billed To</div>
    <div class="row"><span class="label">Patient Name</span><span class="value">${a.patientName}</span></div>
    <div class="row"><span class="label">Patient ID</span><span class="value">${a.patientId}</span></div>
  </div>

  <div class="section">
    <div class="section-title">Appointment Details</div>
    <table>
      <thead>
        <tr>
          <th>Service</th>
          <th>Doctor</th>
          <th>Date</th>
          <th>Time</th>
          <th style="text-align:right">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${a.serviceName}</td>
          <td>${a.doctor}</td>
          <td>${apptDate}</td>
          <td>${a.time}</td>
          <td style="text-align:right; font-weight:bold">₱${a.price.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>
    <div class="total-row">
      <span class="total-label">Total Due</span>
      <span class="total-amount">₱${a.price.toLocaleString()}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Payment Information</div>
    <div class="row">
      <span class="label">Payment Method</span>
      <span class="value">${a.paymentMethod === "gcash" ? "GCash" : "Cash"}</span>
    </div>
    <div class="row">
      <span class="label">Payment Status</span>
      <span class="value">
        <span class="status-badge ${a.paymentStatus === "paid" ? "status-paid" : a.paymentStatus === "unpaid" ? "status-unpaid" : "status-pending"}">
          ${a.paymentStatus.replace("_", " ")}
        </span>
      </span>
    </div>
    ${a.gcashRef ? `<div class="row"><span class="label">GCash Reference</span><span class="value">${a.gcashRef}</span></div>` : ""}
    ${a.receiptNumber ? `<div class="row"><span class="label">Receipt No.</span><span class="value">${a.receiptNumber}</span></div>` : ""}
    <div class="row">
      <span class="label">Appointment Status</span>
      <span class="value">${a.status.charAt(0).toUpperCase() + a.status.slice(1)}</span>
    </div>
  </div>

  <div class="footer">
    Thank you for choosing ${CLINIC.name}.<br/>
    For inquiries, contact us at ${CLINIC.phone} or ${CLINIC.email}<br/>
    ${CLINIC.facebookUrl}
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a2 = document.createElement("a");
  a2.href = url;
  a2.download = `invoice-${invoiceNo}.html`;
  a2.click();
  URL.revokeObjectURL(url);
}
