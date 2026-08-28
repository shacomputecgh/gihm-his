/**
 * PDF Generation Utility
 * Generates printable PDF documents with hospital logo, watermark, and professional formatting
 */

export interface PDFDocument {
  title: string;
  subtitle?: string;
  content: string;
  footer?: string;
  watermark?: string;
}

const WATERMARK_CSS = `
  @page { margin: 1.5cm; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; line-height: 1.6; }
  .pdf-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1e3a5f; padding-bottom: 15px; }
  .pdf-logo { font-size: 24px; font-weight: bold; color: #1e3a5f; }
  .pdf-hospital-name { font-size: 18px; font-weight: 600; color: #333; margin-top: 5px; }
  .pdf-subtitle { font-size: 14px; color: #666; margin-top: 5px; }
  .pdf-title { font-size: 20px; font-weight: bold; text-align: center; margin: 20px 0; color: #1e3a5f; border: 2px solid #1e3a5f; padding: 10px; }
  .pdf-section { margin-bottom: 15px; }
  .pdf-section-title { font-size: 14px; font-weight: bold; color: #1e3a5f; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; }
  .pdf-field { margin-bottom: 8px; }
  .pdf-label { font-weight: bold; color: #555; }
  .pdf-value { color: #333; }
  .pdf-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
  .pdf-table th, .pdf-table td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
  .pdf-table th { background-color: #f5f5f5; font-weight: bold; }
  .pdf-footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 10px; color: #666; }
  .pdf-watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80px; font-weight: bold; color: rgba(0,0,0,0.03); z-index: -1; white-space: nowrap; pointer-events: none; }
  .pdf-signature { margin-top: 40px; display: flex; justify-content: space-between; }
  .pdf-signature-box { text-align: center; width: 200px; }
  .pdf-signature-line { border-top: 1px solid #333; margin-top: 60px; padding-top: 5px; }
  @media print { .pdf-watermark { display: block; } .no-print { display: none !important; } }
`;

function generateHTML(doc: PDFDocument, hospitalName: string = 'Greater Accra Regional Hospital'): string {
  const watermark = doc.watermark || hospitalName;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${doc.title}</title>
  <style>${WATERMARK_CSS}</style>
</head>
<body>
  <div class="pdf-watermark">${watermark}</div>
  <div class="pdf-header">
    <div class="pdf-logo">🏥</div>
    <div class="pdf-hospital-name">${hospitalName}</div>
    <div class="pdf-subtitle">Korle-Bu, Accra · +233 302 775 611 · www.korlebuteachinghospital.org</div>
  </div>
  <div class="pdf-title">${doc.title}</div>
  ${doc.subtitle ? `<div style="text-align: center; color: #666; margin-bottom: 15px;">${doc.subtitle}</div>` : ''}
  <div class="pdf-content">${doc.content}</div>
  ${doc.footer ? `<div class="pdf-footer">${doc.footer}</div>` : ''}
</body>
</html>`;
}

export function printPDF(doc: PDFDocument, hospitalName?: string): void {
  const html = generateHTML(doc, hospitalName);
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  }
}

export function downloadPDF(doc: PDFDocument, filename: string, hospitalName?: string): void {
  const html = generateHTML(doc, hospitalName);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Helper functions for building PDF content
export function field(label: string, value: string): string {
  return `<div class="pdf-field"><span class="pdf-label">${label}:</span> <span class="pdf-value">${value}</span></div>`;
}

export function section(title: string, content: string): string {
  return `<div class="pdf-section"><div class="pdf-section-title">${title}</div>${content}</div>`;
}

export function table(headers: string[], rows: string[][]): string {
  let html = '<table class="pdf-table"><thead><tr>';
  headers.forEach((h) => { html += `<th>${h}</th>`; });
  html += '</tr></thead><tbody>';
  rows.forEach((row) => {
    html += '<tr>';
    row.forEach((cell) => { html += `<td>${cell}</td>`; });
    html += '</tr>';
  });
  html += '</tbody></table>';
  return html;
}

export function signatureBlock(): string {
  return `
    <div class="pdf-signature">
      <div class="pdf-signature-box">
        <div class="pdf-signature-line">Authorized Signature</div>
        <div style="font-size: 10px; color: #666;">Date: _______________</div>
      </div>
      <div class="pdf-signature-box">
        <div class="pdf-signature-line">Patient/Guardian</div>
        <div style="font-size: 10px; color: #666;">Date: _______________</div>
      </div>
    </div>`;
}

export function today(): string {
  return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function now(): string {
  return new Date().toLocaleString('en-GB', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
