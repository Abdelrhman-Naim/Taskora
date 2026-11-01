import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateProjectWithGemini } from '@/lib/ai/gemini';

const requestSchema = z.object({
  prompt: z.string().trim().min(2, 'Prompt must be at least 2 characters'),
  locale: z.enum(['ar', 'en']).optional().default('ar'),
  apiKey: z.string().trim().optional(),
  members: z
    .array(
      z.object({
        uid: z.string(),
        displayName: z.string(),
        jobTitle: z.string(),
      })
    )
    .optional()
    .default([]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { prompt, locale, members, apiKey } = parsed.data;
    const generated = await generateProjectWithGemini(prompt, locale, members, apiKey);

    return NextResponse.json(generated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
