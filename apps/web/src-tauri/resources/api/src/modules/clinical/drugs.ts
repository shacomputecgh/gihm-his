import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { PrismaClient } from '@prisma/client';

export function registerDrugRoutes(app: FastifyInstance, db: PrismaClient, guards: any) {
  // ================================================================
  // DRUG ROUTES
  // ================================================================

  // GET /drugs — List all drugs with optional filters
  app.get('/drugs', async (req: FastifyRequest, reply: FastifyReply) => {
    const { category, search, whoEssential, ghanaEssential, page = '1', pageSize = '50' } = req.query as Record<string, string>;
    const take = Math.min(Number(pageSize), 200);
    const skip = (Number(page) - 1) * take;
    const where: any = {};
    if (category) where.category = category;
    if (whoEssential === 'true') where.whoEssential = true;
    if (ghanaEssential === 'true') where.ghanaEssential = true;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { genericName: { contains: search } },
        { brandNames: { contains: search } },
        { description: { contains: search } },
      ];
    }
    const [items, total] = await Promise.all([
      db.drug.findMany({ where, orderBy: { name: 'asc' }, skip, take }),
      db.drug.count({ where }),
    ]);
    return { items, total, page: Number(page), pageSize: take };
  });

  // GET /drugs/:id — Get drug details with disease links
  app.get('/drugs/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const drug = await db.drug.findUnique({
      where: { id },
      include: {
        diseaseLinks: {
          include: { disease: true },
          orderBy: { disease: { name: 'asc' } },
        },
      },
    });
    if (!drug) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Drug not found' } });
    return drug;
  });

  // GET /drugs/categories/list — List all drug categories with counts
  app.get('/drugs/categories/list', async () => {
    const categories = await db.drug.groupBy({
      by: ['category'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });
    return categories.map((c) => ({ category: c.category, count: c._count.id }));
  });

  // GET /drugs/who-essential — WHO Essential Medicines
  app.get('/drugs/who-essential', async (req: FastifyRequest) => {
    const { page = '1', pageSize = '50' } = req.query as Record<string, string>;
    const take = Math.min(Number(pageSize), 200);
    const skip = (Number(page) - 1) * take;
    const [items, total] = await Promise.all([
      db.drug.findMany({ where: { whoEssential: true }, orderBy: { name: 'asc' }, skip, take }),
      db.drug.count({ where: { whoEssential: true } }),
    ]);
    return { items, total, page: Number(page), pageSize: take };
  });

  // ================================================================
  // DISEASE ROUTES
  // ================================================================

  // GET /diseases — List all diseases with optional filters
  app.get('/diseases', async (req: FastifyRequest) => {
    const { category, search, endemicToGhana, type, page = '1', pageSize = '50' } = req.query as Record<string, string>;
    const take = Math.min(Number(pageSize), 200);
    const skip = (Number(page) - 1) * take;
    const where: any = {};
    if (category) where.category = category;
    if (type) where.type = type;
    if (endemicToGhana === 'true') where.endemicToGhana = true;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { icdCode: { contains: search } },
        { symptoms: { contains: search } },
      ];
    }
    const [items, total] = await Promise.all([
      db.disease.findMany({ where, orderBy: { name: 'asc' }, skip, take }),
      db.disease.count({ where }),
    ]);
    return { items, total, page: Number(page), pageSize: take };
  });

  // GET /diseases/:id — Get disease details with drug links
  app.get('/diseases/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string };
    const disease = await db.disease.findUnique({
      where: { id },
      include: {
        drugLinks: {
          include: { drug: true },
          orderBy: { efficacy: 'asc' },
        },
      },
    });
    if (!disease) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Disease not found' } });
    return disease;
  });

  // GET /diseases/categories/list — List all disease categories with counts
  app.get('/diseases/categories/list', async () => {
    const categories = await db.disease.groupBy({
      by: ['category'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });
    return categories.map((c) => ({ category: c.category, count: c._count.id }));
  });

  // GET /diseases/endemic — Diseases endemic to Ghana
  app.get('/diseases/endemic', async (req: FastifyRequest) => {
    const { page = '1', pageSize = '50' } = req.query as Record<string, string>;
    const take = Math.min(Number(pageSize), 200);
    const skip = (Number(page) - 1) * take;
    const [items, total] = await Promise.all([
      db.disease.findMany({ where: { endemicToGhana: true }, orderBy: { name: 'asc' }, skip, take }),
      db.disease.count({ where: { endemicToGhana: true } }),
    ]);
    return { items, total, page: Number(page), pageSize: take };
  });

  // ================================================================
  // CLINICAL ASSISTANT (Dr. August AI / shacomputec AI)
  // ================================================================

  // POST /clinical/assistant — Answer clinical questions using the drug/disease database
  app.post('/clinical/assistant', async (req: FastifyRequest) => {
    const { question, diseaseName, drugName } = req.body as {
      question?: string;
      diseaseName?: string;
      drugName?: string;
    };

    // If asking about a specific disease
    if (diseaseName) {
      const disease = await db.disease.findFirst({
        where: { name: { contains: diseaseName } },
        include: {
          drugLinks: {
            include: { drug: true },
            orderBy: { efficacy: 'asc' },
          },
        },
      });
      if (!disease) {
        return {
          answer: `No disease found matching "${diseaseName}". Please try a different search term.`,
          suggestions: [],
        };
      }

      const firstLineDrugs = disease.drugLinks.filter((l) => l.efficacy === 'FIRST_LINE');
      const secondLineDrugs = disease.drugLinks.filter((l) => l.efficacy === 'SECOND_LINE');
      const adjunctiveDrugs = disease.drugLinks.filter((l) => l.efficacy === 'ADJUNCTIVE');
      const prophylacticDrugs = disease.drugLinks.filter((l) => l.efficacy === 'PROPHYLACTIC');

      let answer = `📋 **${disease.name}** (${disease.icdCode ?? 'No ICD code'})\n\n`;
      answer += `**Category:** ${disease.category}${disease.subCategory ? ` — ${disease.subCategory}` : ''}\n`;
      answer += `**Type:** ${disease.type ?? 'Not classified'}\n`;
      answer += `**Severity:** ${disease.severity}\n`;
      answer += `**Endemic in Ghana:** ${disease.endemicToGhana ? 'Yes' : 'No'}\n\n`;

      if (disease.symptoms) answer += `**Symptoms:** ${disease.symptoms}\n\n`;
      if (disease.transmission) answer += `**Transmission:** ${disease.transmission}\n\n`;
      if (disease.incubationPeriod) answer += `**Incubation Period:** ${disease.incubationPeriod}\n\n`;
      if (disease.prevention) answer += `**Prevention:** ${disease.prevention}\n\n`;
      if (disease.diagnosis) answer += `**Diagnosis:** ${disease.diagnosis}\n\n`;
      if (disease.complications) answer += `**Complications:** ${disease.complications}\n\n`;

      if (firstLineDrugs.length > 0) {
        answer += `**💊 First-Line Treatment:**\n`;
        for (const link of firstLineDrugs) {
          answer += `• **${link.drug.name}** (${link.drug.genericName ?? ''})`;
          if (link.dosageNote) answer += ` — ${link.dosageNote}`;
          if (link.notes) answer += `. ${link.notes}`;
          answer += '\n';
        }
        answer += '\n';
      }

      if (secondLineDrugs.length > 0) {
        answer += `**💊 Second-Line Treatment:**\n`;
        for (const link of secondLineDrugs) {
          answer += `• **${link.drug.name}** (${link.drug.genericName ?? ''})`;
          if (link.dosageNote) answer += ` — ${link.dosageNote}`;
          if (link.notes) answer += `. ${link.notes}`;
          answer += '\n';
        }
        answer += '\n';
      }

      if (adjunctiveDrugs.length > 0) {
        answer += `**💊 Adjunctive/Symptomatic:**\n`;
        for (const link of adjunctiveDrugs) {
          answer += `• **${link.drug.name}**`;
          if (link.dosageNote) answer += ` — ${link.dosageNote}`;
          if (link.notes) answer += `. ${link.notes}`;
          answer += '\n';
        }
        answer += '\n';
      }

      if (prophylacticDrugs.length > 0) {
        answer += `**🛡️ Prophylaxis:**\n`;
        for (const link of prophylacticDrugs) {
          answer += `• **${link.drug.name}**`;
          if (link.dosageNote) answer += ` — ${link.dosageNote}`;
          if (link.notes) answer += `. ${link.notes}`;
          answer += '\n';
        }
        answer += '\n';
      }

      if (disease.vaccineAvailable) {
        answer += `**💉 Vaccine Available:** Yes\n`;
      }

      return { answer, disease, drugs: disease.drugLinks.map((l) => l.drug) };
    }

    // If asking about a specific drug
    if (drugName) {
      const drug = await db.drug.findFirst({
        where: { name: { contains: drugName } },
        include: {
          diseaseLinks: {
            include: { disease: true },
            orderBy: { disease: { name: 'asc' } },
          },
        },
      });
      if (!drug) {
        return {
          answer: `No drug found matching "${drugName}". Please try a different search term.`,
          suggestions: [],
        };
      }

      let answer = `💊 **${drug.name}** (${drug.genericName ?? drug.name})\n\n`;
      if (drug.brandNames) answer += `**Brand Names:** ${drug.brandNames}\n`;
      answer += `**Category:** ${drug.category}\n`;
      answer += `**Dosage Form:** ${drug.dosageForm ?? 'Various'}\n`;
      if (drug.strength) answer += `**Strength:** ${drug.strength}\n`;
      answer += `**Route:** ${drug.route ?? 'Oral'}\n\n`;

      if (drug.adultDose) answer += `**Adult Dose:** ${drug.adultDose}\n`;
      if (drug.pediatricDose) answer += `**Pediatric Dose:** ${drug.pediatricDose}\n`;
      if (drug.maxDailyDose) answer += `**Max Daily Dose:** ${drug.maxDailyDose}\n`;
      if (drug.frequency) answer += `**Frequency:** ${drug.frequency}\n`;
      if (drug.duration) answer += `**Duration:** ${drug.duration}\n\n`;

      if (drug.mechanism) answer += `**Mechanism:** ${drug.mechanism}\n\n`;
      if (drug.sideEffects) answer += `**⚠️ Side Effects:** ${drug.sideEffects}\n\n`;
      if (drug.contraindications) answer += `**🚫 Contraindications:** ${drug.contraindications}\n\n`;
      if (drug.drugInteractions) answer += `**⚠️ Drug Interactions:** ${drug.drugInteractions}\n\n`;
      if (drug.pregnancyCategory) answer += `**🤰 Pregnancy Category:** ${drug.pregnancyCategory}\n`;
      if (drug.storageConditions) answer += `**Storage:** ${drug.storageConditions}\n`;

      answer += `\n**WHO Essential:** ${drug.whoEssential ? 'Yes' : 'No'}\n`;
      answer += `**Ghana Essential:** ${drug.ghanaEssential ? 'Yes' : 'No'}\n`;
      answer += `**Prescription Only:** ${drug.prescriptionOnly ? 'Yes' : 'No'}\n`;

      if (drug.description) answer += `\n**Description:** ${drug.description}\n`;

      if (drug.diseaseLinks.length > 0) {
        answer += `\n**Used for:**\n`;
        for (const link of drug.diseaseLinks) {
          answer += `• **${link.disease.name}** (${link.efficacy})`;
          if (link.dosageNote) answer += ` — ${link.dosageNote}`;
          answer += '\n';
        }
      }

      return { answer, drug, diseases: drug.diseaseLinks.map((l) => l.disease) };
    }

    // General search / question answering
    if (question) {
      const q = question.toLowerCase();
      const results: string[] = [];

      // Search for diseases matching the question
      const matchingDiseases = await db.disease.findMany({
        where: {
          OR: [
            { name: { contains: question } },
            { symptoms: { contains: question } },
          ],
        },
        include: {
          drugLinks: {
            include: { drug: true },
            where: { efficacy: 'FIRST_LINE' },
          },
        },
        take: 5,
      });

      for (const d of matchingDiseases) {
        let result = `📋 **${d.name}** (${d.icdCode ?? ''})\n`;
        if (d.symptoms) result += `   Symptoms: ${d.symptoms.slice(0, 150)}...\n`;
        if (d.drugLinks.length > 0) {
          result += `   First-line: ${d.drugLinks.map((l) => l.drug.name).join(', ')}\n`;
        }
        results.push(result);
      }

      // Search for drugs matching the question
      const matchingDrugs = await db.drug.findMany({
        where: {
          OR: [
            { name: { contains: question } },
            { genericName: { contains: question } },
            { description: { contains: question } },
          ],
        },
        take: 5,
      });

      for (const d of matchingDrugs) {
        let result = `💊 **${d.name}** (${d.genericName ?? ''})\n`;
        result += `   Category: ${d.category}, Route: ${d.route ?? 'Oral'}\n`;
        if (d.adultDose) result += `   Adult dose: ${d.adultDose}\n`;
        if (d.sideEffects) result += `   Side effects: ${d.sideEffects.slice(0, 100)}...\n`;
        results.push(result);
      }

      if (results.length === 0) {
        return {
          answer: `I couldn't find specific information for "${question}". Try searching for a specific disease name (e.g., "Malaria", "Hypertension") or drug name (e.g., "Paracetamol", "Amoxicillin").`,
          suggestions: [],
        };
      }

      return {
        answer: results.join('\n'),
        diseasesFound: matchingDiseases.length,
        drugsFound: matchingDrugs.length,
      };
    }

    return {
      answer: 'Welcome to **Dr. August AI (shacomputec AI)** — your clinical decision support assistant. You can:\n\n' +
        '1. Ask about a disease: `{ "diseaseName": "Malaria" }`\n' +
        '2. Ask about a drug: `{ "drugName": "Paracetamol" }`\n' +
        '3. Search by keyword: `{ "question": "fever headache" }`\n\n' +
        '⚠️ All information is for clinical reference only. Professional judgment is required for patient care.',
      suggestions: [],
    };
  });

  // GET /clinical/drug-interactions — Check drug interactions
  app.get('/clinical/drug-interactions', async (req: FastifyRequest) => {
    const { drug1, drug2 } = req.query as { drug1?: string; drug2?: string };
    if (!drug1 || !drug2) {
      return { error: 'Please provide both drug1 and drug2 query parameters' };
    }
    const d1 = await db.drug.findFirst({ where: { name: { contains: drug1 } } });
    const d2 = await db.drug.findFirst({ where: { name: { contains: drug2 } } });
    if (!d1 || !d2) {
      return { error: 'One or both drugs not found' };
    }
    let interactions: string[] = [];
    if (d1.drugInteractions?.toLowerCase().includes(d2.name.toLowerCase()) ||
        d1.drugInteractions?.toLowerCase().includes(d2.genericName?.toLowerCase() ?? '')) {
      interactions.push(`${d1.name} interacts with ${d2.name}: ${d1.drugInteractions}`);
    }
    if (d2.drugInteractions?.toLowerCase().includes(d1.name.toLowerCase()) ||
        d2.drugInteractions?.toLowerCase().includes(d1.genericName?.toLowerCase() ?? '')) {
      interactions.push(`${d2.name} interacts with ${d1.name}: ${d2.drugInteractions}`);
    }
    return {
      drug1: d1.name,
      drug2: d2.name,
      interactions,
      hasInteraction: interactions.length > 0,
    };
  });

  // POST /clinical/patient-interactions — Check interactions for a list of patient medications
  app.post('/clinical/patient-interactions', async (req: FastifyRequest) => {
    const { drugNames } = req.body as { drugNames: string[] };
    if (!drugNames || !Array.isArray(drugNames) || drugNames.length < 2) {
      return { error: 'Please provide at least 2 drug names', interactions: [], warnings: [] };
    }

    // Fetch all matching drugs from database
    const drugs = await Promise.all(
      drugNames.map(async (name) => {
        const drug = await db.drug.findFirst({ where: { name: { contains: name } } });
        return drug;
      }),
    );

    const validDrugs = drugs.filter(Boolean);
    const notFound = drugNames.filter((name, i) => !drugs[i]);

    // Check pairwise interactions
    const interactions: Array<{
      drug1: string;
      drug2: string;
      severity: string;
      description: string;
    }> = [];

    const warnings: string[] = [];

    for (let i = 0; i < validDrugs.length; i++) {
      for (let j = i + 1; j < validDrugs.length; j++) {
        const d1 = validDrugs[i]!;
        const d2 = validDrugs[j]!;

        // Check if drug1's interactions mention drug2
        const d1Interacts = d1.drugInteractions?.toLowerCase();
        const d2Interacts = d2.drugInteractions?.toLowerCase();
        const d1NameLower = d1.name.toLowerCase();
        const d1GenericLower = d1.genericName?.toLowerCase() ?? '';
        const d2NameLower = d2.name.toLowerCase();
        const d2GenericLower = d2.genericName?.toLowerCase() ?? '';

        let hasInteraction = false;
        let description = '';

        if (d1Interacts && (d1Interacts.includes(d2NameLower) || d1Interacts.includes(d2GenericLower))) {
          hasInteraction = true;
          description = d1.drugInteractions!;
        } else if (d2Interacts && (d2Interacts.includes(d1NameLower) || d2Interacts.includes(d1GenericLower))) {
          hasInteraction = true;
          description = d2.drugInteractions!;
        }

        // Check for same-category duplicates (e.g., two NSAIDs, two ACE inhibitors)
        const dangerCategories = ['ANALGESIC', 'CARDIOVASCULAR', 'NEUROLOGICAL'];
        if (!hasInteraction && d1.category === d2.category && dangerCategories.includes(d1.category)) {
          // Check for similar sub-classes
          if (d1.category === 'ANALGESIC' && d1.name !== d2.name) {
            const nsaids = ['Ibuprofen', 'Diclofenac', 'Aspirin', 'Naproxen', 'Mefenamic Acid'];
            const isNSAID1 = nsaids.some((n) => d1.name.includes(n));
            const isNSAID2 = nsaids.some((n) => d2.name.includes(n));
            if (isNSAID1 && isNSAID2) {
              hasInteraction = true;
              description = 'Multiple NSAIDs increase risk of GI bleeding and renal impairment.';
            }
          }
          if (d1.category === 'CARDIOVASCULAR') {
            const aceInhibitors = ['Enalapril', 'Lisinopril', 'Ramipril', 'Captopril'];
            const isACE1 = aceInhibitors.some((n) => d1.name.includes(n));
            const isACE2 = aceInhibitors.some((n) => d2.name.includes(n));
            if (isACE1 && isACE2) {
              hasInteraction = true;
              description = 'Multiple ACE inhibitors — do not combine. Increases risk of hyperkalaemia and renal failure.';
            }
          }
        }

        if (hasInteraction) {
          interactions.push({
            drug1: d1.name,
            drug2: d2.name,
            severity: 'WARNING',
            description,
          });
        }
      }
    }

    // Check for pregnancy category warnings
    for (const drug of validDrugs) {
      if (drug && (drug.pregnancyCategory === 'D' || drug.pregnancyCategory === 'X')) {
        warnings.push(`⚠️ ${drug.name} is Pregnancy Category ${drug.pregnancyCategory} — review risks in pregnancy.`);
      }
    }

    // Check for controlled substance warnings
    for (const drug of validDrugs) {
      if (drug && drug.controlledSchedule) {
        warnings.push(`📋 ${drug.name} is a controlled substance (${drug.controlledSchedule}).`);
      }
    }

    // Check for duplicate active ingredients
    const generics = validDrugs.filter(Boolean).map((d) => d!.genericName?.toLowerCase() ?? d!.name.toLowerCase());
    const seen = new Set<string>();
    for (const g of generics) {
      if (seen.has(g)) {
        warnings.push(`⚠️ Duplicate active ingredient detected: ${g}. Review prescribing.`);
      }
      seen.add(g);
    }

    return {
      drugsChecked: validDrugs.map((d) => d!.name),
      notFound,
      interactions,
      warnings,
      totalInteractions: interactions.length,
      totalWarnings: warnings.length,
      safe: interactions.length === 0 && warnings.length === 0,
    };
  });
}
