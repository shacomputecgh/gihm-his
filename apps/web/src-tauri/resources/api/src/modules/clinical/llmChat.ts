import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { PrismaClient } from '@prisma/client';

/**
 * LLM-powered clinical assistant (shacomputec AI / Dr. August)
 *
 * Proxies clinical questions to an LLM API (OpenAI/Claude) with drug/disease
 * context injected from the local database. Falls back to local search when
 * no API key is configured.
 */

const SYSTEM_PROMPT = `You are Dr. August AI (shacomputec AI), a clinical decision support assistant for healthcare workers in Ghana.

Your role:
- Help doctors, nurses, and clinical officers with drug information, dosing, interactions, and treatment protocols
- Provide evidence-based guidance using WHO Essential Medicines and Ghana National Formulary
- Flag critical safety information (drug interactions, contraindications, pregnancy categories)
- Support both English and simple clinical language

Important rules:
1. Always include a disclaimer that this is for clinical reference only and professional judgment is required
2. Never fabricate drug names, doses, or interactions — only use information from the database context provided
3. When unsure, recommend consulting a pharmacist or specialist
4. For emergency situations, recommend immediate clinical assessment
5. Format responses with clear headers and bullet points for readability
6. Always specify whether information applies to adults or children
7. Flag any controlled substances or medications requiring special monitoring`;

export function registerLLMRoutes(app: FastifyInstance, db: PrismaClient, guards: any) {

  // POST /clinical/llm-chat — LLM-powered clinical conversation
  app.post('/clinical/llm-chat', async (req: FastifyRequest, reply: FastifyReply) => {
    const { message, conversationHistory = [] } = req.body as {
      message: string;
      conversationHistory?: Array<{ role: string; content: string }>;
    };

    if (!message?.trim()) {
      return reply.status(400).send({ error: { code: 'BAD_REQUEST', message: 'Message is required' } });
    }

    // Search for relevant drugs and diseases to inject as context
    const contextParts: string[] = [];

    // Search drugs
    const drugResults = await db.drug.findMany({
      where: {
        OR: [
          { name: { contains: message } },
          { genericName: { contains: message } },
          { description: { contains: message } },
          { category: { contains: message } },
        ],
      },
      take: 5,
    });

    if (drugResults.length > 0) {
      contextParts.push('=== RELEVANT DRUGS FROM DATABASE ===');
      for (const drug of drugResults) {
        let info = `\n**${drug.name}** (${drug.genericName ?? ''})\n`;
        info += `Category: ${drug.category} | Route: ${drug.route ?? 'Oral'} | Form: ${drug.dosageForm ?? ''}\n`;
        if (drug.adultDose) info += `Adult dose: ${drug.adultDose}\n`;
        if (drug.pediatricDose) info += `Pediatric dose: ${drug.pediatricDose}\n`;
        if (drug.sideEffects) info += `Side effects: ${drug.sideEffects}\n`;
        if (drug.contraindications) info += `Contraindications: ${drug.contraindications}\n`;
        if (drug.drugInteractions) info += `Interactions: ${drug.drugInteractions}\n`;
        if (drug.pregnancyCategory) info += `Pregnancy: Category ${drug.pregnancyCategory}\n`;
        contextParts.push(info);
      }
    }

    // Search diseases
    const diseaseResults = await db.disease.findMany({
      where: {
        OR: [
          { name: { contains: message } },
          { symptoms: { contains: message } },
          { description: { contains: message } },
        ],
      },
      take: 5,
    });

    if (diseaseResults.length > 0) {
      contextParts.push('\n=== RELEVANT DISEASES FROM DATABASE ===');
      for (const disease of diseaseResults) {
        let info = `\n**${disease.name}** (${disease.icdCode ?? ''})\n`;
        info += `Category: ${disease.category} | Severity: ${disease.severity}\n`;
        if (disease.symptoms) info += `Symptoms: ${disease.symptoms}\n`;
        if (disease.diagnosis) info += `Diagnosis: ${disease.diagnosis}\n`;
        if (disease.complications) info += `Complications: ${disease.complications}\n`;
        info += `Endemic in Ghana: ${disease.endemicToGhana ? 'Yes' : 'No'}\n`;
        contextParts.push(info);
      }
    }

    // Search drug-disease treatment links
    if (diseaseResults.length > 0) {
      const diseaseIds = diseaseResults.map((d) => d.id);
      const links = await db.drugDiseaseLink.findMany({
        where: { diseaseId: { in: diseaseIds } },
        include: { drug: true, disease: true },
        take: 15,
      });

      if (links.length > 0) {
        contextParts.push('\n=== TREATMENT PROTOCOLS ===');
        for (const link of links) {
          contextParts.push(
            `${link.efficacy}: ${link.drug.name} for ${link.disease.name}` +
            (link.dosageNote ? ` — ${link.dosageNote}` : '') +
            (link.notes ? `. ${link.notes}` : ''),
          );
        }
      }
    }

    const context = contextParts.length > 0
      ? `\n\n--- DATABASE CONTEXT ---\n${contextParts.join('\n')}\n--- END CONTEXT ---\n`
      : '\n\n(No matching drugs or diseases found in the local database. Use your general medical knowledge to answer.)';

    // Check if LLM API is configured
    const apiKey = process.env.LLM_API_KEY;
    const apiProvider = process.env.LLM_PROVIDER ?? 'openai';
    const apiEndpoint = process.env.LLM_API_ENDPOINT;

    if (!apiKey) {
      // Fallback: return context-rich response without LLM
      let fallbackResponse = `## Dr. August AI Response\n\n`;
      if (drugResults.length > 0 || diseaseResults.length > 0) {
        fallbackResponse += `I found relevant information in the database:\n\n`;
        fallbackResponse += contextParts.join('\n\n');
        fallbackResponse += `\n\n---\n⚠️ *This information is from the local drug/disease database. For more detailed clinical guidance, configure an LLM API key (LLM_API_KEY environment variable).*`;
      } else {
        fallbackResponse += `I couldn't find matching information in the local database for "${message}".\n\n`;
        fallbackResponse += `**Suggestions:**\n`;
        fallbackResponse += `- Try searching for a specific drug name (e.g., "Paracetamol", "Amoxicillin")\n`;
        fallbackResponse += `- Try searching for a disease name (e.g., "Malaria", "Hypertension")\n`;
        fallbackResponse += `- Check the Drug Database or Disease Reference pages for browsing\n\n`;
        fallbackResponse += `*To enable AI-powered responses, configure LLM_API_KEY in the environment.*`;
      }
      return {
        response: fallbackResponse,
        provider: 'local-database',
        contextUsed: contextParts.length > 0,
        drugsFound: drugResults.length,
        diseasesFound: diseaseResults.length,
      };
    }

    // Call LLM API
    try {
      const messages = [
        { role: 'system', content: SYSTEM_PROMPT + context },
        ...conversationHistory.slice(-10), // Keep last 10 messages for context
        { role: 'user', content: message },
      ];

      let llmResponse: string;

      if (apiProvider === 'openai') {
        const url = apiEndpoint ?? 'https://api.openai.com/v1/chat/completions';
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: process.env.LLM_MODEL ?? 'gpt-4o-mini',
            messages,
            max_tokens: 2000,
            temperature: 0.3,
          }),
        });
        const data = await res.json() as any;
        llmResponse = data.choices?.[0]?.message?.content ?? 'No response from LLM';
      } else if (apiProvider === 'claude') {
        const url = apiEndpoint ?? 'https://api.anthropic.com/v1/messages';
        const claudeMessages = messages.filter((m) => m.role !== 'system');
        const systemMsg = messages.find((m) => m.role === 'system')?.content ?? '';
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: process.env.LLM_MODEL ?? 'claude-3-5-sonnet-20241022',
            max_tokens: 2000,
            system: systemMsg,
            messages: claudeMessages,
          }),
        });
        const data = await res.json() as any;
        llmResponse = data.content?.[0]?.text ?? 'No response from LLM';
      } else {
        return reply.status(400).send({
          error: { code: 'BAD_REQUEST', message: `Unsupported LLM provider: ${apiProvider}. Use 'openai' or 'claude'.` },
        });
      }

      return {
        response: llmResponse,
        provider: apiProvider,
        model: process.env.LLM_MODEL,
        contextUsed: contextParts.length > 0,
        drugsFound: drugResults.length,
        diseasesFound: diseaseResults.length,
      };
    } catch (err: any) {
      return reply.status(502).send({
        error: {
          code: 'LLM_ERROR',
          message: `Failed to get response from ${apiProvider}: ${err.message}`,
        },
      });
    }
  });

  // GET /clinical/llm-status — Check LLM configuration status
  app.get('/clinical/llm-status', async () => {
    const apiKey = process.env.LLM_API_KEY;
    const provider = process.env.LLM_PROVIDER ?? 'openai';
    const model = process.env.LLM_MODEL;
    const endpoint = process.env.LLM_API_ENDPOINT;

    return {
      configured: !!apiKey,
      provider: apiKey ? provider : 'none',
      model: model ?? (provider === 'openai' ? 'gpt-4o-mini' : 'claude-3-5-sonnet-20241022'),
      endpoint: endpoint ?? 'default',
      message: apiKey
        ? `LLM-powered chat is active (${provider})`
        : 'LLM not configured. Using local database search. Set LLM_API_KEY to enable AI chat.',
    };
  });
}
