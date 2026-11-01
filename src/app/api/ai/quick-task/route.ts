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

/**
 * Generates phonetic Arabic and Latin variations for user display names.
 * Crucial for Arabic speech-to-text where English names are transcribed phonetically:
 * "Member" -> "منبر" (via Arabic Tajweed/phonetic Iqlab ن+ب = mb), "ممبر", "ميمبر", "مبر".
 * "Owner"  -> "اونر", "أونر", "اونير".
 */
export function getPhoneticArabicVariants(name: string): string[] {
  const lower = name.toLowerCase().trim();
  const variants = new Set<string>();
  variants.add(lower);

  // Common demo & role names
  if (lower.includes('member')) {
    variants.add('منبر');
    variants.add('ممبر');
    variants.add('ميمبر');
    variants.add('مبر');
  }
  if (lower.includes('owner')) {
    variants.add('اونر');
    variants.add('أونر');
    variants.add('اونير');
  }
  if (lower.includes('user')) {
    variants.add('يوزر');
    variants.add('يوزير');
  }
  if (lower.includes('admin')) {
    variants.add('ادمن');
    variants.add('أدمن');
  }
  if (lower.includes('manager')) {
    variants.add('مانجر');
    variants.add('منجر');
  }
  if (lower.includes('developer') || lower.includes('dev')) {
    variants.add('ديفلوبر');
    variants.add('دفلبر');
    variants.add('مطور');
  }
  if (lower.includes('designer')) {
    variants.add('ديزاينر');
    variants.add('مصمم');
  }
  if (lower.includes('tester') || lower.includes('qa')) {
    variants.add('تيستر');
    variants.add('تستر');
    variants.add('كيو ايه');
    variants.add('فاحص');
  }

  // Common Arabic & English Names
  if (lower.includes('ahmed') || lower.includes('ahmad')) {
    variants.add('أحمد');
    variants.add('احمد');
  }
  if (lower.includes('sarah') || lower.includes('sara')) {
    variants.add('سارة');
    variants.add('ساره');
  }
  if (lower.includes('mohamed') || lower.includes('mohammed') || lower.includes('muhammad')) {
    variants.add('محمد');
  }
  if (lower.includes('tariq') || lower.includes('tareq')) {
    variants.add('طارق');
  }
  if (lower.includes('hassan') || lower.includes('hasan')) {
    variants.add('حسن');
  }
  if (lower.includes('ali')) {
    variants.add('علي');
  }
  if (lower.includes('omar')) {
    variants.add('عمر');
  }
  if (lower.includes('khaled') || lower.includes('khalid')) {
    variants.add('خالد');
  }
  if (lower.includes('dana')) {
    variants.add('دانا');
  }
  if (lower.includes('john')) {
    variants.add('جون');
  }
  if (lower.includes('alex')) {
    variants.add('اليكس');
    variants.add('أليكس');
  }

  // Combined full names
  if (lower === 'member user') {
    variants.add('منبر يوزر');
    variants.add('ممبر يوزر');
    variants.add('ميمبر يوزر');
    variants.add('مبر يوزر');
  }
  if (lower === 'owner user') {
    variants.add('اونر يوزر');
    variants.add('أونر يوزر');
    variants.add('اونير يوزر');
  }

  return Array.from(variants);
}

/**
 * Scores a member against a candidate target string.
 * Prevents generic collisions like "User" matching "Member User" when "Owner User" was meant.
 */
export function scoreMemberMatch(
  member: MemberContext,
  rawTarget: string,
  normalizedTarget: string
): number {
  const disp = member.displayName.toLowerCase().trim();
  const variants = getPhoneticArabicVariants(member.displayName);
  const targetLower = rawTarget.toLowerCase().trim();
  const normLower = normalizedTarget.toLowerCase().trim();

  // 1. Exact full display name or exact full variant match -> highest priority
  if (normLower === disp || targetLower === disp) return 100;
  for (const v of variants) {
    if (targetLower === v || normLower === v) return 95;
  }

  // 2. Starts with / Substring of full display name
  if (normLower.includes(disp) || targetLower.includes(disp)) return 80;
  for (const v of variants) {
    if (targetLower.includes(v) || normLower.includes(v)) {
      // Full two-word transliteration (e.g. "منبر يوزر" or "اونر يوزر")
      if (v.includes(' ')) return 75;
      // Single generic words like "user" get very low score
      if (v === 'يوزر' || v === 'user') return 15;
      return 60;
    }
  }

  // 3. Significant Name Parts (e.g. "Ahmed", "Sarah", "Member", "Owner")
  const parts = disp.split(/\s+/).filter((p) => p.length >= 3 && p !== 'user');
  for (const part of parts) {
    if (normLower.includes(part) || targetLower.includes(part)) {
      return 50;
    }
  }

  // 4. Fallback on any generic part (including "user")
  if (disp.split(/\s+/).some((p) => normLower.includes(p) || targetLower.includes(p))) {
    return 10;
  }

  return 0;
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

  // Step A: Phonetic Transliterations & Speech-to-Text replacements
  const transliterations: Record<string, string> = {
    'منبر يوزر': 'member user',
    'ممبر يوزر': 'member user',
    'ميمبر يوزر': 'member user',
    'مبر يوزر': 'member user',
    'منبر': 'member',
    'ممبر': 'member',
    'ميمبر': 'member',
    'مبر': 'member',
    'اونر يوزر': 'owner user',
    'أونر يوزر': 'owner user',
    'اونير يوزر': 'owner user',
    'اونر': 'owner',
    'أونر': 'owner',
    'اونير': 'owner',
  };

  let normalizedPrompt = lower;
  for (const [ar, en] of Object.entries(transliterations)) {
    normalizedPrompt = normalizedPrompt.replace(new RegExp(`(?:لـ|للـ|ل)?${ar}`, 'gi'), en);
  }

  // Step A1: Explicit Assignee Extraction from phrasing:
  // e.g. "المكلف به منبر يوزر", "المكلف هو اونر يوزر", "المسند إليه Member User", "assigned to John"
  const assigneePrefixRegex =
    /(?:الـ|ال)?\s*(?:المكلف\s+به|المكلف\s+بها|المكلف\s+هو|المكلف|المسند\s+إليه|المسند\s+له|المسؤول\s+عنه|المسؤول\s+عنها|مسؤولية|إسناد\s+إلى|اسناد\s+الى|تكليف|بواسطة|assigned\s+to|assign\s+to|assignee\s*:?)\s*:?\s*([^,.\n]+)/i;

  const explicitMatch = lower.match(assigneePrefixRegex);
  if (explicitMatch) {
    const rawTarget = explicitMatch[1].trim();
    // Strip trailing date or priority words that might have been captured after the name
    const stopWordsRegex =
      /\s*(?:(ب)?(?:اولويه|أولوية|أولويه|اولوية)|التسليم|موعد|تسليم|السبت|الأحد|الاحد|الاثنين|الإثنين|الثلاثاء|الأربعاء|الاربعاء|الخميس|الجمعة|الجمعه|غداً|غدا|بكرة|بعد\s*بكرة|بعد\s*يومين|high|medium|low|tomorrow|next).*/i;
    const target = rawTarget.replace(stopWordsRegex, '').trim();

    let normalizedTarget = target;
    for (const [ar, en] of Object.entries(transliterations)) {
      normalizedTarget = normalizedTarget.replace(new RegExp(`(?:لـ|للـ|ل)?${ar}`, 'gi'), en);
    }

    let bestScore = 0;
    let bestMember: MemberContext | null = null;

    for (const m of members) {
      const score = scoreMemberMatch(m, target, normalizedTarget);
      if (score > bestScore) {
        bestScore = score;
        bestMember = m;
      }
    }

    if (bestMember && bestScore >= 40) {
      assigneeId = bestMember.uid;
    }
  }

  // Step A2: Check for member names or transliterations anywhere in prompt
  if (!assigneeId) {
    let bestScore = 0;
    let bestMember: MemberContext | null = null;

    for (const m of members) {
      const score = scoreMemberMatch(m, lower, normalizedPrompt);
      if (score > bestScore) {
        bestScore = score;
        bestMember = m;
      }
    }

    if (bestMember && bestScore >= 40) {
      assigneeId = bestMember.uid;
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

  // A. Priority stripping
  cleanTitle = cleanTitle.replace(/\s*(ب)?(اولويه|أولوية|أولويه|اولوية)\s*(عاليه|عالية|قصوى|متوسطة|متوسطه|منخفضة|منخفضه)/gi, '');
  cleanTitle = cleanTitle.replace(/\s*(high|medium|low)\s*priority/gi, '');

  // B. Due date stripping
  cleanTitle = cleanTitle.replace(/\s*(التسليم|موعد|تسليم)?\s*(السبت|الأحد|الاحد|الاثنين|الإثنين|الثلاثاء|الأربعاء|الاربعاء|الخميس|الجمعة|الجمعه|غداً|غدا|بكرة)\s*(الجاي|القادم)?/gi, '');
  cleanTitle = cleanTitle.replace(/\s*(بعد بكرة|بعد يومين|نهاية الأسبوع|نهاية الاسبوع|الأسبوع الجاي|الاسبوع الجاي|الاسبوع القادم|الأسبوع القادم)/gi, '');
  cleanTitle = cleanTitle.replace(/\s*بعد\s*[٠-٩\d]+\s*(أيام|ايام|يوم)/gi, '');
  cleanTitle = cleanTitle.replace(/\s*(tomorrow|next\s+week|after\s+tomorrow|weekend)/gi, '');

  // C. Explicit Assignee phrases stripping (e.g. "المكلف به منبر يوزر", "الـ المكلف به منبر يوزر", etc.)
  cleanTitle = cleanTitle.replace(
    /(?:الـ|ال)?\s*(?:المكلف\s+به|المكلف\s+بها|المكلف\s+هو|المكلف|المسند\s+إليه|المسند\s+له|المسؤول\s+عنه|المسؤول\s+عنها|مسؤولية|إسناد\s+إلى|اسناد\s+الى|تكليف|بواسطة|assigned\s+to|assign\s+to|assignee\s*:?)\s*:?\s*(?:منبر\s*يوزر|ممبر\s*يوزر|ميمبر\s*يوزر|مبر\s*يوزر|اونر\s*يوزر|أونر\s*يوزر|منبر|ممبر|ميمبر|مبر|اونر|أونر|\S+(?:\s+\S+)?)/gi,
    ''
  );

  // Strip transliterated names & known role mentions
  cleanTitle = cleanTitle.replace(
    /\s*(لـ|للـ|ل)?(منبر\s*يوزر|ممبر\s*يوزر|ميمبر\s*يوزر|مبر\s*يوزر|اونر\s*يوزر|أونر\s*يوزر|منبر|ممبر|ميمبر|مبر|اونر|أونر|المصمم|المطور|الـ\s*qa|backend|frontend)/gi,
    ''
  );

  // Strip any member display names and their phonetic variants
  for (const m of members) {
    if (m.displayName) {
      cleanTitle = cleanTitle.replace(new RegExp(`\\s*(لـ|للـ|ل|for)?\\s*${m.displayName}`, 'gi'), '');
      const variants = getPhoneticArabicVariants(m.displayName);
      for (const v of variants) {
        cleanTitle = cleanTitle.replace(new RegExp(`\\s*(لـ|للـ|ل|for)?\\s*${v}`, 'gi'), '');
      }
    }
  }

  // D. Command fillers & trailing punctuation
  cleanTitle = cleanTitle.replace(/^\s*(بدي\s+اعمل|مهمه|مهمة|قم\s+بعمل|يرجى\s+عمل|اضافة\s+مهمة|إضافة\s+مهمة)\s*/gi, '');
  cleanTitle = cleanTitle.replace(/\s*(مهمه|مهمة)\s*/gi, ' ');
  // Clean dangling prefixes like "الـ" or "-" or ":" at the end
  cleanTitle = cleanTitle.replace(/[\s\-_:،,]+(الـ|ال)?$/gi, '');
  cleanTitle = cleanTitle.replace(/^[\s\-_:،,]+/gi, '');
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
1. Title: extract a clean, concise, actionable task title (e.g. from "تحليل مشروع الخميس القادم الاولويه عاليه المكلف به منبر يوزر", output "تحليل مشروع"). Never include priority words, dates, or assignee phrasing ("المكلف به", "منبر يوزر") in the title!
2. Priority: "low" | "medium" | "high".
3. Due date: estimate date string YYYY-MM-DD if mentioned (today is ${new Date().toISOString().slice(0, 10)}), else null.
4. Assignee:
   - CRITICAL ARABIC TRANSLITERATION RULES:
     * When user speaks or dictates in Arabic speech-to-text, English names are transcribed phonetically:
       - "منبر يوزر" / "منبر" / "ممبر يوزر" / "ممبر" / "ميمبر" = "Member User"
       - "اونر يوزر" / "أونر يوزر" / "اونر" / "أونر" = "Owner User"
     * Match explicit assignee phrases such as "المكلف به [اسم]", "المكلف بها [اسم]", "المكلف [اسم]", "المسند إليه [اسم]", "لـ [اسم]", "assigned to [name]", etc.
     * Pick that member's UID!
   - If NO specific person is named or inferred, analyze the task domain/requirements and pick the member UID whose job role (or roles) is the most suitable match!
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
