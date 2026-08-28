// =====================================================================
// GIHM-HIS — Drug-Disease Associations
// Maps drugs to the diseases they treat with clinical guidance
// =====================================================================

export interface DrugDiseaseLinkSeed {
  drugName: string;
  diseaseName: string;
  efficacy: string; // FIRST_LINE | SECOND_LINE | ADJUNCTIVE | PALLIATIVE | PROPHYLACTIC
  dosageNote?: string;
  notes?: string;
}

export const DRUG_DISEASE_LINKS: DrugDiseaseLinkSeed[] = [
  // =================================================================
  // MALARIA TREATMENT
  // =================================================================
  { drugName: 'Artemether-Lumefantrine', diseaseName: 'Malaria', efficacy: 'FIRST_LINE', dosageNote: 'Per weight-based schedule over 3 days', notes: 'WHO-recommended ACT for uncomplicated P. falciparum. Take with fatty food.' },
  { drugName: 'Artesunate', diseaseName: 'Malaria', efficacy: 'FIRST_LINE', dosageNote: '2.4mg/kg IV at 0h, 12h, 24h, then daily', notes: 'First-line for severe/complicated malaria. Reduces mortality vs quinine.' },
  { drugName: 'Artesunate', diseaseName: 'Cerebral Malaria', efficacy: 'FIRST_LINE', dosageNote: '2.4mg/kg IV stat then q12h x24h, then daily', notes: 'IV artesunate is life-saving. Add supportive care: manage seizures, hypoglycaemia, anaemia.' },
  { drugName: 'Artemether', diseaseName: 'Malaria', efficacy: 'SECOND_LINE', dosageNote: '3.2mg/kg IM stat then 1.6mg/kg daily', notes: 'IM alternative when IV artesunate unavailable.' },
  { drugName: 'Chloroquine', diseaseName: 'Malaria', efficacy: 'SECOND_LINE', notes: 'NO LONGER first-line due to P. falciparum resistance. Used for P. vivax.' },
  { drugName: 'Quinine', diseaseName: 'Malaria', efficacy: 'SECOND_LINE', dosageNote: '600mg q8h for 7 days (oral)', notes: 'When ACT is not available. Monitor for cinchonism and hypoglycaemia.' },
  { drugName: 'Quinine (IV)', diseaseName: 'Malaria', efficacy: 'SECOND_LINE', dosageNote: '20mg/kg loading over 4h, then 10mg/kg q8h', notes: 'When IV artesunate is not available for severe malaria.' },
  { drugName: 'Primaquine', diseaseName: 'Malaria', efficacy: 'PROPHYLACTIC', dosageNote: '15mg base daily x14 days', notes: 'Anti-relapse therapy for P. vivax/P. ovale. MUST test G6PD first.' },
  { drugName: 'Sulfadoxine-Pyrimethamine', diseaseName: 'Malaria', efficacy: 'PROPHYLACTIC', dosageNote: '3 tablets as single dose (IPTp)', notes: 'Intermittent Preventive Treatment in pregnancy (IPTp). Given at ANC visits.' },
  { drugName: 'Amodiaquine', diseaseName: 'Malaria', efficacy: 'SECOND_LINE', notes: 'Used in combination (ASAQ) in some regions. Not monotherapy.' },
  { drugName: 'Doxycycline', diseaseName: 'Malaria', efficacy: 'PROPHYLACTIC', dosageNote: '100mg once daily (start 1-2 days before, continue 4 weeks after)', notes: 'Chemoprophylaxis for travellers. Not for children <8 or pregnant women.' },

  // =================================================================
  // HIV/AIDS TREATMENT
  // =================================================================
  { drugName: 'Tenofovir + Lamivudine + Efavirenz', diseaseName: 'HIV/AIDS', efficacy: 'FIRST_LINE', dosageNote: '1 tablet once daily', notes: 'Previous first-line ART. Being replaced by TLD in most settings.' },
  { drugName: 'Tenofovir + Lamivudine + Dolutegravir', diseaseName: 'HIV/AIDS', efficacy: 'FIRST_LINE', dosageNote: '1 tablet once daily', notes: 'PREFERRED first-line ART (WHO 2021). Better suppression, fewer side effects.' },
  { drugName: 'Zidovudine + Lamivudine', diseaseName: 'HIV/AIDS', efficacy: 'SECOND_LINE', dosageNote: '1 tablet q12h', notes: 'NRTI backbone for second-line ART or PMTCT.' },
  { drugName: 'Lopinavir-Ritonavir', diseaseName: 'HIV/AIDS', efficacy: 'SECOND_LINE', dosageNote: '2 tablets q12h', notes: 'PI-based regimen for second-line ART.' },
  { drugName: 'Abacavir + Lamivudine', diseaseName: 'HIV/AIDS', efficacy: 'SECOND_LINE', dosageNote: '1 tablet once daily', notes: 'When TDF cannot be used (renal impairment). Requires HLA-B*5701 testing if available.' },
  { drugName: 'Nevirapine', diseaseName: 'HIV/AIDS', efficacy: 'ADJUNCTIVE', notes: 'For PMTCT — single dose to mother and baby.' },
  { drugName: 'Cotrimoxazole', diseaseName: 'HIV/AIDS', efficacy: 'PROPHYLACTIC', dosageNote: '480mg once daily (or 960mg 3x/week)', notes: 'PCP prophylaxis and broad infection prevention in HIV+ individuals. WHO-recommended.' },

  // =================================================================
  // TB TREATMENT
  // =================================================================
  { drugName: 'Isoniazid', diseaseName: 'Tuberculosis', efficacy: 'FIRST_LINE', notes: 'Part of RHZE intensive phase and RH continuation phase. Hepatotoxic — monitor LFTs.' },
  { drugName: 'Rifampicin', diseaseName: 'Tuberculosis', efficacy: 'FIRST_LINE', notes: 'Potent CYP inducer — interacts with many drugs including ART, OCPs, anticoagulants.' },
  { drugName: 'Pyrazinamide', diseaseName: 'Tuberculosis', efficacy: 'FIRST_LINE', notes: 'Intensive phase only. Hepatotoxic and hyperuricaemic.' },
  { drugName: 'Ethambutol', diseaseName: 'Tuberculosis', efficacy: 'FIRST_LINE', notes: 'Intensive phase. Optic neuritis — visual acuity monitoring needed.' },

  // =================================================================
  // BACTERIAL INFECTIONS
  // =================================================================
  { drugName: 'Amoxicillin', diseaseName: 'Acute Respiratory Infection', efficacy: 'FIRST_LINE', dosageNote: '500mg q8h for 5-7 days', notes: 'First-line for community-acquired pneumonia, pharyngitis, otitis media.' },
  { drugName: 'Amoxicillin-Clavulanate', diseaseName: 'Acute Respiratory Infection', efficacy: 'FIRST_LINE', dosageNote: '625mg q8h for 5-7 days', notes: 'When beta-lactamase producing organisms suspected.' },
  { drugName: 'Azithromycin', diseaseName: 'Acute Respiratory Infection', efficacy: 'FIRST_LINE', dosageNote: '500mg day 1, then 250mg days 2-5', notes: 'Atypical coverage. Short course. Also first-line for trachoma.' },
  { drugName: 'Ceftriaxone', diseaseName: 'Meningitis', efficacy: 'FIRST_LINE', dosageNote: '2g IV q12h (adults)', notes: 'Third-generation cephalosporin for bacterial meningitis. Also covers N. meningitidis.' },
  { drugName: 'Amoxicillin', diseaseName: 'Pneumonia (Childhood)', efficacy: 'FIRST_LINE', dosageNote: '25mg/kg q8h for 5-7 days', notes: 'WHO IMCI protocol. First-line for non-severe pneumonia in children.' },
  { drugName: 'Amoxicillin', diseaseName: 'Meningitis', efficacy: 'SECOND_LINE', dosageNote: 'High dose PO after initial IV therapy', notes: 'Step-down therapy for meningitis.' },

  // =================================================================
  // DIARRHOEAL DISEASES
  // =================================================================
  { drugName: 'Oral Rehydration Salts', diseaseName: 'Cholera', efficacy: 'FIRST_LINE', dosageNote: 'Aggressive ORS — ad libitum', notes: 'Cornerstone of cholera treatment. IV fluids for severe dehydration.' },
  { drugName: 'Oral Rehydration Salts', diseaseName: 'Acute Diarrhoeal Disease', efficacy: 'FIRST_LINE', dosageNote: 'After each loose stool', notes: 'Low-osmolarity ORS. Zinc supplementation for children.' },
  { drugName: 'Doxycycline', diseaseName: 'Cholera', efficacy: 'FIRST_LINE', dosageNote: '300mg single dose (adults)', notes: 'Antibiotic to reduce duration and volume of diarrhoea in severe cholera.' },
  { drugName: 'Azithromycin', diseaseName: 'Cholera', efficacy: 'FIRST_LINE', dosageNote: '1g single dose (adults); 20mg/kg (children)', notes: 'Alternative antibiotic for cholera, especially in children and pregnant women.' },
  { drugName: 'Zinc Sulfate', diseaseName: 'Acute Diarrhoeal Disease', efficacy: 'ADJUNCTIVE', dosageNote: '10-20mg/day for 10-14 days', notes: 'Reduces duration and severity. Essential adjunct to ORS in children.' },
  { drugName: 'Metronidazole', diseaseName: 'Acute Diarrhoeal Disease', efficacy: 'SECOND_LINE', dosageNote: 'For amoebic dysentery: 400mg q8h x5-7 days', notes: 'Only for confirmed amoebic or Giardia infections. NOT for routine watery diarrhoea.' },
  { drugName: 'Loperamide', diseaseName: 'Acute Diarrhoeal Disease', efficacy: 'PALLIATIVE', notes: 'Symptomatic relief in adults only. Do NOT use in bloody diarrhoea or children <6.' },

  // =================================================================
  // HEPATITIS
  // =================================================================
  { drugName: 'Tenofovir + Lamivudine + Dolutegravir', diseaseName: 'Hepatitis B', efficacy: 'FIRST_LINE', notes: 'TDF component is first-line for chronic hepatitis B. Can be used as dual therapy (TDF + 3TC or TDF + DTG).' },
  { drugName: 'Tenofovir + Lamivudine + Efavirenz', diseaseName: 'Hepatitis B', efficacy: 'FIRST_LINE', notes: 'TDF component effective against HBV. Used when co-infected with HIV.' },

  // =================================================================
  // PARASITIC INFECTIONS
  // =================================================================
  { drugName: 'Praziquantel', diseaseName: 'Schistosomiasis (Bilharzia)', efficacy: 'FIRST_LINE', dosageNote: '40mg/kg single dose', notes: 'Drug of choice. WHO preventive chemotherapy in school-age children.' },
  { drugName: 'Albendazole', diseaseName: 'Intestinal Parasitic Infections', efficacy: 'FIRST_LINE', dosageNote: '400mg single dose (adults)', notes: 'Broad-spectrum anthelmintic for soil-transmitted helminths.' },
  { drugName: 'Mebendazole', diseaseName: 'Intestinal Parasitic Infections', efficacy: 'FIRST_LINE', dosageNote: '500mg single dose or 100mg q12h x3 days', notes: 'Alternative to albendazole. Effective against roundworm, hookworm, whipworm.' },
  { drugName: 'Ivermectin', diseaseName: 'Onchocerciasis (River Blindness)', efficacy: 'FIRST_LINE', dosageNote: '150mcg/kg single dose annually', notes: 'Mectizan Donation Programme. Annual MDA in endemic communities.' },
  { drugName: 'Ivermectin', diseaseName: 'Lymphatic Filariasis', efficacy: 'FIRST_LINE', dosageNote: '150mcg/kg + Albendazole 400mg', notes: 'Part of MDA for lymphatic filariasis elimination.' },
  { drugName: 'Diethylcarbamazine', diseaseName: 'Lymphatic Filariasis', efficacy: 'FIRST_LINE', dosageNote: '6mg/kg/day x12 days', notes: 'DEC for individual treatment. Also in MDA (DEC + Albendazole).' },
  { drugName: 'Albendazole', diseaseName: 'Lymphatic Filariasis', efficacy: 'FIRST_LINE', dosageNote: '400mg single dose (MDA)', notes: 'Part of MDA with ivermectin or DEC.' },
  { drugName: 'Metronidazole', diseaseName: 'Intestinal Parasitic Infections', efficacy: 'FIRST_LINE', dosageNote: '400mg q8h x5-7 days', notes: 'For amoebiasis and giardiasis.' },
  { drugName: 'Niclosamide', diseaseName: 'Intestinal Parasitic Infections', efficacy: 'FIRST_LINE', dosageNote: '2g single dose', notes: 'For tapeworm infections. Chew tablets before swallowing.' },

  // =================================================================
  // SEXUALLY TRANSMITTED INFECTIONS
  // =================================================================
  { drugName: 'Azithromycin', diseaseName: 'Gonorrhoea', efficacy: 'FIRST_LINE', dosageNote: '2g single dose PO (or 500mg IM + 1g PO)', notes: 'Dual therapy with ceftriaxone preferred in areas with high resistance.' },
  { drugName: 'Ceftriaxone', diseaseName: 'Gonorrhoea', efficacy: 'FIRST_LINE', dosageNote: '500mg IM single dose', notes: 'Combined with azithromycin for dual therapy.' },
  { drugName: 'Benzathine Penicillin', diseaseName: 'Syphilis', efficacy: 'FIRST_LINE', notes: '2.4 million units IM single dose for primary/secondary syphilis.' },
  { drugName: 'Doxycycline', diseaseName: 'Sexually Transmitted Infections (General)', efficacy: 'FIRST_LINE', dosageNote: '100mg q12h x7 days', notes: 'For chlamydia and as alternative for gonorrhoea.' },

  // =================================================================
  // PAIN MANAGEMENT (WHO Pain Ladder)
  // =================================================================
  { drugName: 'Paracetamol', diseaseName: 'Acute Respiratory Infection', efficacy: 'ADJUNCTIVE', dosageNote: '500mg-1g q6h', notes: 'For fever and pain management.' },
  { drugName: 'Ibuprofen', diseaseName: 'Acute Respiratory Infection', efficacy: 'ADJUNCTIVE', dosageNote: '400mg q8h with food', notes: 'Anti-inflammatory and antipyretic. Use with caution.' },
  { drugName: 'Paracetamol', diseaseName: 'Malaria', efficacy: 'ADJUNCTIVE', dosageNote: '500mg-1g q6h as needed', notes: 'For fever and body aches. Not a substitute for antimalarials.' },
  { drugName: 'Ibuprofen', diseaseName: 'Malaria', efficacy: 'ADJUNCTIVE', dosageNote: '400mg q8h', notes: 'For fever and pain. Avoid in severe malaria (renal risk).' },
  { drugName: 'Paracetamol', diseaseName: 'Measles', efficacy: 'ADJUNCTIVE', dosageNote: '10-15mg/kg q4-6h', notes: 'For fever. Vitamin A is essential adjunct.' },
  { drugName: 'Vitamin A', diseaseName: 'Measles', efficacy: 'ADJUNCTIVE', dosageNote: '200,000 IU single dose (>1 year)', notes: 'Reduces measles mortality by 50%. ESSENTIAL in all measles cases.' },
  { drugName: 'Paracetamol', diseaseName: 'Pre-eclampsia/Eclampsia', efficacy: 'ADJUNCTIVE', notes: 'Safe analgesic in pregnancy for headache.' },

  // =================================================================
  // CARDIOVASCULAR
  // =================================================================
  { drugName: 'Amlodipine', diseaseName: 'Hypertension', efficacy: 'FIRST_LINE', dosageNote: '5-10mg once daily', notes: 'First-line antihypertensive. Well tolerated, once-daily.' },
  { drugName: 'Enalapril', diseaseName: 'Hypertension', efficacy: 'FIRST_LINE', dosageNote: '5-20mg once daily', notes: 'ACE inhibitor. Avoid in pregnancy. Monitor K+ and creatinine.' },
  { drugName: 'Hydrochlorothiazide', diseaseName: 'Hypertension', efficacy: 'FIRST_LINE', dosageNote: '12.5-25mg once daily', notes: 'Thiazide diuretic. Good add-on therapy.' },
  { drugName: 'Atenolol', diseaseName: 'Hypertension', efficacy: 'FIRST_LINE', dosageNote: '50-100mg once daily', notes: 'Beta-blocker. Not preferred first-line but useful in young patients.' },
  { drugName: 'Losartan', diseaseName: 'Hypertension', efficacy: 'SECOND_LINE', dosageNote: '50-100mg once daily', notes: 'ARB when ACE inhibitors not tolerated (no cough). Avoid in pregnancy.' },
  { drugName: 'Enalapril', diseaseName: 'Heart Failure', efficacy: 'FIRST_LINE', dosageNote: 'Start 2.5mg, titrate to 20mg', notes: 'ACE inhibitor — cornerstone of HF therapy. Reduce mortality.' },
  { drugName: 'Furosemide', diseaseName: 'Heart Failure', efficacy: 'ADJUNCTIVE', dosageNote: '40-80mg once daily', notes: 'Loop diuretic for fluid overload symptoms.' },
  { drugName: 'Digoxin', diseaseName: 'Heart Failure', efficacy: 'ADJUNCTIVE', dosageNote: '62.5-250mcg once daily', notes: 'Add-on for symptom control. Does not reduce mortality.' },
  { drugName: 'Amlodipine', diseaseName: 'Stroke', efficacy: 'PROPHYLACTIC', notes: 'Blood pressure control for secondary stroke prevention.' },
  { drugName: 'Atorvastatin', diseaseName: 'Stroke', efficacy: 'PROPHYLACTIC', dosageNote: '20-40mg once daily', notes: 'For secondary prevention of ischaemic stroke.' },
  { drugName: 'Furosemide', diseaseName: 'Pre-eclampsia/Eclampsia', efficacy: 'ADJUNCTIVE', notes: 'For pulmonary oedema in severe pre-eclampsia.' },
  { drugName: 'Magnesium Sulfate', diseaseName: 'Pre-eclampsia/Eclampsia', efficacy: 'FIRST_LINE', dosageNote: '4-6g IV loading, then 1-2g/h', notes: 'LIFE-SAVING for eclampsia. Reduces seizure recurrence. Monitor reflexes and respiratory rate.' },
  { drugName: 'Hydralazine', diseaseName: 'Pre-eclampsia/Eclampsia', efficacy: 'SECOND_LINE', notes: 'IV hydralazine for severe hypertension in pregnancy.' },

  // =================================================================
  // DIABETES
  // =================================================================
  { drugName: 'Metformin', diseaseName: 'Type 2 Diabetes Mellitus', efficacy: 'FIRST_LINE', dosageNote: '500-1000mg q12h with meals', notes: 'First-line for T2DM. Weight-neutral. Monitor renal function.' },
  { drugName: 'Glibenclamide', diseaseName: 'Type 2 Diabetes Mellitus', efficacy: 'SECOND_LINE', dosageNote: '2.5-5mg once daily', notes: 'Add-on or alternative when metformin not tolerated. Risk of hypoglycaemia.' },
  { drugName: 'Insulin (Regular)', diseaseName: 'Type 2 Diabetes Mellitus', efficacy: 'SECOND_LINE', notes: 'When oral agents insufficient. Also for emergency hyperglycaemia.' },

  // =================================================================
  // OBSTETRIC EMERGENCIES
  // =================================================================
  { drugName: 'Oxytocin', diseaseName: 'Postpartum Haemorrhage', efficacy: 'FIRST_LINE', dosageNote: '5-10 IU IM after delivery; 10-40 IU IV infusion for PPH', notes: 'ESSENTIAL uterotonic. Keep cold chain.' },
  { drugName: 'Misoprostol', diseaseName: 'Postpartum Haemorrhage', efficacy: 'FIRST_LINE', dosageNote: '600-800mcg sublingual', notes: 'WHO-recommended. Heat-stable alternative to oxytocin. Can be given by CHWs.' },
  { drugName: 'Oxytocin', diseaseName: 'Obstructed Labour', efficacy: 'ADJUNCTIVE', notes: 'Augmentation after obstruction relieved. Not before obstruction is resolved.' },
  { drugName: 'Betamethasone', diseaseName: 'Obstructed Labour', efficacy: 'ADJUNCTIVE', dosageNote: '12mg IM x2 doses 24h apart', notes: 'Antenatal corticosteroid for fetal lung maturation before preterm delivery.' },
  { drugName: 'Cotrimoxazole', diseaseName: 'HIV/AIDS', efficacy: 'PROPHYLACTIC', dosageNote: '480mg once daily', notes: 'PCP prophylaxis. Also protects against other opportunistic infections. Start at CD4 <200.' },

  // =================================================================
  // SKIN INFECTIONS
  // =================================================================
  { drugName: 'Permethrin', diseaseName: 'Scabies', efficacy: 'FIRST_LINE', dosageNote: '5% cream — whole body, 8-12h, wash off', notes: 'Apply to entire body. Repeat in 7-14 days. Treat household contacts.' },
  { drugName: 'Benzyl Benzoate', diseaseName: 'Scabies', efficacy: 'SECOND_LINE', notes: 'Alternative to permethrin. Apply to whole body, repeat in 24h.' },
  { drugName: 'Ivermectin', diseaseName: 'Scabies', efficacy: 'SECOND_LINE', dosageNote: '200mcg/kg single dose, repeat in 2 weeks', notes: 'For crusted scabies or mass treatment in outbreaks.' },
  { drugName: 'Mupirocin', diseaseName: 'Acute Respiratory Infection', efficacy: 'ADJUNCTIVE', notes: 'Topical for impetigo and secondary skin infections.' },
  { drugName: 'Cotrimoxazole', diseaseName: 'Leprosy', efficacy: 'ADJUNCTIVE', notes: 'For prophylaxis in contacts (EBA — emerging bacteria approach).' },

  // =================================================================
  // ANTIMICROBIALS FOR SPECIFIC INFECTIONS
  // =================================================================
  { drugName: 'Metronidazole', diseaseName: 'Intestinal Parasitic Infections', efficacy: 'FIRST_LINE', dosageNote: '400mg q8h for 5-7 days', notes: 'For amoebiasis and giardiasis.' },
  { drugName: 'Tinidazole', diseaseName: 'Intestinal Parasitic Infections', efficacy: 'FIRST_LINE', dosageNote: '2g single dose', notes: 'Alternative to metronidazole. Longer half-life.' },
  { drugName: 'Ciprofloxacin', diseaseName: 'Urinary Tract Infection', efficacy: 'FIRST_LINE', dosageNote: '250-500mg q12h for 3-7 days', notes: 'Fluoroquinolone for complicated UTI. Reserve for resistant infections.' },
  { drugName: 'Nitrofurantoin', diseaseName: 'Urinary Tract Infection', efficacy: 'FIRST_LINE', dosageNote: '100mg q12h for 7 days', notes: 'First-line for uncomplicated UTI. Concentrated in urine.' },
  { drugName: 'Amoxicillin', diseaseName: 'Urinary Tract Infection', efficacy: 'SECOND_LINE', notes: 'If sensitivity confirms. Not first-line empirically.' },
  { drugName: 'Fluconazole', diseaseName: 'HIV/AIDS', efficacy: 'ADJUNCTIVE', dosageNote: '200mg/day for 2 weeks (cryptococcal meningitis)', notes: 'Essential for cryptococcal meningitis induction and maintenance.' },

  // =================================================================
  // RESPIRATORY
  // =================================================================
  { drugName: 'Salbutamol (Inhaler)', diseaseName: 'Asthma', efficacy: 'FIRST_LINE', dosageNote: '1-2 puffs q4-6h as needed', notes: 'SABA — rescue/reliever inhaler. Always carry.' },
  { drugName: 'Beclometasone (Inhaler)', diseaseName: 'Asthma', efficacy: 'FIRST_LINE', dosageNote: '200-400mcg/day', notes: 'Inhaled corticosteroid — preventer. Rinse mouth after use.' },
  { drugName: 'Prednisolone', diseaseName: 'Asthma', efficacy: 'SECOND_LINE', dosageNote: '40-50mg for 5-7 days', notes: 'Oral corticosteroid for acute exacerbations not responding to SABA.' },
  { drugName: 'Prednisolone', diseaseName: 'Chronic Obstructive Pulmonary Disease', efficacy: 'ADJUNCTIVE', notes: 'Short course for acute exacerbations.' },
  { drugName: 'Salbutamol (Inhaler)', diseaseName: 'Chronic Obstructive Pulmonary Disease', efficacy: 'FIRST_LINE', notes: 'SABA for bronchodilation.' },

  // =================================================================
  // PAIN AND NEUROLOGICAL
  // =================================================================
  { drugName: 'Tramadol', diseaseName: 'Snakebite Envenomation', efficacy: 'ADJUNCTIVE', notes: 'For pain management after antivenom.' },
  { drugName: 'Morphine', diseaseName: 'Snakebite Envenomation', efficacy: 'ADJUNCTIVE', notes: 'For severe pain not relieved by tramadol.' },
  { drugName: 'Diazepam', diseaseName: 'Epilepsy', efficacy: 'SECOND_LINE', dosageNote: '10-20mg rectal for convulsive status', notes: 'Emergency treatment for status epilepticus.' },
  { drugName: 'Lorazepam', diseaseName: 'Epilepsy', efficacy: 'FIRST_LINE', dosageNote: '4mg IV for status epilepticus', notes: 'First-line IV for established status epilepticus.' },
  { drugName: 'Carbamazepine', diseaseName: 'Epilepsy', efficacy: 'FIRST_LINE', dosageNote: '200mg q12h, titrate', notes: 'First-line for partial and tonic-clonic seizures.' },
  { drugName: 'Phenytoin', diseaseName: 'Epilepsy', efficacy: 'FIRST_LINE', dosageNote: '100mg q8h', notes: 'For partial and generalised seizures. Narrow therapeutic index.' },
  { drugName: 'Valproic Acid', diseaseName: 'Epilepsy', efficacy: 'FIRST_LINE', dosageNote: '200-500mg q12h', notes: 'Broad-spectrum. HIGH TERATOGENICITY.' },
  { drugName: 'Haloperidol', diseaseName: 'Schizophrenia', efficacy: 'FIRST_LINE', dosageNote: '2-10mg q8h', notes: 'Typical antipsychotic. Monitor for EPS.' },
  { drugName: 'Chlorpromazine', diseaseName: 'Schizophrenia', efficacy: 'FIRST_LINE', dosageNote: '25-100mg q8h', notes: 'Typical antipsychotic. More sedation and hypotension.' },
  { drugName: 'Amitriptyline', diseaseName: 'Depression', efficacy: 'FIRST_LINE', dosageNote: '25mg at bedtime, titrate', notes: 'TCA for depression. Start low, go slow.' },

  // =================================================================
  // EYE INFECTIONS
  // =================================================================
  { drugName: 'Gentamicin (Eye)', diseaseName: 'Acute Respiratory Infection', efficacy: 'ADJUNCTIVE', notes: 'For bacterial conjunctivitis associated with respiratory infections.' },
  { drugName: 'Tetracycline (Eye)', diseaseName: 'Trachoma', efficacy: 'FIRST_LINE', notes: 'WHO SAFE strategy: Surgery, Antibiotics, Facial cleanliness, Environmental improvement.' },

  // =================================================================
  // RABIES
  // =================================================================
  { drugName: 'Rabies Vaccine', diseaseName: 'Rabies', efficacy: 'FIRST_LINE', notes: 'Post-exposure prophylaxis (PEP): 4 doses on days 0, 3, 7, 14. WHO 2-1-1 schedule also acceptable.' },
  { drugName: 'Rabies Immunoglobulin', diseaseName: 'Rabies', efficacy: 'ADJUNCTIVE', notes: 'Around the wound site. For category III exposures.' },

  // =================================================================
  // DENGUE
  // =================================================================
  { drugName: 'Paracetamol', diseaseName: 'Dengue Fever', efficacy: 'ADJUNCTIVE', notes: 'For fever and pain. Do NOT use NSAIDs (bleeding risk).' },
  { drugName: 'Oral Rehydration Salts', diseaseName: 'Dengue Fever', efficacy: 'ADJUNCTIVE', notes: 'For hydration. IV fluids for dengue haemorrhagic fever.' },

  // =================================================================
  // VACCINES (Prevention)
  // =================================================================
  { drugName: 'Yellow Fever Vaccine', diseaseName: 'Yellow Fever', efficacy: 'PROPHYLACTIC', notes: 'Single dose provides lifelong immunity. Required for international travel.' },
  { drugName: 'Hepatitis B Vaccine', diseaseName: 'Hepatitis B', efficacy: 'PROPHYLACTIC', notes: '3-dose schedule: 0, 1, 6 months. Part of Ghana EPI.' },
  { drugName: 'Rubella Vaccine', diseaseName: 'Rubella', efficacy: 'PROPHYLACTIC', notes: 'MMR vaccine — 2 doses. Part of Ghana EPI.' },
  { drugName: 'Typhoid Vaccine', diseaseName: 'Typhoid Fever', efficacy: 'PROPHYLACTIC', notes: 'Vi capsular polysaccharide vaccine. Single dose, booster every 3 years.' },

  // =================================================================
  // MENTAL HEALTH
  // =================================================================
  { drugName: 'Diazepam', diseaseName: 'Depression', efficacy: 'ADJUNCTIVE', notes: 'Short-term for anxiety co-morbid with depression. Not first-line.' },
  { drugName: 'Diazepam', diseaseName: 'Epilepsy', efficacy: 'SECOND_LINE', notes: 'Emergency treatment for status epilepticus (rectal in children).' },
  { drugName: 'Paraldehyde', diseaseName: 'Epilepsy', efficacy: 'SECOND_LINE', notes: 'For refractory seizures when benzodiazepines unavailable.' },

  // =================================================================
  // ADDITIONAL TREATMENT LINKS FOR NEW DRUGS
  // =================================================================
  { drugName: 'Benzathine Penicillin', diseaseName: 'Syphilis', efficacy: 'FIRST_LINE', dosageNote: '2.4MU IM single dose', notes: 'Drug of choice for all stages of syphilis.' },
  { drugName: 'Benzathine Penicillin', diseaseName: 'Syphilis', efficacy: 'PROPHYLACTIC', dosageNote: '1.2MU IM every 3 weeks x3 doses', notes: 'For neurosyphilis prevention.' },
  { drugName: 'Penicillin G', diseaseName: 'Meningitis', efficacy: 'FIRST_LINE', dosageNote: '4MU IV q4h', notes: 'For pneumococcal meningitis.' },
  { drugName: 'Penicillin G', diseaseName: 'Syphilis', efficacy: 'FIRST_LINE', dosageNote: '18-24MU IV daily x10-14 days', notes: 'For neurosyphilis.' },
  { drugName: 'Metronidazole (IV)', diseaseName: 'Cholera', efficacy: 'SECOND_LINE', dosageNote: '500mg IV q8h', notes: 'IV for severe infections when oral not possible.' },
  { drugName: 'Vancomycin', diseaseName: 'Tuberculosis', efficacy: 'SECOND_LINE', notes: 'For multi-drug resistant TB.' },
  { drugName: 'Cefixime', diseaseName: 'Gonorrhoea', efficacy: 'FIRST_LINE', dosageNote: '400mg single dose', notes: 'Oral third-gen cephalosporin for gonorrhoea.' },
  { drugName: 'Linezolid', diseaseName: 'Tuberculosis', efficacy: 'SECOND_LINE', notes: 'For drug-resistant TB.' },
  { drugName: 'Meropenem', diseaseName: 'Meningitis', efficacy: 'SECOND_LINE', dosageNote: '2g IV q8h', notes: 'For multi-drug resistant organisms.' },
  { drugName: 'Hydralazine', diseaseName: 'Pre-eclampsia/Eclampsia', efficacy: 'SECOND_LINE', dosageNote: '5mg IV q15-20min', notes: 'IV for severe hypertension in pregnancy.' },
  { drugName: 'Nifedipine', diseaseName: 'Pre-eclampsia/Eclampsia', efficacy: 'SECOND_LINE', dosageNote: '10mg oral stat', notes: 'Sublingual for severe hypertension in pregnancy.' },
  { drugName: 'Metoprolol', diseaseName: 'Hypertension', efficacy: 'FIRST_LINE', dosageNote: '50-200mg/day', notes: 'Beta-blocker for hypertension.' },
  { drugName: 'Metoprolol', diseaseName: 'Heart Failure', efficacy: 'FIRST_LINE', dosageNote: '25mg daily, titrate', notes: 'Reduces mortality in HFrEF.' },
  { drugName: 'Levothyroxine', diseaseName: 'Hypertension', efficacy: 'ADJUNCTIVE', notes: 'Treat hypothyroidism which may worsen hypertension.' },
  { drugName: 'Tranexamic Acid', diseaseName: 'Postpartum Haemorrhage', efficacy: 'FIRST_LINE', dosageNote: '1g IV over 10min', notes: 'WHO recommendation for PPH treatment.' },
  { drugName: 'Tranexamic Acid', diseaseName: 'Snakebite Envenomation', efficacy: 'ADJUNCTIVE', notes: 'For coagulopathy management.' },
  { drugName: 'Vitamin K', diseaseName: 'Postpartum Haemorrhage', efficacy: 'ADJUNCTIVE', notes: 'For coagulopathy-related PPH.' },
  { drugName: 'Adenosine', diseaseName: 'Heart Failure', efficacy: 'ADJUNCTIVE', notes: 'For SVT in heart failure patients.' },
  { drugName: 'Amiodarone', diseaseName: 'Heart Failure', efficacy: 'SECOND_LINE', dosageNote: '300mg IV for arrest; 150mg for VT', notes: 'For ventricular arrhythmias in HF.' },
  { drugName: 'Naloxone', diseaseName: 'Epilepsy', efficacy: 'ADJUNCTIVE', notes: 'For opioid-induced respiratory depression mimicking seizures.' },
  { drugName: 'Flumazenil', diseaseName: 'Epilepsy', efficacy: 'ADJUNCTIVE', notes: 'For benzodiazepine-induced respiratory depression.' },
  { drugName: 'Dexamethasone (IV)', diseaseName: 'Meningitis', efficacy: 'ADJUNCTIVE', dosageNote: '0.15mg/kg q6h x4 days', notes: 'Reduces mortality and hearing loss in bacterial meningitis. Give before or with first antibiotic dose.' },
  { drugName: 'Dexamethasone (IV)', diseaseName: 'Cerebral Malaria', efficacy: 'ADJUNCTIVE', dosageNote: 'Variable', notes: 'Controversial — may reduce mortality in African children.' },
  { drugName: 'Acetylcysteine', diseaseName: 'Postpartum Haemorrhage', efficacy: 'ADJUNCTIVE', notes: 'N-acetylcysteine may reduce oxidative stress in PPH.' },
  { drugName: 'Tranexamic Acid', diseaseName: 'Malaria', efficacy: 'ADJUNCTIVE', notes: 'For bleeding complications in severe malaria.' },
  { drugName: 'Acetylcysteine', diseaseName: 'Hepatitis B', efficacy: 'ADJUNCTIVE', notes: 'For paracetamol-induced liver injury in HBV patients.' },
  { drugName: 'Levothyroxine', diseaseName: 'Depression', efficacy: 'ADJUNCTIVE', notes: 'For hypothyroidism-related depression.' },
  { drugName: 'Ketamine', diseaseName: 'Depression', efficacy: 'SECOND_LINE', notes: 'Emerging evidence for treatment-resistant depression.' },
  { drugName: 'Dexamethasone (IV)', diseaseName: 'Acute Respiratory Infection', efficacy: 'ADJUNCTIVE', dosageNote: '6-8mg q6h', notes: 'For severe croup in children.' },
  { drugName: 'Methylprednisolone', diseaseName: 'Acute Respiratory Infection', efficacy: 'ADJUNCTIVE', dosageNote: '1-2mg/kg/day', notes: 'For severe asthma exacerbations and COPD.' },
  { drugName: 'Doxorubicin', diseaseName: 'Cancer (Breast)', efficacy: 'FIRST_LINE', notes: 'Part of AC or FEC chemotherapy regimen.' },
  { drugName: 'Cyclophosphamide', diseaseName: 'Cancer (Breast)', efficacy: 'FIRST_LINE', notes: 'Part of AC chemotherapy regimen.' },
  { drugName: 'Cyclophosphamide', diseaseName: 'Cancer (Cervical)', efficacy: 'SECOND_LINE', notes: 'Part of cisplatin-based regimens.' },
  { drugName: 'Vincristine', diseaseName: 'Cancer (Cervical)', efficacy: 'SECOND_LINE', notes: 'Part of combination chemotherapy.' },
  { drugName: 'Methotrexate', diseaseName: 'Cancer (Breast)', efficacy: 'FIRST_LINE', notes: 'Part of CMF regimen.' },
  { drugName: 'Methotrexate', diseaseName: 'Cancer (Cervical)', efficacy: 'SECOND_LINE', notes: 'For persistent/recurrent disease.' },
  { drugName: 'Azathioprine', diseaseName: 'Depression', efficacy: 'ADJUNCTIVE', notes: 'For autoimmune conditions with depressive symptoms.' },
  { drugName: 'Carbimazole', diseaseName: 'Depression', efficacy: 'ADJUNCTIVE', notes: 'Treat hyperthyroidism which may present with anxiety.' },
  { drugName: 'Tacrolimus', diseaseName: 'Hepatitis B', efficacy: 'ADJUNCTIVE', notes: 'For HBV recurrence post-liver transplant.' },
  { drugName: 'Mycophenolate', diseaseName: 'Hepatitis B', efficacy: 'ADJUNCTIVE', notes: 'For HBV recurrence post-transplant.' },
];
