/**
 * PDF Receipt Generator for GIHM-HIS
 * 
 * Generates a professional PDF receipt for payments using
 * pure JavaScript (no external library needed).
 */

export interface ReceiptData {
  receiptNumber: string;
  date: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    facility: string;
  };
  items: {
    description: string;
    edition: string;
    amount: number;
  }[];
  total: number;
  currency: string;
  paymentMethod: string;
  transactionRef: string;
  developer: {
    name: string;
    email: string;
    phone: string;
    tagline: string;
  };
}

function generateReceiptNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `GIHM-${y}${m}${d}-${rand}`;
}

export function generateReceiptHTML(data: ReceiptData): string {
  const itemRows = data.items.map((item) => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#1f2937;">${item.description}</td>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#6b7280;">${item.edition}</td>
      <td style="padding:12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:#1f2937;text-align:right;font-weight:600;">${data.currency} ${item.amount.toLocaleString()}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt - ${data.receiptNumber}</title>
  <style>
    @media print {
      body { margin: 0; }
      .no-print { display: none !important; }
    }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f3f4f6; }
    .receipt { max-width: 700px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: linear-gradient(135deg, #2563eb, #4f46e5); color: white; padding: 32px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 4px 0 0; font-size: 14px; opacity: 0.9; }
    .badge { display: inline-block; background: rgba(255,255,255,0.2); border-radius: 20px; padding: 4px 16px; font-size: 12px; font-weight: 700; margin-top: 12px; }
    .body { padding: 32px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
    .meta-box { background: #f9fafb; border-radius: 12px; padding: 16px; }
    .meta-box h3 { margin: 0 0 8px; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; }
    .meta-box p { margin: 2px 0; font-size: 13px; color: #374151; }
    .meta-box p strong { color: #111827; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th { background: #f9fafb; padding: 12px; text-align: left; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    th:last-child { text-align: right; }
    .total-row td { padding: 16px 12px; border-top: 2px solid #e5e7eb; font-size: 18px; font-weight: 800; color: #111827; }
    .total-row td:last-child { text-align: right; color: #2563eb; }
    .footer { background: #f9fafb; padding: 24px 32px; border-top: 1px solid #e5e7eb; text-align: center; }
    .footer p { margin: 4px 0; font-size: 12px; color: #6b7280; }
    .footer strong { color: #374151; }
    .developer-info { margin-top: 16px; padding: 16px; background: #eff6ff; border-radius: 12px; border: 1px solid #bfdbfe; }
    .print-btn { display: block; margin: 20px auto; padding: 12px 32px; background: #2563eb; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; }
    .print-btn:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div style="margin-bottom:12px;">
        <div style="font-size:36px;">🧾</div>
      </div>
      <h1>GIHM-HIS</h1>
      <p>Ghana Integrated Health Management System</p>
      <div class="badge">PAYMENT RECEIPT</div>
    </div>
    
    <div class="body">
      <div class="meta-grid">
        <div class="meta-box">
          <h3>Receipt Details</h3>
          <p><strong>Receipt #:</strong> ${data.receiptNumber}</p>
          <p><strong>Date:</strong> ${data.date}</p>
          <p><strong>Transaction Ref:</strong> ${data.transactionRef}</p>
          <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
        </div>
        <div class="meta-box">
          <h3>Customer</h3>
          <p><strong>Facility:</strong> ${data.customer.facility}</p>
          <p><strong>Contact:</strong> ${data.customer.name}</p>
          <p><strong>Email:</strong> ${data.customer.email}</p>
          <p><strong>Phone:</strong> ${data.customer.phone}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Details</th>
            <th style="text-align:right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
          <tr class="total-row">
            <td colspan="2">Total Paid</td>
            <td>${data.currency} ${data.total.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      <div class="developer-info">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#2563eb;text-transform:uppercase;letter-spacing:1px;">Software Developer</p>
        <p style="margin:2px 0;font-size:14px;font-weight:700;color:#111827;">${data.developer.name}</p>
        <p style="margin:2px 0;font-size:13px;color:#374151;">${data.developer.tagline}</p>
        <p style="margin:2px 0;font-size:12px;color:#6b7280;">📧 ${data.developer.email} · 📱 ${data.developer.phone}</p>
      </div>
    </div>

    <div class="footer">
      <p>This receipt is computer-generated and valid without signature.</p>
      <p>For support, contact <strong>${data.developer.email}</strong> or call <strong>${data.developer.phone}</strong></p>
      <p style="margin-top:8px;color:#9ca3af;">© ${new Date().getFullYear()} ${data.developer.name} · Hard Works Never Fail</p>
    </div>
  </div>

  <button class="print-btn no-print" onclick="window.print()">🖨️ Print Receipt</button>
</body>
</html>
  `.trim();
}

export function downloadReceipt(data: ReceiptData): void {
  const html = generateReceiptHTML(data);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = window.document.createElement('a');
  a.href = url;
  a.download = `GIHM-HIS-Receipt-${data.receiptNumber}.html`;
  window.document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function openReceiptInNewTab(data: ReceiptData): void {
  const html = generateReceiptHTML(data);
  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

export function createReceiptFromPayment(params: {
  planName: string;
  edition: string;
  amount: number;
  facilityName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  transactionRef: string;
}): ReceiptData {
  return {
    receiptNumber: generateReceiptNumber(),
    date: new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    customer: {
      name: params.contactName,
      email: params.contactEmail,
      phone: params.contactPhone,
      facility: params.facilityName,
    },
    items: [
      {
        description: `GIHM-HIS ${params.planName} License (1 Year)`,
        edition: params.edition,
        amount: params.amount,
      },
    ],
    total: params.amount,
    currency: 'GH₵',
    paymentMethod: 'Paystack (Card / Mobile Money)',
    transactionRef: params.transactionRef,
    developer: {
      name: 'ShaComputeC',
      email: 'shacomputec@gmail.com',
      phone: '+233 266 692 501',
      tagline: 'Hard Works Never Fail',
    },
  };
}
