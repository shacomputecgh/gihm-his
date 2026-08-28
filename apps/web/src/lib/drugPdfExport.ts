// =====================================================================
// Drug Reference PDF Export
// Generates printable drug reference cards using browser print
// =====================================================================

interface DrugForExport {
  name: string;
  genericName?: string;
  category: string;
  dosageForm?: string;
  strength?: string;
  route?: string;
  adultDose?: string;
  pediatricDose?: string;
  maxDailyDose?: string;
  sideEffects?: string;
  contraindications?: string;
  whoEssential: boolean;
  ghanaEssential: boolean;
}

interface DiseaseForExport {
  name: string;
  icdCode?: string;
  category: string;
  severity?: string;
  symptoms?: string;
  endemicToGhana: boolean;
  vaccineAvailable: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  ANALGESIC: '#3B82F6',
  ANTIBIOTIC: '#EF4444',
  ANTIMALARIAL: '#F59E0B',
  ANTIRETROVIRAL: '#8B5CF6',
  CARDIOVASCULAR: '#F43F5E',
  ENDOCRINE: '#14B8A6',
  GASTROINTESTINAL: '#10B981',
  RESPIRATORY: '#0EA5E9',
  NEUROLOGICAL: '#7C3AED',
  HORMONE: '#EC4899',
  VITAMIN: '#84CC16',
  ANTIFUNGAL: '#F97316',
  ANTIPARASITIC: '#EAB308',
  DERMATOLOGICAL: '#78716C',
  OPHTHALMIC: '#06B6D4',
  ANTIVIRAL: '#6366F1',
  OTHER: '#6B7280',
};

function generateDrugCardHTML(drug: DrugForExport): string {
  const color = CATEGORY_COLORS[drug.category] ?? '#6B7280';
  return `
    <div class="drug-card" style="border-left: 4px solid ${color};">
      <div class="drug-header">
        <span class="drug-name">${drug.name}</span>
        ${drug.genericName ? `<span class="drug-generic">${drug.genericName}</span>` : ''}
      </div>
      <div class="drug-meta">
        <span class="badge" style="background: ${color}20; color: ${color};">${drug.category}</span>
        ${drug.dosageForm ? `<span class="badge gray">${drug.dosageForm}</span>` : ''}
        ${drug.route ? `<span class="badge gray">${drug.route}</span>` : ''}
        ${drug.strength ? `<span class="badge gray">${drug.strength}</span>` : ''}
        ${drug.whoEssential ? '<span class="badge green">WHO</span>' : ''}
        ${drug.ghanaEssential ? '<span class="badge blue">Ghana</span>' : ''}
      </div>
      <div class="drug-doses">
        ${drug.adultDose ? `<div><strong>Adult:</strong> ${drug.adultDose}</div>` : ''}
        ${drug.pediatricDose ? `<div><strong>Pediatric:</strong> ${drug.pediatricDose}</div>` : ''}
        ${drug.maxDailyDose ? `<div><strong>Max daily:</strong> ${drug.maxDailyDose}</div>` : ''}
      </div>
      ${drug.sideEffects ? `<div class="drug-warnings"><strong>Side effects:</strong> ${drug.sideEffects}</div>` : ''}
      ${drug.contraindications ? `<div class="drug-contraindications"><strong>Contraindications:</strong> ${drug.contraindications}</div>` : ''}
    </div>
  `;
}

function generateDiseaseCardHTML(disease: DiseaseForExport): string {
  const severityColor = disease.severity === 'LIFE_THREATENING' ? '#DC2626' :
    disease.severity === 'SEVERE' ? '#EA580C' :
    disease.severity === 'MODERATE' ? '#D97706' : '#16A34A';

  return `
    <div class="disease-card" style="border-left: 4px solid ${severityColor};">
      <div class="disease-header">
        <span class="disease-name">${disease.name}</span>
        ${disease.icdCode ? `<span class="icd-code">${disease.icdCode}</span>` : ''}
      </div>
      <div class="disease-meta">
        <span class="badge" style="background: ${severityColor}20; color: ${severityColor};">${disease.severity?.replace(/_/g, ' ')}</span>
        ${disease.endemicToGhana ? '<span class="badge red">Endemic Ghana</span>' : ''}
        ${disease.vaccineAvailable ? '<span class="badge green">Vaccine</span>' : ''}
      </div>
      ${disease.symptoms ? `<div class="disease-symptoms"><strong>Symptoms:</strong> ${disease.symptoms}</div>` : ''}
    </div>
  `;
}

function getPrintHTML(drugs: DrugForExport[], diseases: DiseaseForExport[], title: string): string {
  const drugCards = drugs.map(generateDrugCardHTML).join('');
  const diseaseCards = diseases.map(generateDiseaseCardHTML).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 10px; color: #1e293b; padding: 12px; }
        h1 { font-size: 18px; margin-bottom: 4px; color: #0f172a; }
        h2 { font-size: 14px; margin: 16px 0 8px; color: #334155; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; }
        .subtitle { font-size: 10px; color: #64748b; margin-bottom: 12px; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .drug-card, .disease-card { padding: 6px 8px; border-radius: 4px; background: #f8fafc; page-break-inside: avoid; }
        .drug-header, .disease-header { display: flex; align-items: baseline; gap: 6px; }
        .drug-name, .disease-name { font-weight: 700; font-size: 11px; }
        .drug-generic { font-size: 9px; color: #64748b; }
        .icd-code { font-family: monospace; font-size: 9px; color: #64748b; }
        .drug-meta, .disease-meta { display: flex; flex-wrap: wrap; gap: 3px; margin: 3px 0; }
        .badge { display: inline-block; padding: 1px 4px; border-radius: 3px; font-size: 8px; font-weight: 600; }
        .badge.green { background: #dcfce7; color: #166534; }
        .badge.blue { background: #dbeafe; color: #1e40af; }
        .badge.red { background: #fee2e2; color: #991b1b; }
        .badge.gold { background: #fef3c7; color: #92400e; }
        .badge.gray { background: #f1f5f9; color: #475569; }
        .drug-doses { margin: 3px 0; font-size: 9px; }
        .drug-doses div { margin: 1px 0; }
        .drug-warnings { font-size: 8px; color: #b45309; margin-top: 2px; }
        .drug-contraindications { font-size: 8px; color: #dc2626; margin-top: 1px; }
        .disease-symptoms { font-size: 9px; color: #475569; margin-top: 2px; }
        .footer { margin-top: 12px; font-size: 8px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 4px; }
        @media print { body { padding: 8px; } .grid { gap: 6px; } }
        @page { size: A4; margin: 10mm; }
      </style>
    </head>
    <body>
      <h1>📋 ${title}</h1>
      <p class="subtitle">Generated ${new Date().toLocaleDateString()} · GIHM-HIS Drug & Disease Reference · For clinical reference only</p>
      ${drugs.length > 0 ? `<h2>💊 Drugs (${drugs.length})</h2><div class="grid">${drugCards}</div>` : ''}
      ${diseases.length > 0 ? `<h2>🦠 Diseases (${diseases.length})</h2><div class="grid">${diseaseCards}</div>` : ''}
      <div class="footer">⚠️ All information is for clinical reference only. Professional judgment required. · shacomputec AI / Dr. August · GIHM-HIS</div>
    </body>
    </html>
  `;
}

/**
 * Export drugs as printable PDF
 */
export function exportDrugsPDF(drugs: DrugForExport[], title: string = 'Drug Reference Card'): void {
  const html = getPrintHTML(drugs, [], title);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  }
}

/**
 * Export diseases as printable PDF
 */
export function exportDiseasesPDF(diseases: DiseaseForExport[], title: string = 'Disease Reference Card'): void {
  const html = getPrintHTML([], diseases, title);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  }
}

/**
 * Export both drugs and diseases
 */
export function exportFullPDF(drugs: DrugForExport[], diseases: DiseaseForExport[], title: string = 'GIHM-HIS Clinical Reference'): void {
  const html = getPrintHTML(drugs, diseases, title);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  }
}
