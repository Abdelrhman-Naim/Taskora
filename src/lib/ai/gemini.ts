// ============================================================================
// ZONE 1: IMPORTS
// ============================================================================
import { TaskPriority } from '@/types';

// ============================================================================
// ZONE 2: CONFIG & CONSTANTS
// ============================================================================
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// ============================================================================
// ZONE 3: TYPES & INTERFACES
// ============================================================================
export interface MemberContext {
  uid: string;
  displayName: string;
  jobTitle: string;
}

export interface GeneratedTask {
  title: string;
  description: string;
  priority: TaskPriority;
  suggestedDueDaysFromNow: number;
  assignedMemberUid: string | null;
  assignedMemberName?: string;
  assignedMemberRole?: string;
  checklist: string[];
}

export interface GeneratedProject {
  projectName: string;
  projectDescription: string;
  tasks: GeneratedTask[];
}

// ============================================================================
// ZONE 4: PROMPT BUILDER & PARSER
// ============================================================================
export function buildGeminiProjectPrompt(
  prompt: string,
  locale: 'ar' | 'en',
  members: MemberContext[]
): string {
  const membersList = members
    .map((m) => `- UID: "${m.uid}", Name: "${m.displayName}", Job Title / Role: "${m.jobTitle}"`)
    .join('\n');

  const languageDirective =
    locale === 'ar'
      ? 'Generate all task titles, descriptions, and checklist items in fluent Arabic.'
      : 'Generate all task titles, descriptions, and checklist items in English.';

  return `You are Taskora AI, an executive project architect and task decomposition engine.
Your goal is to transform the user's project idea into a complete, professional Work Breakdown Structure (WBS).

USER PROJECT IDEA:
"${prompt}"

ACTIVE TEAM ROSTER & ROLES:
${membersList || 'No team members provided yet.'}

${languageDirective}

CRITICAL ROLE ASSIGNMENT INSTRUCTIONS:
- Analyze each task carefully.
- Automatically assign each task to the most appropriate team member from the roster based on their "Job Title / Role":
  * Design, wireframes, user flow, prototyping -> match with UI/UX Designer or Product Designer.
  * APIs, database, server, backend logic, security -> match with Backend Developer or Software Engineer.
  * Components, UI implementation, CSS, web views -> match with Frontend Developer.
  * Quality assurance, testing, bug hunts, test cases -> match with QA Engineer or Tester.
  * Project roadmaps, client reviews, documentation -> match with Project Manager.
- If no matching role is found or the roster is empty, set assignedMemberUid to null.

OUTPUT FORMAT:
Return ONLY a valid raw JSON object (without markdown blocks or wrapping quotes) matching this exact schema:
{
  "projectName": "Short, punchy executive project title",
  "projectDescription": "Clear 2-sentence description of the project objective",
  "tasks": [
    {
      "title": "Clear action-oriented task title",
      "description": "Specific deliverable description",
      "priority": "low" | "medium" | "high",
      "suggestedDueDaysFromNow": 3,
      "assignedMemberUid": "UID from roster or null",
      "checklist": ["Step 1", "Step 2", "Step 3"]
    }
  ]
}`;
}

export function parseGeminiProjectResponse(
  rawText: string,
  members: MemberContext[]
): GeneratedProject {
  // Strip potential markdown code fences
  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed: {
    projectName?: string;
    projectDescription?: string;
    tasks?: Array<{
      title?: string;
      description?: string;
      priority?: string;
      suggestedDueDaysFromNow?: number;
      assignedMemberUid?: string | null;
      checklist?: string[];
    }>;
  };

  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Failed to parse Gemini output as JSON');
  }

  const memberMap = new Map<string, MemberContext>();
  members.forEach((m) => memberMap.set(m.uid, m));

  const safeTasks: GeneratedTask[] = (parsed.tasks || []).map((t) => {
    let priority: TaskPriority = 'medium';
    if (t.priority === 'low' || t.priority === 'high' || t.priority === 'medium') {
      priority = t.priority;
    }

    const assignedUid =
      t.assignedMemberUid && memberMap.has(t.assignedMemberUid)
        ? t.assignedMemberUid
        : null;

    const matchedMember = assignedUid ? memberMap.get(assignedUid) : undefined;

    return {
      title: typeof t.title === 'string' ? t.title.trim() : 'New Task',
      description: typeof t.description === 'string' ? t.description.trim() : '',
      priority,
      suggestedDueDaysFromNow:
        typeof t.suggestedDueDaysFromNow === 'number' && t.suggestedDueDaysFromNow > 0
          ? t.suggestedDueDaysFromNow
          : 7,
      assignedMemberUid: assignedUid,
      assignedMemberName: matchedMember?.displayName,
      assignedMemberRole: matchedMember?.jobTitle,
      checklist: Array.isArray(t.checklist)
        ? t.checklist.filter((c) => typeof c === 'string')
        : [],
    };
  });

  return {
    projectName: parsed.projectName || 'New Project',
    projectDescription: parsed.projectDescription || '',
    tasks: safeTasks,
  };
}

// ============================================================================
// ZONE 5: FALLBACK GENERATOR (OFFLINE / NO API KEY)
// ============================================================================
export function fallbackProjectGenerator(
  prompt: string,
  locale: 'ar' | 'en',
  members: MemberContext[]
): GeneratedProject {
  const isAr = locale === 'ar';
  const designer = members.find((m) => /design|ui|ux|مصمم/i.test(m.jobTitle));
  const backend = members.find((m) => /backend|server|خلفي|بيانات/i.test(m.jobTitle));
  const frontend = members.find((m) => /front|web|واجهات/i.test(m.jobTitle));
  const qa = members.find((m) => /qa|test|جودة|فاحص/i.test(m.jobTitle));

  const tasks: GeneratedTask[] = isAr
    ? [
        {
          title: `تصميم تجربة المستخدم وواجهات ${prompt}`,
          description: 'تخطيط النماذج الأولية ورسم تدفق رحلة المستخدم مع متطلبات التصميم',
          priority: 'high',
          suggestedDueDaysFromNow: 4,
          assignedMemberUid: designer?.uid || members[0]?.uid || null,
          assignedMemberName: designer?.displayName || members[0]?.displayName,
          assignedMemberRole: designer?.jobTitle || members[0]?.jobTitle,
          checklist: ['رسم الهيكل السلكي (Wireframes)', 'اختيار نظام الألوان والخطوط', 'مراجعة التصميم مع المالك'],
        },
        {
          title: `تطوير قاعدة البيانات والواجهات البرمجية (APIs)`,
          description: 'إعداد نماذج البيانات وربط الـ endpoints مع التوثيق الكامل',
          priority: 'high',
          suggestedDueDaysFromNow: 7,
          assignedMemberUid: backend?.uid || members[1]?.uid || null,
          assignedMemberName: backend?.displayName || members[1]?.displayName,
          assignedMemberRole: backend?.jobTitle || members[1]?.jobTitle,
          checklist: ['بناء مخطط قاعدة البيانات', 'برمجة مسارات الـ API', 'فحص الأمان والتحقق من المدخلات'],
        },
        {
          title: `تطوير واجهات المستخدم التفاعلية`,
          description: 'بناء المكونات التفاعلية وربطها مع استجابات الواجهات الخلفية',
          priority: 'medium',
          suggestedDueDaysFromNow: 10,
          assignedMemberUid: frontend?.uid || members[0]?.uid || null,
          assignedMemberName: frontend?.displayName || members[0]?.displayName,
          assignedMemberRole: frontend?.jobTitle || members[0]?.jobTitle,
          checklist: ['تطوير الصفحات الرئيسية', 'دعم الأجهزة والشاشات المختلفة', 'التحقق من تفاعل المستخدم'],
        },
        {
          title: `فحص الجودة وضمان الجاهزية للإطلاق`,
          description: 'تنفيذ اختبارات شاملة واختبار الأداء وسيناريوهات الاستخدام الواقعية',
          priority: 'medium',
          suggestedDueDaysFromNow: 14,
          assignedMemberUid: qa?.uid || members[2]?.uid || null,
          assignedMemberName: qa?.displayName || members[2]?.displayName,
          assignedMemberRole: qa?.jobTitle || members[2]?.jobTitle,
          checklist: ['اختبار سيناريوهات المستخدم', 'فحص الأداء والتوافق', 'اعتماد النسخة النهائية'],
        },
      ]
    : [
        {
          title: `UI/UX Research & Wireframes for ${prompt}`,
          description: 'Map user journey flows and design responsive high-fidelity layouts',
          priority: 'high',
          suggestedDueDaysFromNow: 4,
          assignedMemberUid: designer?.uid || members[0]?.uid || null,
          assignedMemberName: designer?.displayName || members[0]?.displayName,
          assignedMemberRole: designer?.jobTitle || members[0]?.jobTitle,
          checklist: ['Initial wireframes', 'Design tokens & components', 'Design review'],
        },
        {
          title: `Backend Schema & API Implementation`,
          description: 'Construct data models, validation endpoints, and security rules',
          priority: 'high',
          suggestedDueDaysFromNow: 7,
          assignedMemberUid: backend?.uid || members[1]?.uid || null,
          assignedMemberName: backend?.displayName || members[1]?.displayName,
          assignedMemberRole: backend?.jobTitle || members[1]?.jobTitle,
          checklist: ['Database schema definition', 'REST/Server endpoints', 'Security validation'],
        },
        {
          title: `Frontend Interface Integration`,
          description: 'Build responsive client screens and integrate with live APIs',
          priority: 'medium',
          suggestedDueDaysFromNow: 10,
          assignedMemberUid: frontend?.uid || members[0]?.uid || null,
          assignedMemberName: frontend?.displayName || members[0]?.displayName,
          assignedMemberRole: frontend?.jobTitle || members[0]?.jobTitle,
          checklist: ['Core view components', 'Responsive testing', 'Interactive states'],
        },
        {
          title: `QA Audit & Release Verification`,
          description: 'Perform end-to-end verification, edge case testing, and audit report',
          priority: 'medium',
          suggestedDueDaysFromNow: 14,
          assignedMemberUid: qa?.uid || members[2]?.uid || null,
          assignedMemberName: qa?.displayName || members[2]?.displayName,
          assignedMemberRole: qa?.jobTitle || members[2]?.jobTitle,
          checklist: ['End-to-end test scenarios', 'Accessibility & performance check', 'Sign-off'],
        },
      ];

  return {
    projectName: isAr ? `مشروع: ${prompt.slice(0, 50)}` : `Project: ${prompt.slice(0, 50)}`,
    projectDescription: isAr
      ? `خطة عمل متكاملة تم تفكيكها وتوزيع مهامها على أعضاء الفريق وفق مسمياتهم الوظيفية.`
      : `Complete work breakdown structure automatically distributed across team members according to their job roles.`,
    tasks,
  };
}

// ============================================================================
// ZONE 6: API EXECUTOR
// ============================================================================
export async function generateProjectWithGemini(
  prompt: string,
  locale: 'ar' | 'en',
  members: MemberContext[]
): Promise<GeneratedProject> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return fallbackProjectGenerator(prompt, locale, members);
  }

  const promptText = buildGeminiProjectPrompt(prompt, locale, members);

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: promptText }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      console.warn('Gemini API returned error status:', response.status);
      return fallbackProjectGenerator(prompt, locale, members);
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      return fallbackProjectGenerator(prompt, locale, members);
    }

    return parseGeminiProjectResponse(candidateText, members);
  } catch (err) {
    console.warn('Gemini request failed, using intelligent fallback:', err);
    return fallbackProjectGenerator(prompt, locale, members);
  }
}
