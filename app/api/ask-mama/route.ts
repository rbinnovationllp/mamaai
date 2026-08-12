import { NextResponse } from 'next/server';
import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';

const askMamaSchema = z.object({
  query: z.string().trim().min(1, 'Please enter a question.').max(500),
  familyData: z.any().optional(),
  pantryData: z.any().optional(),
  petData: z.any().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const normalizedQuery = body.query || body.question || '';

    const parsed = askMamaSchema.safeParse({ ...body, query: normalizedQuery });

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Please enter a valid question.' } },
        { status: 400 }
      );
    }

    const { query, familyData, pantryData, petData } = parsed.data;

    // Verify API Key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes('your-gemini-api-key')) {
      return NextResponse.json({
        answer: "Ask MAMA API Key is not configured yet in .env. Please set a valid GEMINI_API_KEY to enable live AI responses."
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const isPetQuery = /dog|cat|pet|puppy|kitten|bruno|kitty/i.test(query);

    const systemPrompt = isPetQuery
      ? `You are MAMAAI Pet Food & Safety Guard (www.mamaai.in).
         Answer this pet question safely for ${JSON.stringify(petData || [])}.
         CRITICAL SAFETY: Onions, garlic, chocolate, grapes, raisins, xylitol, and cooked bones are TOXIC to pets and must be flagged immediately.
         User Question: "${query}"`
      : `You are Ask MAMA, an intelligent family kitchen assistant for www.mamaai.in.
         Family Context: ${JSON.stringify(familyData || [])}
         Pantry Stock: ${JSON.stringify(pantryData || [])}
         User Question: "${query}"
         Provide a helpful, concise response balancing household dietary needs.`;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: systemPrompt,
    });

    return NextResponse.json({ answer: response.text });
  } catch (error: any) {
    console.error('Ask MAMA Route Exception:', error);
    return NextResponse.json(
      { error: { code: 'ASK_MAMA_FAILED', message: `MAMA connection error: ${error?.message || 'Check GEMINI_API_KEY configuration.'}` } },
      { status: 500 }
    );
  }
}