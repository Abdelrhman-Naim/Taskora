import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { MemberContext } from '@/lib/ai/gemini';
import { TaskPriority } from '@/types';

const quickTaskRequestSchema = z.object({
  prompt: z.string().trim().min(2, 'Prompt is required'),
  locale: z.enum(['ar', 'en']).optional().default('ar'),
  apiKey: z.string().optional(),
  members: z
    .array(
      z.object({
        uid: z.string(),
        displayName: z.string(),
        jobTitle: z.string(),
        jobTitles: z.array(z.string()).optional(),
      })
    )
    .optional()
    .default([]),
});

export interface ParsedTaskResult {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string | null;
  assigneeId: string | null;
  checklist: string[];
}

export function parseQuickTaskFallback(
  prompt: string,
  members: MemberContext[]
): ParsedTaskResult {
  const lower = prompt.toLowerCase();

  // 1. Priority detection
  let priority: TaskPriority = 'medium';
  if (/عالية|عاليه|قصوى|عاجل|urgent|طارئ|مهم جدا|high|asap|p1/i.test(lower)) {
    priority = 'high';
  } else if (/منخفضة|منخفضه|بسيطة|عادية|low|غير عاجل/i.test(lower)) {
    priority = 'low';
  }

  // 2. Relative & Absolute Due Date detection
  let dueDate: string | null = null;
  const now = new Date();

  if (/بعد بكرة|بعد يومين/i.test(lower)) {
    now.setDate(now.getDate() + 2);
    dueDate = now.toISOString().slice(0, 10);
  } else if (/tomorrow|بكرة|غداً|غدا/i.test(lower)) {
    now.setDate(now.getDate() + 1);
    dueDate = now.toISOString().slice(0, 10);
  } else if (/بعد\s*([٠-٩\d]+)\s*(أيام|ايام|يوم)/i.test(lower)) {
    const match = lower.match(/بعد\s*([٠-٩\d]+)\s*(أيام|ايام|يوم)/i);
    if (match) {
      const numStr = match[1].replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
      const days = parseInt(numStr, 10) || 1;
      now.setDate(now.getDate() + days);
      dueDate = now.toISOString().slice(0, 10);
    }
  } else if (/الأسبوع الجاي|الاسبوع الجاي|الاسبوع القادم|الأسبوع القادم|next week/i.test(lower)) {
    now.setDate(now.getDate() + 7);
    dueDate = now.toISOString().slice(0, 10);
  } else if (/نهاية الأسبوع|نهاية الاسبوع|weekend/i.test(lower)) {
    const target = (4 - now.getDay() + 7) % 7 || 7;
    now.setDate(now.getDate() + target);
    dueDate = now.toISOString().slice(0, 10);
  } else {
    // Weekdays matching (0=Sunday ... 6=Saturday)
    const daysMap: Array<{ pattern: RegExp; targetDay: number }> = [
      { pattern: /السبت|saturday/i, targetDay: 6 },
      { pattern: /الأحد|الاحد|sunday/i, targetDay: 0 },
      { pattern: /الاثنين|الإثنين|monday/i, targetDay: 1 },
      { pattern: /الثلاثاء|tuesday/i, targetDay: 2 },
      { pattern: /الأربعاء|الاربعاء|wednesday/i, targetDay: 3 },
      { pattern: /الخميس|thursday/i, targetDay: 4 },
      { pattern: /الجمعة|الجمعه|friday/i, targetDay: 5 },
    ];

    for (const d of daysMap) {
      if (d.pattern.test(lower)) {
        const offset = (d.targetDay - now.getDay() + 7) % 7 || 7;
        now.setDate(now.getDate() + offset);
        dueDate = now.toISOString().slice(0, 10);
        break;
      }
    }
  }

  // 3. Assignee matching
  let assigneeId: string | null = null;

  // Step A: Explicit Name & Transliteration matching (e.g. "لممبر يوزر" -> "Member User")
  const transliterations: Record<string, string> = {
    'ممبر يوزر': 'member user',
    'ممبر': 'member',
    'اونر يوزر': 'owner user',
    'اونر': 'owner',
  };

  let normalizedPrompt = lower;
  for (const [ar, en] of Object.entries(transliterations)) {
    normalizedPrompt = normalizedPrompt.replace(new RegExp(`(ل|لل)?${ar}`, 'gi'), en);
  }

  for (const m of members) {
    const disp = m.displayName.toLowerCase();
    const parts = disp.split(' ').filter((p) => p.length >= 3);

    const directMatch =
      disp && (lower.includes(disp) || normalizedPrompt.includes(disp));
    const partsMatch = parts.some(
      (part) => lower.includes(part) || normalizedPrompt.includes(part)
    );
    const emailMatch = m.uid && lower.includes(m.uid.toLowerCase());

    if (directMatch || partsMatch || emailMatch) {
      assigneeId = m.uid;
      break;
    }
  }

  // Step B: Semantic Role-Based Assignment when no explicit person is named
  if (!assigneeId && members.length > 0) {
    const roleChecks: Array<{ pattern: RegExp; roleRegex: RegExp }> = [
      // 1. UI/UX & Visual Design (explicit design action, colors, wireframes)
      {
        pattern: /تصميم|ديزاين|فيجما|figma|ألوان|الوان|خطوط|wireframe|mockup|prototype|هوية\s*بصرية/i,
        roleRegex: /designer|ui|ux|مصمم|تنسيق|غرافيك/i,
      },
      // 2. QA, Security & Testing
      {
        pattern: /سكيورتي|أمان|امان|فحص|ثغرات|تست|تيست|اختبار|qa|test|testing|audit|pentest|جودة|bug|bugs/i,
        roleRegex: /qa|test|جودة|فاحص|اختبار|security|أمان/i,
      },
      // 3. DevOps & Cloud & Infrastructure
      {
        pattern: /حاويات|نشر|استضافة|سيرفرات|docker|kubernetes|ci\/cd|aws|vercel|devops|سحابة|deploy|pipeline/i,
        roleRegex: /devops|cloud|sysadmin|سحابي|نشر/i,
      },
      // 4. Frontend & Interactive Web Components
      {
        pattern: /فرونت|frontend|تطوير\s*(واجه|صفح|مكون)|برمجة\s*(واجه|صفح|مكون)|تفاعلية|مكونات|css|html|react|next|tailwind|زر|أزرار|قوائم/i,
        roleRegex: /frontend|web|واجهات|react|full stack/i,
      },
      // 5. Backend, Database & APIs
      {
        pattern: /سيرفر|خلفي|backend|قاعدة|بيانات|api|endpoint|مسارات|مسار|ربط|node|sql|postgres|auth|مصادقة|دفع|شحن|stripe|بوابة/i,
        roleRegex: /backend|server|خلفي|بيانات|database|full stack/i,
      },
      // 6. Project Management & Architecture / Analysis
      {
        pattern: /تحليل|مشروع|خطة|متطلبات|جدولة|سبرنت|اجتماع|متابعة|إدارة|ادارة|مواصفات|prd|spec|planning|roadmap|backlog/i,
        roleRegex: /project manager|product owner|scrum master|business analyst|مدير|رئيس|تخطيط/i,
      },
      // 7. Content & Copywriting
      {
        pattern: /محتوى|كتابة|نصوص|ترجمة|مقال|seo|نص|مدونة|تسويق|content|copywriting/i,
        roleRegex: /content|writer|copywriter|تسويق|كاتب/i,
      },
    ];

    for (const check of roleChecks) {
      if (check.pattern.test(lower)) {
        const candidate = members.find((m) => {
          if (check.roleRegex.test(m.jobTitle)) return true;
          if (m.jobTitles && m.jobTitles.some((t: string) => check.roleRegex.test(t))) return true;
          return false;
        });
        if (candidate) {
          assigneeId = candidate.uid;
          break;
        }
      }
    }

    if (!assigneeId && members[0]) {
      assigneeId = members[0].uid;
    }
  }

  // 4. Clean Task Title Extraction
  let cleanTitle = prompt;

  cleanTitle = cleanTitle.replace(/\s*(ب)?اولويه\s*(عاليه|عالية|قصوى|متوسطة|متوسطه|منخفضة|منخفضه)/gi, '');
  cleanTitle = cleanTitle.replace(/\s*(high|medium|low)\s*priority/gi, '');
  cleanTitle = cleanTitle.replace(/\s*(التسليم|موعد|تسليم)?\s*(السبت|الأحد|الاحد|الاثنين|الإثنين|الثلاثاء|الأربعاء|الاربعاء|الخميس|الجمعة|الجمعه|غداً|غدا|بكرة)\s*(الجاي|القادم)?/gi, '');
  cleanTitle = cleanTitle.replace(/\s*(tomorrow|next\s+week|after\s+tomorrow)/gi, '');
  cleanTitle = cleanTitle.replace(/\s*(لـ|للـ|ل)?(ممبر\s+يوزر|اونر\s+يوزر|المصمم|المطور|الـ\s*qa|backend|frontend)/gi, '');

  for (const m of members) {
    if (m.displayName) {
      cleanTitle = cleanTitle.replace(new RegExp(`\\s*(لـ|للـ|ل|for)?\\s*${m.displayName}`, 'gi'), '');
    }
  }

  cleanTitle = cleanTitle.replace(/^\s*(بدي\s+اعمل|مهمه|مهمة|قم\s+بعمل|يرجى\s+عمل|اضافة\s+مهمة|إضافة\s+مهمة)\s*/gi, '');
  cleanTitle = cleanTitle.replace(/\s*(مهمه|مهمة)\s*/gi, ' ');
  cleanTitle = cleanTitle.replace(/\s{2,}/g, ' ').trim();

  if (!cleanTitle || cleanTitle.length < 3) {
    cleanTitle = prompt.slice(0, 60);
  }

  return {
    title: cleanTitle,
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

    const { prompt, locale, apiKey: clientApiKey, members } = parsed.data;
    const effectiveApiKey = clientApiKey || process.env.GEMINI_API_KEY;

    if (!effectiveApiKey) {
      return NextResponse.json(parseQuickTaskFallback(prompt, members));
    }

    const membersPrompt = members
      .map(
        (m) =>
          `- UID: "${m.uid}", Name: "${m.displayName}", Roles: "${
            m.jobTitles && m.jobTitles.length > 0 ? m.jobTitles.join(', ') : m.jobTitle
          }"`
      )
      .join('\n');

    const promptText = `You are Taskora Natural Language Task Parser.
Extract a structured task from the user's natural language / voice command.
Target language: ${locale}

USER COMMAND:
"${prompt}"

TEAM ROSTER & ROLES:
${membersPrompt || 'No members provided.'}

INSTRUCTIONS:
1. Title: extract a clean, concise, actionable task title (e.g. from "تحليل مشروع مهمه لممبر يوزر اولويه عاليه التسليم السبت الجاي", output "تحليل متطلبات وهندسة المشروع"). Never include priority words, dates, or assignee names in the title!
2. Priority: "low" | "medium" | "high".
3. Due date: estimate date string YYYY-MM-DD if mentioned (today is ${new Date().toISOString().slice(0, 10)}), else null.
4. Assignee:
   - If a person's name or transliterated name is mentioned (e.g. "لممبر يوزر" -> "Member User"), pick that member UID.
   - If NO person is named, analyze the task requirements and pick the member UID whose job role (or roles) is the most suitable match!
   - If none matches, return null.
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

    const models = ['gemini-1.5-flash', 'gemini-2.0-flash'];
    let lastError = null;

    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${effectiveApiKey}`,
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

        if (response.ok) {
          const data = await response.json();
          const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

          if (candidateText) {
            const cleaned = candidateText
              .replace(/^```json\s*/i, '')
              .replace(/\s*```$/i, '')
              .trim();
            const result: ParsedTaskResult = JSON.parse(cleaned);
            return NextResponse.json(result);
          }
        }
      } catch (err) {
        lastError = err;
      }
    }

    if (lastError) {
      // Fallback
    }

    return NextResponse.json(parseQuickTaskFallback(prompt, members));
  } catch {
    return NextResponse.json(parseQuickTaskFallback('New Task', []));
  }
}
