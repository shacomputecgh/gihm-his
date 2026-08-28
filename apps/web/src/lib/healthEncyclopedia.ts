/**
 * ShaComputeC Health Encyclopedia — comprehensive database of diseases, drugs,
 * procedures, lab tests, and health topics for Ghana and globally.
 * This powers the DrAugustAI assistant when the backend API is unavailable.
 */

export interface EncyclopediaEntry {
  id: string;
  name: string;
  category: string;
  tags: string[];
  content: string;
}

// ─── DISEASES ────────────────────────────────────────────────────────────────

export const DISEASES: EncyclopediaEntry[] = [
  // MALARIA
  { id: 'D001', name: 'Malaria', category: 'Infectious Disease', tags: ['malaria', 'plasmodium', 'fever', 'mosquito', 'parasite', 'gambiae', 'anopheles'],
    content: `**Malaria** is a life-threatening disease caused by Plasmodium parasites transmitted through infected Anopheles mosquitoes.\n\n**Causative Organisms:**\n• P. falciparum (most dangerous — predominant in Ghana)\n• P. vivax, P. ovale, P. malariae, P. knowlesi\n\n**Symptoms:**\n• High fever, chills, rigors\n• Headache, body aches\n• Nausea, vomiting, diarrhoea\n• Sweating, fatigue\n• Severe: cerebral malaria, severe anaemia, organ failure\n\n**Diagnosis:**\n• Rapid Diagnostic Test (RDT)\n• Thick and thin blood film\n• Full blood count\n\n**Treatment (Ghana National Guidelines):\n• Uncomplicated: Artemether-Lumefantrine (Coartem) 3-day course\n• Dose: Adults 80/480mg (4 tabs BD × 3 days)\n• Severe: IV Artesunate 2.4mg/kg at 0, 12, 24h then daily\n• After IV artesunate → complete with oral ACT\n\n**Prevention:**\n• Insecticide-treated nets (ITNs)\n• Indoor residual spraying (IRS)\n• Intermittent Preventive Treatment in Pregnancy (IPTp) with SP\n• Chemoprophylaxis for travellers\n\n**Ghana Statistics:** Ghana accounts for ~2% of global malaria cases. Korle-Bu and teaching hospitals see thousands of cases annually.` },

  // HYPERTENSION
  { id: 'D002', name: 'Hypertension', category: 'Non-Communicable Disease', tags: ['hypertension', 'blood pressure', 'cardiovascular', 'stroke', 'heart disease', 'high BP'],
    content: `**Hypertension** is persistently elevated blood pressure (≥140/90 mmHg).\n\n**Classification:**\n• Normal: <120/80\n• Elevated: 120-129/<80\n• Stage 1: 130-139/80-89\n• Stage 2: ≥140/≥90\n• Hypertensive Crisis: >180/>120\n\n**Types:**\n• Primary (Essential) — 90-95%\n• Secondary — 5-10% (renal, endocrine, drugs)\n\n**Symptoms:** Often asymptomatic. When severe: headache, dizziness, blurred vision, epistaxis.\n\n**Complications:**\n• Stroke (haemorrhagic or ischaemic)\n• Heart failure, MI\n• Chronic kidney disease\n• Retinopathy\n• Hypertensive encephalopathy\n\n**Treatment (Ghana Guidelines):\n• First-line: ACE inhibitors (Enalapril 5-20mg OD) or ARBs (Losartan 50-100mg OD)\n• Second-line: Amlodipine 5-10mg OD, HCTZ 12.5-25mg OD\n• Combination therapy for Stage 2\n• Target: <140/90 (general), <130/80 (diabetics, CKD)\n\n**Lifestyle:**\n• DASH diet, low sodium (<2g/day)\n• Regular exercise (150 min/week)\n• Weight management, limit alcohol, stop smoking` },

  // DIABETES
  { id: 'D003', name: 'Diabetes Mellitus', category: 'Non-Communicable Disease', tags: ['diabetes', 'blood sugar', 'glucose', 'insulin', 'type 1', 'type 2', 'HbA1c'],
    content: `**Diabetes Mellitus** is a metabolic disorder of chronic hyperglycaemia.\n\n**Types:**\n• Type 1 — autoimmune destruction of β-cells\n• Type 2 — insulin resistance (most common)\n• Gestational diabetes\n• Secondary (pancreatitis, steroids, Cushing's)\n\n**Diagnostic Criteria:**\n• Fasting glucose ≥7.0 mmol/L\n• 2-hour OGTT ≥11.1 mmol/L\n• Random glucose ≥11.1 + symptoms\n• HbA1c ≥6.5%\n\n**Complications:**\n• Microvascular: retinopathy, nephropathy, neuropathy\n• Macrovascular: CAD, stroke, PVD\n• Diabetic ketoacidosis (DKA), Hyperosmolar state\n\n**Treatment (Ghana Guidelines):\n• Type 1: Insulin (Mixtard 30/70 or Actrapid + Protaphane)\n• Type 2 Step 1: Metformin 500mg TDS\n• Type 2 Step 2: + Gliclazide 80mg BD or Glimepiride\n• Type 2 Step 3: + Insulin\n• Target HbA1c: <7% (individualized)\n\n**Ghana Context:** Prevalence ~4.5%. Many patients present late with complications.` },

  // HIV/AIDS
  { id: 'D004', name: 'HIV/AIDS', category: 'Infectious Disease', tags: ['hiv', 'aids', 'antiretroviral', 'art', 'cd4', 'viral load', 'immunodeficiency'],
    content: `**HIV (Human Immunodeficiency Virus)** attacks CD4+ T-lymphocytes causing immunodeficiency.\n\n**Transmission:**\n• Sexual contact (most common)\n• Mother-to-child (PMTCT)\n• Blood/blood products\n• Needle sharing\n\n**Stages:**\n• Acute HIV (2-4 weeks) — flu-like illness\n• Clinical latency\n• AIDS: CD4 <200 or opportunistic infections\n\n**Diagnosis:**\n• Rapid HIV test (Determine + First Response confirmatory)\n• HIV viral load (gold standard for monitoring)\n• CD4 count\n\n**Treatment — ART (Ghana Guidelines):\n• First-line adults: TDF/3TC/DTG (Tenofir/Lamivudine/Dolutegravir)\n• Alternative: AZT/3TC/EFV or AZT/3TC/NVP\n• PMTCT: Option B+ (lifelong ART for all HIV+ pregnant women)\n• Paediatric: ABC/3TC/DTG or ABC/3TC/LPV/r\n• Target: Viral load <1000 copies/mL (suppression)\n\n**Prevention:** PrEP, PEP, condom use, PMTCT, male circumcision.` },

  // TUBERCULOSIS
  { id: 'D005', name: 'Tuberculosis (TB)', category: 'Infectious Disease', tags: ['tb', 'tuberculosis', 'mycobacterium', 'pulmonary', 'cough', 'bacilli'],
    content: `**Tuberculosis** is caused by Mycobacterium tuberculosis, primarily affecting the lungs.\n\n**Symptoms:**\n• Chronic cough >2 weeks, haemoptysis\n• Night sweats, weight loss, fever\n• Fatigue, anorexia\n\n**Diagnosis:**\n• Sputum AFB smear (2 samples)\n• GeneXpert MTB/RIF\n• Chest X-ray\n• Tuberculin skin test (Mantoux)\n• Culture (Löwenstein-Jensen)\n\n**Treatment (Ghana / WHO):\n• Category I (new): 2RHZE/4RH\n  - Intensive phase: Rifampicin, Isoniazid, Pyrazinamide, Ethambutol × 2 months\n  - Continuation: Rifampicin, Isoniazid × 4 months\n• Category II (retreatment): 2SRHZES/1RHZ/5RHE\n• MDR-TB: Individualized regimen\n\n**BCG Vaccination:** Given at birth in Ghana.` },

  // SICKLE CELL DISEASE
  { id: 'D006', name: 'Sickle Cell Disease', category: 'Haematological', tags: ['sickle cell', 'anaemia', 'haemoglobin', 'hbss', 'genetic', 'blood', 'crisis'],
    content: `**Sickle Cell Disease (SCD)** is an inherited haemoglobinopathy where HbS polymerizes under low oxygen.\n\n**Genotypes:** HbSS (severe), HbSC, HbSβ-thalassemia\n\n**Clinical Features:**\n• Vaso-occlusive crisis (painful crisis)\n• Anaemia, jaundice\n• Splenic sequestration\n• Acute chest syndrome\n• Stroke (in children)\n• Priapism\n• Aplastic crisis\n• Osteomyelitis (Salmonella, Staph)\n\n**Management (Ghana Guidelines):\n• Prophylactic: Folic acid 5mg daily\n• Penicillin V prophylaxis (children)\n• Pain crisis: IV fluids, analgesics (paracetamol → tramadol → morphine)\n• Hydroxyurea (disease-modifying)\n• Blood transfusion for severe anaemia\n• Pneumococcal and influenza vaccines\n\n**Ghana Context:** 15-20% carrier rate. Newborn screening programme in progress.` },

  // ASTHMA
  { id: 'D007', name: 'Asthma', category: 'Respiratory', tags: ['asthma', 'bronchial', 'wheezing', 'bronchodilator', 'inhaler', 'respiratory'],
    content: `**Asthma** is a chronic inflammatory airway disease causing reversible airflow obstruction.\n\n**Symptoms:** Wheezing, cough (especially nocturnal), dyspnoea, chest tightness.\n\n**Triggers:** Allergens, dust, cold air, exercise, infections, smoke.\n\n**Classification (GINA):\n• Mild intermittent\n• Mild persistent\n• Moderate persistent\n• Severe persistent\n\n**Treatment (GINA / Ghana):\n• Reliever: Salbutamol (Ventolin) 100mcg MDI — 2-4 puffs PRN\n• Controller: Budesonide (Pulmicort) 200-800mcg/day\n• Step-up: + Formoterol (Symbicort) or LABA\n• Severe: Oral prednisolone short course\n• SMART therapy: Budesonide-formoterol as both reliever and controller\n\n**Asthma Action Plan:** Green, Yellow, Red zone system.` },

  // PNEUMONIA
  { id: 'D008', name: 'Pneumonia', category: 'Respiratory', tags: ['pneumonia', 'lung infection', 'chest infection', 'antibiotic', 'respiratory'],
    content: `**Pneumonia** is an acute infection of the lung parenchyma.\n\n**Classification:**\n• Community-acquired (CAP)\n• Hospital-acquired (HAP)\n• Aspiration pneumonia\n\n**Symptoms:** Fever, productive cough, dyspnoea, pleuritic chest pain.\n\n**Investigations:**\n• Chest X-ray (consolidation)\n• Sputum culture\n• Blood culture, CRP/PCT\n• Pulse oximetry\n\n**Treatment (Ghana IMCI/WHO):\n• Mild (outpatient): Amoxicillin 25-50mg/kg TDS × 5 days\n• Moderate (hospital): IV Ampicillin/Gentamicin\n• Severe: IV Amoxicillin-clavulanate + Azithromycin\n• Oxygen if SpO2 <90%\n\n**Ghana Context:** Leading cause of under-5 mortality alongside malaria.` },

  // CHOLERA
  { id: 'D009', name: 'Cholera', category: 'Infectious Disease', tags: ['cholera', 'diarrhoea', 'waterborne', 'vibrio', 'oral rehydration', 'outbreak'],
    content: `**Cholera** is an acute watery diarrhoea caused by Vibrio cholerae (serogroup O1 or O139).\n\n**Transmission:** Faecal-oral, contaminated water/food.\n\n**Symptoms:**\n• Profuse watery diarrhoea ("rice-water stool")\n• Vomiting\n• Rapid dehydration, muscle cramps\n• Can be fatal within hours if untreated\n\n**Treatment (WHO):\n• ORS (Oral Rehydration Salts) — mild/moderate\n• IV Ringer's Lactate — severe dehydration\n• Doxycycline 300mg single dose (adults)\n• Azithromycin 1g single dose (alternative)\n• Zinc supplementation (children)\n\n**Prevention:**\n• Clean water, sanitation, hygiene (WASH)\n• Oral cholera vaccine (OCV)\n• Health education\n\n**Ghana:** Periodic outbreaks, especially during rainy season.` },

  // COVID-19
  { id: 'D010', name: 'COVID-19', category: 'Infectious Disease', tags: ['covid', 'coronavirus', 'sars-cov-2', 'pandemic', 'respiratory', 'vaccine'],
    content: `**COVID-19** is caused by SARS-CoV-2 virus.\n\n**Symptoms:**\n• Fever, dry cough, fatigue\n• Loss of taste/smell\n• Dyspnoea, chest pain (severe)\n• Can progress to ARDS, multi-organ failure\n\n**Diagnosis:**\n• RT-PCR (gold standard)\n• Rapid Antigen Test\n• Chest CT: ground-glass opacities\n\n**Treatment:**\n• Mild: Symptomatic — Paracetamol, fluids, rest\n• Moderate: Oxygen, prone positioning\n• Severe: Dexamethasone 6mg/day × 10 days, Remdesivir\n• Anticoagulation for thromboprophylaxis\n\n**Vaccines (Ghana):\n• AstraZeneca (Covishield)\n• Pfizer-BioNTech\n• Moderna, J&J\n• Booster doses recommended\n\n**Ghana Context:** Over 161,000 cases, 1,400+ deaths. Vaccination rollout ongoing.` },

  // HEPATITIS B
  { id: 'D011', name: 'Hepatitis B', category: 'Infectious Disease', tags: ['hepatitis', 'liver', 'hbv', 'vaccine', 'cirrhosis', 'hepatocellular'],
    content: `**Hepatitis B** is a DNA virus causing liver inflammation.\n\n**Transmission:** Blood, sexual contact, mother-to-child.\n\n**Phases:**\n• Immune tolerant\n• Immune active\n• Inactive carrier\n• Reactivation\n\n**Diagnosis:**\n• HBsAg (marker of infection)\n• Anti-HBs (immunity)\n• HBeAg (replication)\n• HBV DNA (viral load)\n• Liver function tests\n\n**Treatment:**\n• Acute: Supportive (usually self-limiting)\n• Chronic: Tenofovir 300mg OD or Entecavir 0.5mg OD\n• Indications: HBV DNA >2000, ALT elevated, fibrosis\n\n**Prevention:**\n• HBV vaccine (birth dose in Ghana)\n• HBIG for neonates of HBV+ mothers\n• Safe sex, needle safety\n\n**Ghana:** ~8-12% HBsAg prevalence. Universal childhood vaccination since 2002.` },

  // MENTAL HEALTH
  { id: 'D012', name: 'Depression', category: 'Mental Health', tags: ['depression', 'mental health', 'antidepressant', 'ssri', 'suicide', 'mood'],
    content: `**Depression (Major Depressive Disorder)** is a common mental disorder.\n\n**Symptoms (>2 weeks):\n• Persistent low mood or anhedonia\n• Sleep disturbance (insomnia/hypersomnia)\n• Appetite/weight changes\n• Fatigue, loss of energy\n• Poor concentration\n• Feelings of worthlessness/guilt\n• Suicidal ideation\n\n**Diagnosis:** PHQ-9 screening, clinical interview.\n\n**Treatment:**\n• Psychotherapy (CBT)\n• Pharmacotherapy:\n  - First-line: SSRIs — Fluoxetine 20mg, Sertraline 50-200mg\n  - Second-line: SNRIs — Venlafaxine\n  - Severe: Amitriptyline, ECT\n• Combination: therapy + medication\n\n**Ghana Context:** Limited psychiatrists (~40 for 30M+ population). Task-shifting to community health workers. Mental Health Act 2012.` },

  // DIARRHOEA
  { id: 'D013', name: 'Acute Diarrhoeal Disease', category: 'Gastrointestinal', tags: ['diarrhoea', 'gastroenteritis', 'dehydration', 'ors', 'rotavirus'],
    content: `**Acute diarrhoea** is ≥3 loose stools in 24 hours.\n\n**Causes:**\n• Viral: Rotavirus (children), Norovirus\n• Bacterial: E. coli, Salmonella, Shigella, Campylobacter\n• Parasitic: Giardia, Cryptosporidium\n\n**Assessment (WHO Classification):\n• No dehydration: <3 signs\n• Some dehydration: 2 of (restless, sunken eyes, drinks eagerly, skin pinch goes back slowly)\n• Severe dehydration: lethargic, unable to drink, skin pinch goes back very slowly (>2s)\n\n**Treatment (WHO):\n• All cases: Zinc 20mg/day × 10-14 days (children)\n• No dehydration: ORS + continued feeding\n• Some dehydration: ORS 75mL/kg over 4 hours\n• Severe: IV Ringer's Lactate 100mL/kg over 3-6 hours\n\n**Prevention:** Handwashing, clean water, rotavirus vaccine, breastfeeding.` },

  // TRAUMA
  { id: 'D014', name: 'Road Traffic Accidents', category: 'Trauma', tags: ['accident', 'trauma', 'road', 'fracture', 'injury', 'emergency', 'rtu'],
    content: `**Road Traffic Accidents (RTAs)** are a leading cause of death and disability in Ghana.\n\n**Primary Survey (ATLS):\n• Airway (with cervical spine protection)\n• Breathing\n• Circulation (haemorrhage control)\n• Disability (neurological status — GCS, pupils)\n• Exposure (full examination)\n\n**Common Injuries:**\n• Head injury (GCS scoring)\n• Chest trauma (pneumothorax, haemothorax)\n• Abdominal trauma (splenic/liver rupture)\n• Pelvic fractures\n• Long bone fractures\n• Spinal injuries\n\n**Management:**\n• ABCDE approach\n• IV access, fluids (Ringer's Lactate)\n• Blood grouping and crossmatch\n• Analgesia\n• Tetanus prophylaxis\n• Surgical intervention as needed\n\n**Ghana:** ~2,500 RTA deaths/year. Korle-Bu National Surgical Centre handles major trauma.` },

  // MATERNAL HEALTH
  { id: 'D015', name: 'Pre-eclampsia/Eclampsia', category: 'Obstetrics', tags: ['pre-eclampsia', 'eclampsia', 'pregnancy', 'hypertension', 'seizure', 'maternal'],
    content: `**Pre-eclampsia** is new-onset hypertension (≥140/90) with proteinuria after 20 weeks.\n**Eclampsia** = pre-eclampsia + seizures.\n\n**Risk Factors:**\n• First pregnancy, multiple gestation\n• Teenage pregnancy, advanced maternal age\n• Obesity, chronic hypertension, diabetes\n• Family history\n\n**Symptoms:** Headache, visual disturbances, epigastric pain, oedema.\n\n**Diagnosis:**\n• BP ≥140/90 on 2 occasions\n• Proteinuria (dipstick ≥2+)\n• HELLP syndrome (low platelets, elevated LFTs, haemolysis)\n\n**Treatment (Ghana Guidelines):\n• Mild: Bed rest, monitoring, antihypertensives\n• Severe: IV Labetalol or Hydralazine\n• MgSO4 for seizure prevention/treatment\n  - Loading: 4g IV over 20 min\n  - Maintenance: 1-2g/hr infusion\n  - Antidote: Calcium gluconate 10%\n• Delivery is the definitive treatment\n\n**Ghana:** Leading cause of maternal mortality. Delayed presentation common.` },

  // NEONATAL
  { id: 'D016', name: 'Neonatal Sepsis', category: 'Paediatrics', tags: ['neonatal', 'sepsis', 'newborn', 'infection', 'baby', 'neonatal fever'],
    content: `**Neonatal sepsis** is systemic infection in the first 28 days of life.\n\n**Classification:**\n• Early-onset (<72 hours) — GBS, E. coli, Listeria\n• Late-onset (>72 hours) — S. aureus, Klebsiella, Pseudomonas\n\n**Symptoms:** Lethargy, poor feeding, fever/hypothermia, respiratory distress, jaundice, seizures.\n\n**Diagnosis:**\n• Blood culture (gold standard)\n• CRP, full blood count\n• Lumbar puncture (if indicated)\n\n**Treatment (Ghana IMNCI):\n• Serious infection: IV Ampicillin + Gentamicin × 7-10 days\n• Severe: IV Ampicillin + Cefotaxime\n• Supportive: Oxygen, IV fluids, thermoregulation\n\n**Prevention:**\n• Clean delivery practice\n• Cord care (dry cord care)\n• Kangaroo Mother Care (KMC)\n• Exclusive breastfeeding` },

  // DIARRHEA IN CHILDREN
  { id: 'D017', name: 'Malnutrition', category: 'Paediatrics', tags: ['malnutrition', 'undernutrition', 'kwashiorkor', 'marasmus', 'wasting', 'stunting'],
    content: `**Malnutrition** includes undernutrition, micronutrient deficiency, and overweight.\n\n**Types:**\n• Kwashiorkor: Oedema, fatty liver, skin changes\n• Marasmus: Wasting, muscle wasting, no oedema\n• Marasmic-kwashiorkor: Mixed\n\n**Assessment:**\n• Weight-for-age (underweight)\n• Height-for-age (stunting)\n• Weight-for-height (wasting)\n• MUAC (Mid-Upper Arm Circumference)\n  - <11.5cm: Severe acute malnutrition (SAM)\n  - 11.5-12.5cm: Moderate acute malnutrition (MAM)\n\n**Treatment (WHO):\n• SAM: F-75 and F-100 therapeutic milk, RUTF (Plumpy'Nut)\n• MAM: Supplementary feeding\n• Micronutrient supplementation\n• Treat complications (hypoglycaemia, hypothermia, dehydration, infection)\n\n**Ghana:** ~18% stunting, ~5% wasting in under-5s. Community-based management (CMAM) programme.` },

  // HIV
  { id: 'D018', name: 'Hepatitis C', category: 'Infectious Disease', tags: ['hepatitis c', 'hcv', 'liver', 'cirrhosis', 'antiviral'],
    content: `**Hepatitis C** is caused by HCV, a blood-borne RNA virus.\n\n**Transmission:** Blood, needles, rarely sexual.\n\n**Diagnosis:**\n• Anti-HCV antibody\n• HCV RNA PCR (confirms active infection)\n• Genotyping\n\n**Treatment:**\n• Direct-Acting Antivirals (DAAs)\n• Sofosbuvir/Ledipasvir 12 weeks\n• Sustained Virological Response (SVR) cure rates >95%\n\n**Ghana:** Limited prevalence (~1-2%), but underdiagnosed.` },

  // EPILEPSY
  { id: 'D019', name: 'Epilepsy', category: 'Neurological', tags: ['epilepsy', 'seizure', 'convulsion', 'antiepileptic', 'brain'],
    content: `**Epilepsy** is a chronic neurological disorder with recurrent seizures.\n\n**Types of Seizures:**\n• Focal (partial): simple, complex\n• Generalized: tonic-clonic, absence, myoclonic\n\n**Diagnosis:**\n• Clinical history\n• EEG\n• Brain imaging (CT/MRI)\n\n**Treatment (WHO/Ghana):\n• First-line: Valproic acid 200-400mg BD\n• Alternative: Carbamazepine 200-400mg BD\n• Phenytoin 100mg TDS\n• Phenobarbital (resource-limited settings)\n• >70% seizure-free with appropriate medication\n\n**Emergency (Status Epilepticus):\n• Diazepam 10mg IV/rectal\n• Phenytoin loading\n• ICU care` },

  // NEPHROTIC SYNDROME
  { id: 'D020', name: 'Nephrotic Syndrome', category: 'Renal', tags: ['nephrotic', 'kidney', 'proteinuria', 'oedema', 'renal'],
    content: `**Nephrotic Syndrome** features: heavy proteinuria (>3.5g/day), hypoalbuminaemia, oedema, hyperlipidaemia.\n\n**Causes:**\n• Minimal change disease (children)\n• Focal segmental glomerulosclerosis\n• Membranous nephropathy\n• Diabetic nephropathy\n\n**Treatment:**\n• Diuretics for oedema (Furosemide)\n• ACE inhibitors (reduce proteinuria)\n• Steroids for minimal change (Prednisolone)\n• Immunosuppressants for steroid-resistant\n• Low salt diet, manage complications` },

  // DRUGS
  { id: 'D021', name: 'Typhoid Fever', category: 'Infectious Disease', tags: ['typhoid', 'enteric fever', 'salmonella', 'widal'],
    content: `**Typhoid Fever** is caused by Salmonella typhi.\n\n**Transmission:** Faecal-oral (contaminated food/water).\n\n**Symptoms:** Step-ladder fever, headache, abdominal pain, rose spots, bradycardia.\n\n**Diagnosis:**\n• Blood culture (gold standard)\n• Widal test (limited sensitivity)\n• Stool culture\n\n**Treatment:**\n• Ciprofloxacin 500mg BD × 7 days\n• Azithromycin 500mg OD × 7 days\n• Severe: IV Ceftriaxone 2g OD × 10-14 days\n• Chloramphenicol (alternative)\n\n**Prevention:** Clean water, sanitation, Typhoid vaccine.` },

  // DIABETES
  { id: 'D022', name: 'Peptic Ulcer Disease', category: 'Gastrointestinal', tags: ['ulcer', 'gastric', 'duodenal', 'ppi', 'helicobacter', 'abdominal pain'],
    content: `**Peptic Ulcer Disease (PUD)** involves breaks in the gastric or duodenal mucosa.\n\n**Causes:**\n• H. pylori infection (most common)\n• NSAIDs\n• Stress ulcers\n\n**Symptoms:** Epigastric pain, burning, bloating, nausea.\n\n**Diagnosis:**\n• Upper GI endoscopy\n• H. pylori testing (urea breath test, stool antigen, biopsy)\n\n**Treatment:**\n• PPIs: Omeprazole 20mg OD, Lansoprazole 30mg OD\n• H. pylori triple therapy: PPI + Amoxicillin + Metronidazole × 14 days\n• H. pylori quadruple therapy: PPI + Bismuth + Metronidazole + Tetracycline\n• Discontinue NSAIDs\n\n**Complications:** Perforation, haemorrhage, obstruction.` },

  // EYE DISEASES
  { id: 'D023', name: 'Glaucoma', category: 'Ophthalmology', tags: ['glaucoma', 'eye', 'intraocular pressure', 'vision loss', 'blindness'],
    content: `**Glaucoma** is progressive optic neuropathy with elevated intraocular pressure (IOP).\n\n**Types:**\n• Primary open-angle (most common)\n• Angle-closure (acute emergency)\n• Secondary\n• Congenital\n\n**Symptoms:**\n• Open-angle: Gradual peripheral vision loss (silent)\n• Acute angle-closure: Severe eye pain, headache, nausea, halos, blurred vision\n\n**Diagnosis:**\n• Tonometry (IOP measurement)\n• Fundoscopy (optic disc cupping)\n• Visual field testing\n• OCT\n\n**Treatment:**\n• Eye drops: Timolol 0.5%, Latanoprost, Dorzolamide\n• Laser trabeculoplasty\n• Trabeculectomy (surgical)\n• Emergency: Acute angle-closure → Timolol + Acetazolamide + Pilocarpine → Laser iridotomy\n\n**Ghana:** Leading cause of irreversible blindness.` },

  // CANCER
  { id: 'D024', name: 'Breast Cancer', category: 'Oncology', tags: ['breast cancer', 'tumour', 'oncology', 'mammography', 'chemotherapy'],
    content: `**Breast Cancer** is the most common cancer in Ghanaian women.\n\n**Risk Factors:**\n• Age >40, family history\n• BRCA1/BRCA2 mutations\n• Obesity, alcohol, nulliparity\n\n**Symptoms:**\n• Breast lump (painless, hard, irregular)\n• Nipple discharge (bloody)\n• Skin changes (peau d'orange)\n• Axillary lymphadenopathy\n\n**Staging:** TNM system (I-IV)\n\n**Diagnosis:**\n• Clinical breast examination\n• Mammography, ultrasound\n• Core needle biopsy → histology\n• ER/PR/HER2 testing\n\n**Treatment:**\n• Surgery: Lumpectomy or mastectomy + axillary clearance\n• Chemotherapy: FAC (5-FU, Adriamycin, Cyclophosphamide) or AC-T\n• Radiotherapy\n• Hormonal: Tamoxifen (ER+)\n• Targeted: Trastuzumab (HER2+)\n\n**Ghana:** Korle-Bu is the main cancer treatment centre. Many present at advanced stages.` },

  // NUTRITION
  { id: 'D025', name: 'Iron Deficiency Anaemia', category: 'Haematological', tags: ['anaemia', 'iron', 'haemoglobin', 'blood', 'pallor', 'fatigue', 'pregnancy'],
    content: `**Iron Deficiency Anaemia** is the most common type of anaemia worldwide.\n\n**Causes:**\n• Blood loss (menorrhagia, GI bleeding)\n• Inadequate intake\n• Malabsorption\n• Increased demand (pregnancy, growth)\n\n**Symptoms:** Fatigue, weakness, pallor, dyspnoea on exertion, pica, koilonychia.\n\n**Diagnosis:**\n• Hb <12g/dL (women), <13g/dL (men)\n• Low MCV, MCH, MCHC\n• Low serum ferritin\n• Low serum iron, high TIBC\n\n**Treatment:**\n• Oral ferrous sulphate 200mg TDS (elemental iron 60mg TDS)\n• Take with vitamin C for absorption\n• Avoid tea/coffee within 2 hours\n• Severe: IV iron (iron sucrose) or blood transfusion\n• Treat underlying cause\n\n**Ghana:** Very common, especially in pregnant women and young children.` },
];

// ─── DRUGS ───────────────────────────────────────────────────────────────────

export const DRUGS: EncyclopediaEntry[] = [
  { id: 'DR001', name: 'Paracetamol (Acetaminophen)', category: 'Analgesic', tags: ['paracetamol', 'acetaminophen', 'pain', 'fever', 'analgesic', 'antipyretic'],
    content: `**Paracetamol** — First-line analgesic and antipyretic.\n\n**Dosing:**\n• Adults: 500mg-1g QID (max 4g/day)\n• Children: 15mg/kg/dose QID (max 60mg/kg/day)\n• Neonates: 10-15mg/kg QID\n\n**Formulations:** Tablets 500mg, syrup 120mg/5mL, suppositories, IV.\n\n**Mechanism:** Central COX inhibition, possibly endocannabinoid system.\n\n**Side Effects:** Rare at therapeutic doses. Hepatotoxic in overdose.\n\n**Overdose:** N-acetylcysteine (NAC) within 8 hours. Rumack-Matthew nomogram.\n\n**Use in pregnancy:** Safe (Category B). First-line in pregnancy for pain/fever.\n\n**Use in liver disease:** Reduce dose in chronic liver disease. Avoid in active liver disease.\n\n**Interactions:** Warfarin (mild increase), alcohol (increased hepatotoxicity).` },

  { id: 'DR002', name: 'Amoxicillin', category: 'Antibiotic', tags: ['amoxicillin', 'antibiotic', 'penicillin', 'infection', 'bacteria', 'respiratory'],
    content: `**Amoxicillin** — Broad-spectrum aminopenicillin.\n\n**Indications:**\n• Upper/lower respiratory tract infections\n• UTI, skin/soft tissue infections\n• H. pylori triple therapy\n• Otitis media, sinusitis\n• Dental infections\n\n**Dosing:**\n• Adults: 250-500mg TDS (max 3g/day)\n• Children: 25-50mg/kg/day divided TDS\n• Severe: IV 1g TDS\n\n**Formulations:** Capsules 250mg, 500mg; syrup 125mg/5mL, 250mg/5mL.\n\n**Side Effects:** Diarrhoea, nausea, rash. Anaphylaxis (rare).\n\n**Contraindications:** Penicillin allergy.\n\n**In pregnancy:** Category B — safe.\n\n**Ghana Essential Drug:** WHO EML, Ghana EML.` },

  { id: 'DR003', name: 'Metformin', category: 'Antidiabetic', tags: ['metformin', 'diabetes', 'blood sugar', 'biguanide', 'glucose'],
    content: `**Metformin** — First-line oral antidiabetic for Type 2 DM.\n\n**Dosing:**\n• Start: 500mg BD with meals\n• Titrate: 500mg/week up to 2g/day\n• Extended release: 500-2000mg OD\n\n**Mechanism:** Decreases hepatic glucose production, increases insulin sensitivity.\n\n**Benefits:** Weight neutral/mild loss, no hypoglycaemia as monotherapy, cardiovascular benefit.\n\n**Side Effects:** GI (nausea, diarrhoea, metallic taste) — most common. Lactic acidosis (rare, serious).\n\n**Contraindications:**\n• eGFR <30 mL/min\n• Acute/chronic metabolic acidosis\n• Hepatic impairment\n• Excessive alcohol\n\n**Use in pregnancy:** Can be used (some guidelines) but insulin preferred.\n\n**Ghana Essential Drug:** First-line for T2DM per Ghana Diabetes Guidelines.` },

  { id: 'DR004', name: 'Artemether-Lumefantrine (Coartem)', category: 'Antimalarial', tags: ['artemether', 'lumefantrine', 'coartem', 'malaria', 'antimalarial', 'act'],
    content: `**Artemether-Lumefantrine (Coartem)** — First-line ACT for uncomplicated malaria.\n\n**Mechanism:** Artemether rapidly reduces parasite biomass; lumefantrine eliminates remaining parasites.\n\n**Dosing (weight-based):\n• 5-14kg: 1 tab BD × 3 days (6 doses)\n• 15-24kg: 2 tabs BD × 3 days\n• 25-34kg: 3 tabs BD × 3 days\n• ≥35kg: 4 tabs BD × 3 days\n• Each tab: Artemether 20mg + Lumefantrine 120mg\n• Take with fatty food/drinks\n\n**Formulations:** Tablets 20/120mg, Dispersible tablets (children)\n\n**Side Effects:** GI (nausea, vomiting), headache, dizziness. QT prolongation (rare).\n\n**Pregnancy:** First trimester: use only if no alternative. Second/third: safe.\n\n**Ghana:** National first-line ACT. Available at all health facilities.` },

  { id: 'DR005', name: 'Enalapril', category: 'Antihypertensive', tags: ['enalapril', 'ace inhibitor', 'blood pressure', 'hypertension', 'heart failure'],
    content: `**Enalapril** — ACE inhibitor, first-line antihypertensive.\n\n**Indications:**\n• Hypertension\n• Heart failure\n• Diabetic nephropathy (renoprotective)\n\n**Dosing:**\n• Start: 5mg OD\n• Titrate: up to 40mg/day in 1-2 divided doses\n• Heart failure: Start 2.5mg, titrate slowly\n\n**Side Effects:** Dry cough (10-15%), hyperkalemia, dizziness, angioedema (rare).\n\n**Contraindications:**\n• Pregnancy (teratogenic)\n• Bilateral renal artery stenosis\n• History of angioedema\n\n**Monitoring:** Renal function, potassium — check 1-2 weeks after initiation/titration.\n\n**Ghana Essential Drug:** First-line for hypertension per Ghana NCD Guidelines.` },

  { id: 'DR006', name: 'Tenofovir/Lamivudine/Dolutegravir (TLD)', category: 'Antiretroviral', tags: ['tenofovir', 'lamivudine', 'dolutegravir', 'tld', 'hiv', 'art', 'antiretroviral'],
    content: `**TLD (Tenofovir 300mg + Lamivudine 300mg + Dolutegravir 50mg)** — WHO preferred first-line ART.\n\n**Indications:** HIV-1 infection in adults and adolescents.\n\n**Dosing:** One tablet daily, with or without food.\n\n**Mechanism:**\n• Tenofovir + Lamivudine: NRTIs (block reverse transcriptase)\n• Dolutegravir: Integrase inhibitor (blocks viral DNA integration)\n\n**Side Effects:**\n• Common: Headache, insomnia, nausea\n• Serious: Renal impairment (tenofovir), hepatotoxicity\n• Weight gain (associated with DTG)\n\n**Monitoring:**\n• Viral load at 6 months, then annually\n• Renal function (serum creatinine, eGFR)\n• Weight, metabolic parameters\n\n**Ghana:** National first-line ART since 2018. Free at all ART centres. DTG transition completed.` },

  { id: 'DR007', name: 'Salbutamol (Ventolin)', category: 'Bronchodilator', tags: ['salbutamol', 'ventolin', 'asthma', 'bronchodilator', 'inhaler', 'respiratory'],
    content: `**Salbutamol** — Short-acting β2-agonist (SABA).\n\n**Indications:**\n• Acute bronchospasm\n• Asthma reliever\n• COPD\n• Exercise-induced bronchospasm\n\n**Dosing:**\n• MDI: 100mcg/puff, 1-2 puffs PRN\n• Nebuliser: 2.5-5mg in 3mL saline\n• Children: 100mcg/puff, 1-2 puffs PRN\n\n**Formulations:** MDI (HFA), nebuliser solution, syrup.\n\n**Side Effects:** Tachycardia, tremor, headache, hypokalaemia.\n\n**Overdose:** Hypokalaemia, tachyarrhythmias.\n\n**Note:** If using >3 times/week, step up controller therapy.` },

  { id: 'DR008', name: 'Omeprazole', category: 'Proton Pump Inhibitor', tags: ['omeprazole', 'ppi', 'ulcer', 'acid', 'reflux', 'gastric'],
    content: `**Omeprazole** — Proton pump inhibitor.\n\n**Indications:**\n• Peptic ulcer disease\n• GERD\n• H. pylori eradication (triple therapy)\n• NSAID gastropathy prophylaxis\n• Zollinger-Ellison syndrome\n\n**Dosing:**\n• Adults: 20mg OD (40mg for duodenal ulcer)\n• H. pylori: 20mg BD with antibiotics × 14 days\n• Severe: 40mg OD\n\n**Side Effects:** Headache, diarrhoea, nausea. Long-term: hypomagnesaemia, B12 deficiency, osteoporosis.\n\n**Use in pregnancy:** Category C — use only if benefit outweighs risk.\n\n**Ghana Essential Drug:** WHO EML.` },

  { id: 'DR009', name: 'Ciprofloxacin', category: 'Antibiotic', tags: ['ciprofloxacin', 'fluoroquinolone', 'antibiotic', 'uti', 'infection'],
    content: `**Ciprofloxacin** — Fluoroquinolone antibiotic.\n\n**Indications:**\n• UTI (including complicated)\n• Respiratory infections\n• Typhoid fever\n• Bone/joint infections\n• GI infections\n• Prostatitis\n\n**Dosing:**\n• Uncomplicated UTI: 250-500mg BD × 3 days\n• Complicated UTI: 500mg BD × 7-14 days\n• Typhoid: 500mg BD × 7 days\n• Severe: IV 200-400mg BD\n\n**Side Effects:** Nausea, diarrhoea, headache. Tendon rupture (rare), QT prolongation.\n\n**Contraindications:** Children <18 (except specific indications), pregnancy.\n\n**Interactions:** Antacids, iron, calcium (reduce absorption).` },

  { id: 'DR010', name: 'Amlodipine', category: 'Calcium Channel Blocker', tags: ['amlodipine', 'calcium channel blocker', 'blood pressure', 'hypertension', 'angina'],
    content: `**Amlodipine** — Dihydropyridine calcium channel blocker.\n\n**Indications:**\n• Hypertension (monotherapy or combination)\n• Angina (chronic stable, vasospastic)\n\n**Dosing:**\n• Start: 5mg OD\n• Usual: 5-10mg OD\n• Max: 10mg OD\n\n**Onset:** Gradual (days to weeks)\n\n**Side Effects:** Ankle oedema (dose-dependent), headache, flushing, dizziness, fatigue.\n\n**Benefits:** Once-daily dosing, no metabolic effects, safe in diabetes.\n\n**Use in pregnancy:** Category C — use if necessary.\n\n**Ghana Essential Drug:** Available at all health facilities. Used in combination with other antihypertensives.` },

  { id: 'DR011', name: 'Artesunate', category: 'Antimalarial', tags: ['artesunate', 'malaria', 'severe malaria', 'antimalarial', 'iv'],
    content: `**Artesunate** — Artemisinin derivative for severe malaria.\n\n**Indications:** Severe malaria (all ages).\n\n**Dosing:**\n• IV: 2.4mg/kg at 0h, 12h, 24h, then every 24h\n• Rectal: 10mg/kg single dose (pre-referral)\n• IM: 2.4mg/kg at 0h, 12h, 24h\n• After 24h parenteral → oral ACT to complete treatment\n\n**Formulations:** IV ampoule 60mg, rectal suppositories 100mg.\n\n**Side Effects:** Delayed haemolytic anaemia (post-artesunate), reticulocytopenia.\n\n**Monitoring:** Parasite count every 12h, Hb daily, renal function.\n\n**Ghana:** Available at all hospitals. Pre-referral rectal artesunate at CHPS/composite facilities.` },

  { id: 'DR012', name: 'Furosemide (Lasix)', category: 'Diuretic', tags: ['furosemide', 'lasix', 'diuretic', 'oedema', 'heart failure', 'fluid'],
    content: `**Furosemide** — Loop diuretic.\n\n**Indications:**\n• Oedema (heart failure, liver disease, nephrotic syndrome)\n• Hypertension (adjunct)\n• Pulmonary oedema\n• Hypercalcaemia\n\n**Dosing:**\n• Oral: 40-80mg OD, titrate to effect\n• IV: 20-80mg slow push\n• Max: 500mg/day\n\n**Side Effects:** Dehydration, hypokalaemia, hyponatraemia, hyperuricaemia, ototoxicity.\n\n**Monitoring:** Electrolytes, renal function, fluid balance.\n\n**Contraindications:** Anuria, hepatic coma, severe dehydration.\n\n**Ghana Essential Drug:** WHO EML.` },

  { id: 'DR013', name: 'Fluoxetine (Prozac)', category: 'Antidepressant', tags: ['fluoxetine', 'prozac', 'ssri', 'antidepressant', 'depression', 'anxiety'],
    content: `**Fluoxetine** — Selective Serotonin Reuptake Inhibitor (SSRI).\n\n**Indications:**\n• Major depressive disorder\n• OCD\n• Panic disorder\n• Bulimia nervosa\n• PMDD\n\n**Dosing:**\n• Depression: Start 20mg OD, may increase to 60mg\n• OCD: 20-60mg/day\n• Elderly: Start 10mg\n\n**Onset:** 2-4 weeks for full effect.\n\n**Side Effects:** Nausea, insomnia, sexual dysfunction, weight changes, anxiety (initial).\n\n**Important:**\n• Serotonin syndrome risk with MAOIs, tramadol\n• Discontinuation syndrome (less with fluoxetine due to long half-life)\n• Monitor suicidal ideation (especially in youth)\n\n**Pregnancy:** Category C — discuss risks/benefits.` },

  { id: 'DR014', name: 'Insulin (Mixtard 30/70)', category: 'Antidiabetic', tags: ['insulin', 'mixtard', 'diabetes', 'injection', 'blood sugar', 'type 1'],
    content: `**Mixtard 30/70** — Pre-mixed insulin (30% soluble/70% isophane).\n\n**Indications:**\n• Type 1 DM (with basal insulin)\n• Type 2 DM uncontrolled on oral agents\n• Gestational diabetes (if diet fails)\n• Diabetic emergencies (DKA)\n\n**Dosing:**\n• Individualized based on blood glucose monitoring\n• Start: 0.2-0.4 units/kg/day divided BD\n• Inject 30 min before meals (morning and evening)\n\n**Administration:** Subcutaneous injection. Rotate sites (abdomen, thigh, arm).\n\n**Side Effects:**\n• Hypoglycaemia (most common — educate patient)\n• Lipodystrophy at injection site\n• Weight gain\n\n**Storage:** Unopened: 2-8°C. In-use: Room temperature for 28 days.\n\n**Ghana:** Available at all health facilities. Free for diabetics in public sector.` },

  { id: 'DR015', name: 'Magnesium Sulphate', category: 'Obstetric', tags: ['magnesium sulphate', 'eclampsia', 'seizure', 'obstetric', 'pregnancy'],
    content: `**Magnesium Sulphate (MgSO4)** — Drug of choice for eclampsia/pre-eclampsia.\n\n**Indications:**\n• Eclampsia (treatment and prophylaxis)\n• Severe pre-eclampsia\n• Refractory status epilepticus\n\n**Dosing (Pritchard regimen):\n• Loading: 4g IV over 15-20 min (dissolve 4g in 100mL NS)\n• Maintenance: 1g/hr IV infusion (5g in 500mL NS)\n• OR 10g IM (5g in each buttock)\n\n**Monitoring (essential!):\n• Reflexes (must be present)\n• Respiratory rate (must be >12/min)\n• Urine output (must be >30mL/hr)\n• Pulse oximetry\n\n**Toxicity Signs:** Loss of reflexes, respiratory depression, cardiac arrest.\n\n**Antidote:** Calcium gluconate 10% — 10mL IV over 3-5 min.\n\n**Ghana:** WHO EML. Available at all hospitals. Used in all maternity units.` },
];

// ─── LAB TESTS ───────────────────────────────────────────────────────────────

export const LAB_TESTS: EncyclopediaEntry[] = [
  { id: 'L001', name: 'Full Blood Count (FBC)', category: 'Laboratory', tags: ['fbc', 'full blood count', 'cbc', 'blood test', 'haemoglobin', 'wbc', 'platelets'],
    content: `**Full Blood Count (FBC/CBC)** — Most commonly ordered blood test.\n\n**Parameters:**\n• Haemoglobin (Hb): M 13-17 g/dL, F 12-15 g/dL\n• White Blood Cells (WBC): 4-11 × 10⁹/L\n  - Neutrophils: 40-70%\n  - Lymphocytes: 20-40%\n  - Eosinophils: 1-4%\n  - Monocytes: 2-8%\n  - Basophils: 0-1%\n• Platelets: 150-400 × 10⁹/L\n• Haematocrit (PCV): M 40-54%, F 36-48%\n• MCV: 80-100 fL\n• MCH: 27-32 pg\n• MCHC: 32-36 g/dL\n• RDW: 11.5-14.5%\n\n**Clinical Significance:**\n• Anaemia: Hb <12 (F), <13 (M)\n• Infection: Elevated WBC/Neutrophils\n• Allergy/Parasites: Elevated Eosinophils\n• Viral infection: Elevated Lymphocytes\n• Thrombocytopenia: <150 × 10⁹/L\n• Thrombocytosis: >400 × 10⁹/L` },

  { id: 'L002', name: 'Blood Glucose', category: 'Laboratory', tags: ['blood sugar', 'glucose', 'diabetes', 'fasting', 'hba1c', 'random glucose'],
    content: `**Blood Glucose Tests:**\n\n**Fasting Blood Glucose (FBG):**\n• Normal: <5.6 mmol/L\n• Pre-diabetes: 5.6-6.9 mmol/L\n• Diabetes: ≥7.0 mmol/L\n• Fasting: 8-12 hours\n\n**Random Blood Glucose:**\n• Normal: <7.8 mmol/L\n• Diabetes: ≥11.1 mmol/L + symptoms\n\n**HbA1c (Glycated Haemoglobin):**\n• Normal: <5.7%\n• Pre-diabetes: 5.7-6.4%\n• Diabetes: ≥6.5%\n• Reflects 2-3 month average\n\n**OGTT (Oral Glucose Tolerance Test):**\n• 75g glucose load\n• 2-hour value: Normal <7.8, Pre-diabetes 7.8-11.0, Diabetes ≥11.1 mmol/L` },

  { id: 'L003', name: 'Liver Function Tests (LFTs)', category: 'Laboratory', tags: ['lft', 'liver function', 'alt', 'ast', 'bilirubin', 'albumin', 'liver'],
    content: `**Liver Function Tests:**\n\n**Parameters:**\n• ALT (Alanine Aminotransferase): 0-41 U/L\n  - Elevated in hepatocellular damage\n• AST (Aspartate Aminotransferase): 0-40 U/L\n• ALP (Alkaline Phosphatase): 44-147 U/L\n  - Elevated in cholestasis, bone disease\n• GGT (Gamma-GT): M 8-61, F 5-36 U/L\n  - Elevated in alcohol use, cholestasis\n• Total Bilirubin: 0-21 μmol/L\n  - Jaundice: >40 μmol/L\n• Direct Bilirubin: 0-5 μmol/L\n• Albumin: 35-50 g/L\n  - Low in chronic liver disease, nephrotic syndrome\n• Total Protein: 60-80 g/L\n• PT/INR: Assess synthetic function\n\n**Patterns:**\n• Hepatocellular: ALT > AST\n• Alcoholic liver: AST > ALT (2:1 ratio)\n• Cholestatic: Elevated ALP, GGT` },

  { id: 'L004', name: 'Urinalysis', category: 'Laboratory', tags: ['urine', 'urinalysis', 'dipstick', 'protein', 'blood', 'glucose', 'ketones'],
    content: `**Urinalysis / Urine Dipstick:**\n\n**Parameters:**\n• Colour: Yellow-amber (normal)\n• Appearance: Clear (normal)\n• pH: 4.5-8.0 (average 6.0)\n• Specific Gravity: 1.005-1.030\n• Protein: Negative (trace = abnormal)\n  - Proteinuria: ≥1+ on dipstick\n• Glucose: Negative\n  - Glycosuria: suggests diabetes\n• Ketones: Negative\n  - Positive: DKA, starvation\n• Blood: Negative\n  - Haematuria: UTI, stones, malignancy\n• Leucocytes: Negative\n  - Positive: UTI\n• Nitrites: Negative\n  - Positive: Gram-negative UTI\n• Bilirubin: Negative\n• Urobilinogen: Normal (0.1-1.0 Ehrlich)\n\n**Microscopy:**\n• RBCs: 0-2/hpf\n• WBCs: 0-5/hpf\n• Casts: Abnormal (hyaline, granular, RBC casts)\n• Crystals: Uric acid, calcium oxalate` },

  { id: 'L005', name: 'HIV Test', category: 'Laboratory', tags: ['hiv', 'test', 'antibody', 'viral load', 'cd4', 'rapid test'],
    content: `**HIV Testing Algorithm (Ghana):**\n\n**Rapid Tests (Determine + First Response):\n• First test: Determine HIV 1/2\n• Second test (if positive): First Response HIV 1/2\n• If both positive → HIV positive\n• If discordant → Send to confirmatory lab\n\n**Laboratory Tests:**\n• HIV Viral Load (PCR): Gold standard for monitoring\n  - Target: <1000 copies/mL (suppression)\n  - Tested at 6 months on ART, then annually\n• CD4 Count: Immune status\n  - Normal: 500-1500 cells/μL\n  - AIDS: <200 cells/μL\n• HIV DNA PCR: For infant diagnosis (<18 months)\n\n**When to Test:**\n• All patients with TB, STIs, hepatitis\n• Pregnant women (ANC)\n• Voluntary testing\n• Exposed (needle stick, sexual assault)` },

  { id: 'L006', name: 'Malaria Test', category: 'Laboratory', tags: ['malaria', 'rdt', 'blood film', 'parasite', 'thick film', 'thin film'],
    content: `**Malaria Testing:**\n\n**Rapid Diagnostic Test (RDT):**\n• Detects HRP2 (P. falciparum) and pLDH\n• Results in 15-20 minutes\n• Sensitivity: 95-99% for P. falciparum\n• Used at all levels of care in Ghana\n\n**Thick Blood Film:**\n• For parasite detection and quantification\n• Parasite density: parasites/μL\n• More sensitive than RDT\n\n**Thin Blood Film:**\n• For species identification\n• P. falciparum: banana-shaped rings, crescents\n• P. vivax: enlarged RBCs, amoeboid forms\n• P. malariae: band forms\n\n**Interpretation:**\n• Positive RDT + symptoms = treat malaria\n• In low transmission: any parasite = treat\n• In high transmission: may need quantification` },
];

// ─── HEALTH TOPICS ───────────────────────────────────────────────────────────

export const HEALTH_TOPICS: EncyclopediaEntry[] = [
  { id: 'H001', name: 'WHO Pain Ladder', category: 'Clinical Guideline', tags: ['pain', 'ladder', 'analgesia', 'who', 'morphine', 'tramadol'],
    content: `**WHO Pain Ladder (3-Step):**\n\n**Step 1 — Mild Pain (1-3/10):**\n• Paracetamol 500mg-1g QID\n• ± NSAIDs: Ibuprofen 400mg TDS\n• ± Paracetamol 1g + Codeine 30mg\n\n**Step 2 — Moderate Pain (4-6/10):**\n• Paracetamol + Codeine 30-60mg QID\n• OR Tramadol 50-100mg QID\n• ± Adjuvants\n\n**Step 3 — Severe Pain (7-10/10):**\n• Morphine sulfate — Start 5-10mg Q4H oral\n• Titrate by 50% every 24h until pain-free\n• OR Oxycodone\n• ± Adjuvants\n\n**Adjuvants:**\n• Corticosteroids (dexamethasone)\n• Anticonvulsants (gabapentin) for neuropathic\n• Antidepressants (amitriptyline) for neuropathic\n\n**Principles:**\n• By mouth, by the clock, by the ladder\n• For the individual, attention to detail\n• Duration as needed\n\n**Ghana:** Morphine available at teaching hospitals. Oral morphine solution (OMS) programme expanding.` },

  { id: 'H002', name: 'Growth Charts (WHO)', category: 'Paediatrics', tags: ['growth chart', 'z-score', 'weight', 'height', 'child', 'growth monitoring'],
    content: `**WHO Growth Standards (0-5 years):**\n\n**Indicators:**\n• Weight-for-age: Underweight\n• Length/Height-for-age: Stunting\n• Weight-for-length/height: Wasting\n• BMI-for-age\n• Head circumference-for-age\n\n**Z-Score Classification:**\n• Normal: ≥ -2 SD\n• Moderate: -2 to -3 SD\n• Severe: < -3 SD\n• Overweight: > +2 SD (weight-for-height)\n• Obese: > +3 SD (BMI-for-age)\n\n**MUAC (Mid-Upper Arm Circumference):\n• Normal: ≥12.5cm\n• MAM: 11.5-12.5cm\n• SAM: <11.5cm\n\n**Monitoring:** Every visit (under 2: monthly, 2-5: quarterly)\n\n**Ghana Context:** IMNCI protocol, Growth Monitoring and Promotion (GMP) at all CHPS compounds.` },

  { id: 'H003', name: 'WHO Surgical Safety Checklist', category: 'Clinical Guideline', tags: ['surgery', 'checklist', 'safety', 'who', 'anaesthesia', 'theatre'],
    content: `**WHO Surgical Safety Checklist (3 phases):**\n\n**1. SIGN IN (before induction):\n• Patient identity confirmed\n• Site marked (if applicable)\n• Consent verified\n• Anaesthesia safety check\n• Pulse oximeter functioning\n• Known allergies?\n• Difficult airway/ aspiration risk?\n• Risk of blood loss >500mL?\n\n**2. TIME OUT (before skin incision):\n• All team members introduced\n• Patient name, procedure, incision site confirmed\n• Antibiotic prophylaxis given (within 60 min)\n• Anticipated critical events\n• Essential imaging displayed\n\n**3. SIGN OUT (before patient leaves theatre):\n• Procedure name recorded\n• Instrument, sponge, needle counts correct\n• Specimen labelled\n• Equipment problems noted\n• Key recovery concerns\n\n**Ghana:** Implemented at Korle-Bu, KATH and regional hospitals. National rollout ongoing.` },

  { id: 'H004', name: 'Emergency Triage (ESI)', category: 'Emergency', tags: ['triage', 'emergency', 'esi', 'severity', 'priority', 'waiting'],
    content: `**Emergency Severity Index (ESI) — 5 Levels:**\n\n**ESI-1 (Resuscitation — Immediate):**\n• Requires immediate life-saving intervention\n• Cardiac arrest, respiratory failure, unresponsive\n• Examples: Code Blue, massive haemorrhage\n\n**ESI-2 (Emergent — <10 min):**\n• High risk, confused, severe pain/distress\n• Examples: Chest pain, acute abdomen, suicidal\n\n**ESI-3 (Urgent — <30 min):**\n• Stable but needs ≥2 resources\n• Examples: Abdominal pain with fever, asthma attack\n\n**ESI-4 (Less Urgent — <60 min):**\n• Stable, needs 1 resource\n• Examples: Simple fracture, UTI, laceration\n\n**ESI-5 (Non-Urgent):**\n• No resources needed, prescriptions\n• Examples: Common cold, medication refill\n\n**Ghana:** Modified triage used in all emergency departments. Colour coding: Red/Orange/Yellow/Green/Blue.` },

  { id: 'H005', name: 'Ghana National Health Insurance (NHIS)', category: 'Health System', tags: ['nhis', 'insurance', 'national health insurance', 'ghana', 'coverage', 'scheme'],
    content: `**National Health Insurance Scheme (NHIS) — Ghana:**\n\n**Established:** 2003 (NHIA Act 650)\n\n**Coverage:**\n• ~40% of population enrolled (2024)\n• Premium: GH₵ 30/year (exemptions for indigents)\n\n**Benefits Package (Core):**\n• Outpatient care\n• Inpatient care\n• Maternity care (normal delivery)\n• Surgical operations\n• Medications on NHIS formulary\n• Diagnostic tests (lab, X-ray)\n• Emergency care\n• Dental care (basic)\n• Eye care\n\n**Not Covered:**\n• Cosmetic surgery\n• Some specialty drugs (biologics)\n• Private ward charges\n• Ambulance services (being added)\n\n**Providers:** All public facilities, some private facilities, mission hospitals.\n\n**Claims:** Submitted electronically, reimbursed within 90 days.\n\n**Ghana Context:** Being reformed under NHIS Act 2024 (amendments). Digital claims processing.` },
];

// ─── GHANAIAN LANGUAGES ──────────────────────────────────────────────────────

export const GHANAIAN_TERMS: Record<string, Record<string, string>> = {
  twi: {
    'malaria': 'Asram',
    'headache': 'Entutu a ɛyɛ mu',
    'fever': 'Ahuru a ɛyɛ mu',
    'cough': 'Ahemfena',
    'diarrhoea': 'Ntwaho',
    'vomiting': 'Awerɛho',
    'pain': 'Ahuhuru',
    'medicine': 'Aduru',
    'hospital': 'Ayaresabea',
    'doctor': 'Odiprepoɔ',
    'nurse': 'Odwumayɛa',
    'blood': 'Mogya',
    'child': 'Mmabra',
    'pregnant': 'Abugyadeɛ',
    'birth': 'Nuwuwa',
    'death': 'Owu',
    'HIV': 'Sufre a ɛnni aduru',
    'diabetes': 'Dwa a ɛkɔ mu',
    'hypertension': 'Mogya a ɛsɛ so',
    'TB': 'Ahemfena a ɛrekɔ so',
    'injection': 'Nsusuwe',
    'tablet': 'Duru',
    'syrup': 'Nsafufuo',
    'water': 'Nsuo',
    'food': 'Aduane',
    'rest': 'Adawude',
  },
  ga: {
    'malaria': 'Agblema',
    'fever': 'Nɔŋ',
    'cough': 'Kpleŋ',
    'pain': 'Daa',
    'medicine': 'Da',
    'hospital': 'Gbɛmɔŋ',
    'doctor': 'Yɛlisi',
    'nurse': 'Dɔŋ',
    'blood': 'Shi',
    'child': 'Bi',
    'pregnant': 'Nɔŋtsɔ',
  },
  ewe: {
    'malaria': 'Xɔtrɔ̃',
    'fever': ' lã',
    'cough': 'Tũ',
    'pain': 'Dzu',
    'medicine': 'Yi',
    'hospital': ' lãƒe',
    'doctor': 'Lãdɔla',
    'blood': 'Gã',
    'child': 'Hã',
  },
  hausa: {
    'malaria': 'Zazzarin cizon sauro',
    'fever': 'Zazzara',
    'headache': 'Ciwon kai',
    'cough': 'Tari',
    'pain': 'Ciwon',
    'medicine': 'Magani',
    'hospital': 'Asibiti',
    'doctor': 'Likita',
    'nurse': 'Mafita',
    'blood': 'Jini',
    'child': 'Yaro/Yara',
    'pregnant': 'Cikin ciki',
  },
  dagbani: {
    'malaria': 'Bõɔrõ',
    'fever': 'Tidin',
    'cough': 'Sã',
    'pain': 'Lara',
    'medicine': 'Lã',
    'hospital': 'Taricheeli',
    'doctor': 'Tali',
  },
};

// ─── SEARCH ENGINE ───────────────────────────────────────────────────────────

export function searchEncyclopedia(query: string): EncyclopediaEntry[] {
  const q = query.toLowerCase().trim();
  const words = q.split(/\s+/);

  const allEntries = [...DISEASES, ...DRUGS, ...LAB_TESTS, ...HEALTH_TOPICS];

  const scored = allEntries.map(entry => {
    let score = 0;
    const nameLower = entry.name.toLowerCase();
    const contentLower = entry.content.toLowerCase();

    // Exact name match
    if (nameLower === q) score += 100;
    // Name starts with query
    else if (nameLower.startsWith(q)) score += 80;
    // Name contains query
    else if (nameLower.includes(q)) score += 60;

    // Tag matches
    for (const tag of entry.tags) {
      if (tag === q) score += 50;
      else if (tag.includes(q) || q.includes(tag)) score += 30;
    }

    // Word matches in tags
    for (const word of words) {
      for (const tag of entry.tags) {
        if (tag.includes(word)) score += 10;
      }
      if (contentLower.includes(word)) score += 5;
    }

    return { entry, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(s => s.entry);
}

export function getGhanaianTranslation(word: string, language: string = 'twi'): string | undefined {
  const lang = GHANAIAN_TERMS[language];
  if (!lang) return undefined;
  const q = word.toLowerCase().trim();
  for (const [key, value] of Object.entries(lang)) {
    if (key.includes(q) || q.includes(key) || value.toLowerCase().includes(q)) {
      return `${key} = ${value}`;
    }
  }
  return undefined;
}

export function formatEncyclopediaResponse(entry: EncyclopediaEntry): string {
  return `📖 **${entry.name}** (${entry.category})\n\n${entry.content}\n\n---\n🏷️ Tags: ${entry.tags.join(', ')}`;
}

export function searchDrugsOnly(query: string): EncyclopediaEntry[] {
  const q = query.toLowerCase().trim();
  return DRUGS.filter(d =>
    d.name.toLowerCase().includes(q) ||
    d.tags.some(t => t.includes(q)) ||
    d.content.toLowerCase().includes(q)
  );
}

export function searchDiseasesOnly(query: string): EncyclopediaEntry[] {
  const q = query.toLowerCase().trim();
  return DISEASES.filter(d =>
    d.name.toLowerCase().includes(q) ||
    d.tags.some(t => t.includes(q)) ||
    d.content.toLowerCase().includes(q)
  );
}
