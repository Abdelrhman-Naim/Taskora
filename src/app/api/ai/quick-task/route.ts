import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { MemberContext } from '@/lib/ai/gemini';
import { TaskPriority } from '@/types';

const quickTaskRequestSchema = z.object({
  prompt: z.string().trim().min(2, 'Prompt is required'),
  locale: z.enum(['ar', 'en']).optional().default('ar'),
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

interface ParsedTaskResult {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string | null;
  assigneeId: string | null;
  checklist: string[];
}

function parseQuickTaskFallback(
  prompt: string,
  members: MemberContext[]
): ParsedTaskResult {
  const lower = prompt.toLowerCase();

  // Priority detection
  let priority: TaskPriority = 'medium';
  if (/high|urgent|عاجل|عالي|ضروري|قصوى/i.test(lower)) {
    priority = 'high';
  } else if (/low|منخفض|بسيط/i.test(lower)) {
    priority = 'low';
  }

  // Assignee matching
  let assigneeId: string | null = null;
  for (const m of members) {
    const nameMatch = m.displayName && lower.includes(m.displayName.toLowerCase());
    const roleMatch = m.jobTitle && (
      (/designer|ui|ux/i.test(m.jobTitle) && /مصمم|تصميم|ديزاين|design|ui|ux/i.test(lower)) ||
      (/backend|خلفي|بيانات/i.test(m.jobTitle) && /backend|سيرفر|api|قاعدة|خلفي/i.test(lower)) ||
      (/frontend|واجهات/i.test(m.jobTitle) && /frontend|شاشة|صفحة|واجهة/i.test(lower)) ||
      (/qa|test|جودة/i.test(m.jobTitle) && /qa|فحص|اختبار|تيست/i.test(lower))
    );

    if (nameMatch || roleMatch) {
      assigneeId = m.uid;
      break;
    }
  }

  // Relative Date detection
  let dueDate: string | null = null;
  const now = new Date();
  if (/tomorrow|بكرة|غداً/i.test(lower)) {
    now.setDate(now.getDate() + 1);
    dueDate = now.toISOString().slice(0, 10);
  } else if (/week|أسبوع/i.test(lower)) {
    now.setDate(now.getDate() + 7);
    dueDate = now.toISOString().slice(0, 10);
  } else if (/خميس|thursday/i.test(lower)) {
    now.setDate(now.getDate() + ((4 + 7 - now.getDay()) % 7 || 7));
    dueDate = now.toISOString().slice(0, 10);
  } else if (/أحد|sunday/i.test(lower)) {
    now.setDate(now.getDate() + ((0 + 7 - now.getDay()) % 7 || 7));
    dueDate = now.toISOString().slice(0, 10);
  }

  return {
    title: prompt.slice(0, 80),
    description: `تم إنشاؤها عبر الإدخال السريع الذكي: "${prompt}"`,
    priority,
    dueDate,
    assigneeId,
    checklist: [],
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = quickTaskRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { prompt, locale, members } = parsed.data;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(parseQuickTaskFallback(prompt, members));
    }

    const membersPrompt = members
      .map((m) => `- UID: "${m.uid}", Name: "${m.displayName}", Role: "${m.jobTitle}"`)
      .join('\n');

    const promptText = `You are Taskora Natural Language Task Parser.
Extract a structured task from the user's quick command.

USER COMMAND:
"${prompt}"

TEAM ROSTER & ROLES:
${membersPrompt || 'No members provided.'}

INSTRUCTIONS:
1. Title: concise action title (keep in language of prompt).
2. Priority: "low" | "medium" | "high".
3. Due date: estimate date string YYYY-MM-DD if mentioned (today is ${new Date().toISOString().slice(0, 10)}), else null.
4. Assignee: pick the most suitable member UID from the roster matching the role mentioned (e.g. designer, backend, qa) or person's name. If none matches, return null.
5. Checklist: array of 0-3 quick sub-steps if mentioned.

OUTPUT STRICT RAW JSON ONLY:
{
  "title": "Clean task title",
  "description": "Short explanation",
  "priority": "low" | "medium" | "high",
  "dueDate": "YYYY-MM-DD" or null,
  "assigneeId": "UID" or null,
  "checklist": ["step 1"]
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json(parseQuickTaskFallback(prompt, members));
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      return NextResponse.json(parseQuickTaskFallback(prompt, members));
    }

    const cleaned = candidateText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    const result: ParsedTaskResult = JSON.parse(cleaned);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(parseQuickTaskFallback('New Task', []));
  }
}
