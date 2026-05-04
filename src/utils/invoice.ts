import type { Appointment } from "../shared/types";
import { CLINIC } from "../shared/constants";

/** Generates a printable HTML treatment notes document matching the invoice design. */
export function downloadTreatmentNotes(a: Appointment) {
  const issuedDate = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
  const apptDate = new Date(a.date).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });

  const noteSection = (title: string, value?: string) => value
    ? `<div class="section">
        <div class="section-title">${title}</div>
        <div class="note-block">${value}</div>
      </div>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Treatment Notes – ${a.patientName}</title>
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
  .note-block { background: #fafafa; border-left: 3px solid #c9a227; padding: 14px 16px; border-radius: 4px; font-size: 13px; color: #333; line-height: 1.7; white-space: pre-wrap; }
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
      <div class="invoice-title">Treatment Notes</div>
      <div class="invoice-no">Patient: ${a.patientName}</div>
      <div class="invoice-date">Issued: ${issuedDate}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Appointment Details</div>
    <table>
      <thead>
        <tr><th>Service</th><th>Doctor</th><th>Date</th><th>Time</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>${a.serviceName}</td>
          <td>${a.doctor}</td>
          <td>${apptDate}</td>
          <td>${a.time}</td>
        </tr>
      </tbody>
    </table>
  </div>

  ${noteSection("Diagnosis", a.diagnosis)}
  ${noteSection("Treatment Plan", a.treatmentPlan)}
  ${noteSection("Dental History", a.dentalHistory)}
  ${noteSection("Doctor Notes", a.notes)}

  <div class="footer">
    Thank you for choosing ${CLINIC.name}.<br/>
    For inquiries, contact us at ${CLINIC.phone} or ${CLINIC.email}<br/>
    ${CLINIC.facebookUrl}
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `treatment-notes-${a.patientName.replace(/\s+/g, "-")}-${a.date}.html`;
  link.click();
  URL.revokeObjectURL(url);
}

/** Opens a print-ready invoice in a new window (patient can Save as PDF). */
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
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Georgia,serif;color:#1a1a1a;background:#fff;padding:48px;max-width:720px;margin:0 auto}
  .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #c9a227;padding-bottom:24px;margin-bottom:32px}
  .clinic-name{font-size:22px;font-weight:bold;color:#8b6914}
  .clinic-sub{font-size:11px;color:#666;margin-top:4px;line-height:1.6}
  .invoice-meta{text-align:right}
  .invoice-title{font-size:28px;color:#c9a227;letter-spacing:2px;text-transform:uppercase}
  .invoice-no{font-size:13px;color:#555;margin-top:6px}
  .section{margin-bottom:24px}
  .section-title{font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#999;margin-bottom:8px;border-bottom:1px solid #eee;padding-bottom:6px}
  .row{display:flex;justify-content:space-between;font-size:13px;padding:4px 0}
  .label{color:#666}.value{font-weight:500}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999;padding:8px 0;border-bottom:1px solid #eee}
  td{padding:12px 0;border-bottom:1px solid #f5f5f5}
  .total-row{display:flex;justify-content:space-between;padding:14px 0;border-top:2px solid #c9a227;margin-top:8px}
  .total-label{font-size:14px;font-weight:bold;color:#555}
  .total-amount{font-size:22px;font-weight:bold;color:#8b6914}
  .badge{display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:bold;text-transform:uppercase}
  .paid{background:#d4edda;color:#155724}.unpaid{background:#fff3cd;color:#856404}.pending{background:#cce5ff;color:#004085}
  .footer{margin-top:40px;padding-top:16px;border-top:1px solid #eee;text-align:center;font-size:11px;color:#aaa;line-height:1.8}
  @media print{body{padding:24px}button{display:none}}
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="clinic-name">${CLINIC.name}</div>
      <div class="clinic-sub">${CLINIC.address}<br/>${CLINIC.phone} · ${CLINIC.email}<br/>${CLINIC.hours}</div>
    </div>
    <div class="invoice-meta">
      <div class="invoice-title">Official Receipt</div>
      <div class="invoice-no">${invoiceNo}</div>
      <div style="font-size:12px;color:#888;margin-top:2px">Issued: ${issuedDate}</div>
    </div>
  </div>
  <div class="section">
    <div class="section-title">Billed To</div>
    <div class="row"><span class="label">Patient</span><span class="value">${a.patientName}</span></div>
  </div>
  <div class="section">
    <div class="section-title">Services Rendered</div>
    <table>
      <thead><tr><th>Service</th><th>Doctor</th><th>Date</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>
        <tr>
          <td>${a.serviceName}</td>
          <td>${a.doctor}</td>
          <td>${apptDate} ${a.time}</td>
          <td style="text-align:right;font-weight:bold">₱${a.price.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>
    <div class="total-row">
      <span class="total-label">Total Paid</span>
      <span class="total-amount">₱${a.price.toLocaleString()}</span>
    </div>
  </div>
  <div class="section">
    <div class="section-title">Payment Details</div>
    <div class="row"><span class="label">Method</span><span class="value">${a.paymentMethod === "gcash" ? "GCash" : "Cash"}</span></div>
    <div class="row"><span class="label">Status</span><span class="value"><span class="badge ${a.paymentStatus === "paid" ? "paid" : "pending"}">${a.paymentStatus.replace("_"," ")}</span></span></div>
    ${a.gcashRef ? `<div class="row"><span class="label">GCash Ref</span><span class="value">${a.gcashRef}</span></div>` : ""}
  </div>
  <div style="text-align:center;margin:24px 0">
    <button onclick="window.print()" style="padding:10px 28px;background:#c9a227;color:#fff;border:none;border-radius:6px;font-size:14px;cursor:pointer">🖨 Print / Save as PDF</button>
  </div>
  <div class="footer">${CLINIC.name} · ${CLINIC.address}<br/>${CLINIC.phone} · ${CLINIC.email}</div>
  <script>window.onload=()=>window.print();</script>
</body>
</html>`;

  const w = window.open("", "_blank");
  if (w) { w.document.write(html); w.document.close(); }
}
