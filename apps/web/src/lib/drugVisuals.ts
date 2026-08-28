// =====================================================================
// Drug Visual Identification System
// Category-based icons and pill shape/color mapping for visual ID
// =====================================================================

export interface DrugVisual {
  emoji: string;
  color: string;       // Tailwind bg class
  textColor: string;   // Tailwind text class
  shape: string;       // pill shape description
  label: string;
}

const DRUG_VISUALS: Record<string, DrugVisual> = {
  ANALGESIC: { emoji: '💊', color: 'bg-blue-100', textColor: 'text-blue-800', shape: 'Round/oval tablet', label: 'Analgesic' },
  ANTIBIOTIC: { emoji: '🦠', color: 'bg-red-100', textColor: 'text-red-800', shape: 'Capsule/tablet', label: 'Antibiotic' },
  ANTIMALARIAL: { emoji: '🦟', color: 'bg-amber-100', textColor: 'text-amber-800', shape: 'Tablet (ACT combo)', label: 'Antimalarial' },
  ANTIRETROVIRAL: { emoji: '🔬', color: 'bg-purple-100', textColor: 'text-purple-800', shape: 'Tablet (FDC)', label: 'Antiretroviral' },
  CARDIOVASCULAR: { emoji: '❤️', color: 'bg-rose-100', textColor: 'text-rose-800', shape: 'Tablet', label: 'Cardiovascular' },
  ENDOCRINE: { emoji: '🩸', color: 'bg-teal-100', textColor: 'text-teal-800', shape: 'Tablet/injection', label: 'Endocrine' },
  GASTROINTESTINAL: { emoji: '🫁', color: 'bg-emerald-100', textColor: 'text-emerald-800', shape: 'Capsule/tablet', label: 'GI' },
  RESPIRATORY: { emoji: '🫁', color: 'bg-sky-100', textColor: 'text-sky-800', shape: 'Inhaler/tablet', label: 'Respiratory' },
  NEUROLOGICAL: { emoji: '🧠', color: 'bg-violet-100', textColor: 'text-violet-800', shape: 'Tablet/injection', label: 'Neurological' },
  HORMONE: { emoji: '🧬', color: 'bg-pink-100', textColor: 'text-pink-800', shape: 'Tablet/injection', label: 'Hormone' },
  VITAMIN: { emoji: '🍊', color: 'bg-lime-100', textColor: 'text-lime-800', shape: 'Tablet', label: 'Vitamin' },
  ANTIFUNGAL: { emoji: '🍄', color: 'bg-orange-100', textColor: 'text-orange-800', shape: 'Cream/capsule', label: 'Antifungal' },
  ANTIPARASITIC: { emoji: '🪱', color: 'bg-yellow-100', textColor: 'text-yellow-800', shape: 'Tablet', label: 'Antiparasitic' },
  DERMATOLOGICAL: { emoji: '🧴', color: 'bg-stone-100', textColor: 'text-stone-800', shape: 'Cream/ointment', label: 'Dermatological' },
  OPHTHALMIC: { emoji: '👁️', color: 'bg-cyan-100', textColor: 'text-cyan-800', shape: 'Eye drops', label: 'Ophthalmic' },
  ANTIVIRAL: { emoji: '🧫', color: 'bg-indigo-100', textColor: 'text-indigo-800', shape: 'Tablet/capsule', label: 'Antiviral' },
  OTHER: { emoji: '💊', color: 'bg-gray-100', textColor: 'text-gray-800', shape: 'Various', label: 'Other' },
};

// Dosage form visual indicators
export const DOSAGE_FORM_ICONS: Record<string, string> = {
  TABLET: '💊',
  CAPSULE: '💊',
  SYRUP: '🧴',
  INJECTION: '💉',
  SUSPENSION: '🧴',
  CREAM: '🧴',
  OINTMENT: '🧴',
  DROPS: '💧',
  INHALER: '🫁',
  SUPPOSITORY: '💊',
  PATCH: '🩹',
  GEL: '🧴',
  SOLUTION: '🧪',
  POWDER: '📦',
  GRANULES: '📦',
};

// Route visual indicators
export const ROUTE_ICONS: Record<string, string> = {
  ORAL: '👄',
  IV: '💉',
  IM: '💉',
  SC: '💉',
  TOPICAL: '🧴',
  RECTAL: '💊',
  INHALATION: '🫁',
  OPHTHALMIC: '👁️',
  SUBLINGUAL: '👅',
};

const DRUG_VISUALS_DEFAULT: DrugVisual = { emoji: '💊', color: 'bg-gray-100', textColor: 'text-gray-800', shape: 'Various', label: 'Other' };

export function getDrugVisual(category: string): DrugVisual {
  const key = category as keyof typeof DRUG_VISUALS;
  return key in DRUG_VISUALS ? (DRUG_VISUALS[key] as DrugVisual) : DRUG_VISUALS_DEFAULT;
}

export function getDosageFormIcon(form: string | undefined): string {
  return DOSAGE_FORM_ICONS[form ?? ''] ?? '💊';
}

export function getRouteIcon(route: string | undefined): string {
  return ROUTE_ICONS[route ?? ''] ?? '💊';
}

/**
 * Get a simple pill color based on drug category
 */
export function getPillColor(category: string): string {
  const colors: Record<string, string> = {
    ANALGESIC: '#3B82F6',     // blue
    ANTIBIOTIC: '#EF4444',    // red
    ANTIMALARIAL: '#F59E0B',  // amber
    ANTIRETROVIRAL: '#8B5CF6', // purple
    CARDIOVASCULAR: '#F43F5E', // rose
    ENDOCRINE: '#14B8A6',     // teal
    GASTROINTESTINAL: '#10B981', // emerald
    RESPIRATORY: '#0EA5E9',   // sky
    NEUROLOGICAL: '#7C3AED',  // violet
    HORMONE: '#EC4899',       // pink
    VITAMIN: '#84CC16',       // lime
    ANTIFUNGAL: '#F97316',    // orange
    ANTIPARASITIC: '#EAB308',  // yellow
    DERMATOLOGICAL: '#78716C', // stone
    OPHTHALMIC: '#06B6D4',    // cyan
    ANTIVIRAL: '#6366F1',     // indigo
  };
  return colors[category] ?? '#6B7280';
}

/**
 * Get a visual badge component props for a drug
 */
export function getDrugBadgeProps(drug: { category: string; whoEssential?: boolean; ghanaEssential?: boolean; prescriptionOnly?: boolean; controlledSchedule?: string }) {
  const visual = getDrugVisual(drug.category);
  return {
    visual,
    badges: [
      drug.whoEssential ? { text: 'WHO', color: 'green' as const } : null,
      drug.ghanaEssential ? { text: 'Ghana EML', color: 'blue' as const } : null,
      drug.prescriptionOnly ? { text: 'POM', color: 'red' as const } : { text: 'OTC', color: 'green' as const },
      drug.controlledSchedule ? { text: drug.controlledSchedule.replace('_', ' '), color: 'gold' as const } : null,
    ].filter(Boolean),
  };
}
