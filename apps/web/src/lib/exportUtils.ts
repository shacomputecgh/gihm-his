/**
 * Export data to CSV file and trigger download
 */
export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]!);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((h) => {
        const val = String(row[h] ?? '');
        return val.includes(',') || val.includes('"') || val.includes('\n')
          ? `"${val.replace(/"/g, '""')}"`
          : val;
      }).join(',')
    ),
  ].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export data to a printable HTML table
 */
export function exportToPrint(data: Record<string, unknown>[], title: string, columns?: string[]) {
  const cols = columns ?? (data.length > 0 ? Object.keys(data[0]!) : []);
  const html = `
<!DOCTYPE html>
<html><head><title>${title}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 20px; }
  h1 { font-size: 18px; margin-bottom: 5px; }
  p { font-size: 12px; color: #666; margin-bottom: 15px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #f3f4f6; border: 1px solid #d1d5db; padding: 8px; text-align: left; font-weight: 600; }
  td { border: 1px solid #d1d5db; padding: 6px 8px; }
  tr:nth-child(even) { background: #f9fafb; }
  @media print { body { padding: 0; } }
</style></head><body>
<h1>${title}</h1>
<p>Generated: ${new Date().toLocaleString()} | Records: ${data.length}</p>
<table><thead><tr>${cols.map((c) => `<th>${c}</th>`).join('')}</tr></thead>
<tbody>${data.map((row) => `<tr>${cols.map((c) => `<td>${String(row[c] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody></table>
</body></html>`;
  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); w.print(); }
}

/**
 * Generate a PDF receipt using browser print
 */
export function generateReceipt(data: Record<string, string>, title: string, organization?: string) {
  const html = `
<!DOCTYPE html>
<html><head><title>${title}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 40px; max-width: 400px; margin: 0 auto; }
  .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
  .header h2 { font-size: 16px; margin: 0; }
  .header p { font-size: 11px; color: #666; margin: 2px 0; }
  .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; border-bottom: 1px dotted #ccc; }
  .row .label { color: #666; }
  .row .value { font-weight: 600; }
  .total { font-size: 16px; font-weight: bold; border-top: 2px solid #000; margin-top: 10px; padding-top: 10px; }
  .footer { text-align: center; font-size: 10px; color: #999; margin-top: 20px; border-top: 1px solid #ccc; padding-top: 10px; }
</style></head><body>
<div class="header">
  <h2>${organization || 'GIHM-HIS'}</h2>
  <p>${title}</p>
  <p>Date: ${new Date().toLocaleString()}</p>
</div>
${Object.entries(data).map(([k, v]) => `<div class="row"><span class="label">${k}</span><span class="value">${v}</span></div>`).join('')}
<div class="footer">
  <p>Powered by ShaComputeC — GIHM-HIS</p>
  <p>Generated: ${new Date().toISOString()}</p>
</div>
</body></html>`;
  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); w.print(); }
}

/**
 * Simple delete confirmation helper
 */
export function confirmDelete(itemName: string): boolean {
  return window.confirm(`Are you sure you want to delete "${itemName}"? This action cannot be undone.`);
}
