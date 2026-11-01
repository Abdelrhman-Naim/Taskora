// ============================================================================
// ZONE 1: IMPORTS
// ============================================================================
import { TaskPriority } from '@/types';

// ============================================================================
// ZONE 2: CONFIG & CONSTANTS
// ============================================================================
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

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
      ? 'Generate all task titles, descriptions, and checklist items in fluent, professional Arabic.'
      : 'Generate all task titles, descriptions, and checklist items in clear English.';

  return `You are Taskora AI, an executive project architect and intelligent task decomposition engine.
Your goal is to deeply analyze the user's project idea and break it down into an exhaustive, realistic, and production-ready Work Breakdown Structure (WBS).

USER PROJECT IDEA:
"${prompt}"

ACTIVE TEAM ROSTER & ROLES:
${membersList || 'No team members provided yet.'}

${languageDirective}

DYNAMIC TASK DECOMPOSITION INSTRUCTIONS:
- Analyze the user's project idea comprehensively.
- DO NOT constrain yourself to a fixed count of tasks. Generate as many distinct, high-impact tasks as the scope naturally requires (typically between 5 to 14 tasks depending on complexity) covering all relevant lifecycle phases:
  1. Discovery, UX Research & Interactive Prototypes.
  2. Data Modeling, Database Architecture & Storage.
  3. Security, Authentication & Role-Based Access Controls.
  4. Core REST/Server API Endpoints & Business Logic.
  5. Responsive Frontend Pages, Components & UI States.
  6. Integrations (e.g., Payment gateways, Shipping APIs, Notifications, External SDKs).
  7. Administrative Panels & Reporting.
  8. Automated Testing, QA Assurance & Edge Case Validation.
  9. DevOps, Deployment & Performance Optimization.
- Each task MUST have 2 to 4 actionable checklist sub-steps.
- Stagger "suggestedDueDaysFromNow" sequentially to represent a realistic sprint timeline.

CRITICAL ROLE-BASED ASSIGNMENT INSTRUCTIONS:
- For each task, evaluate the ACTIVE TEAM ROSTER and assign it to the member whose "Job Title / Role" matches best:
  * Design, wireframes, user journeys, UI styling -> match with UI/UX Designer / Product Designer.
  * Databases, APIs, server architecture, cloud, security -> match with Backend Developer / System Architect.
  * Web components, interactive UI, responsive layouts -> match with Frontend Developer / Web Developer.
  * Quality assurance, end-to-end tests, bug audits -> match with QA Engineer / Tester.
  * Project milestones, documentation, release review -> match with Project Manager / Product Owner.
- If a member matches, put their exact UID in "assignedMemberUid".
- If no matching member role exists or the roster is empty, set "assignedMemberUid" to null.

OUTPUT FORMAT:
Return ONLY a valid raw JSON object matching this schema without markdown code blocks:
{
  "projectName": "Professional executive project title",
  "projectDescription": "Concise summary of project goals and scope",
  "tasks": [
    {
      "title": "Clear action-oriented task title",
      "description": "Specific deliverable description",
      "priority": "low" | "medium" | "high",
      "suggestedDueDaysFromNow": 3,
      "assignedMemberUid": "UID from roster or null",
      "checklist": ["Sub-task 1", "Sub-task 2", "Sub-task 3"]
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
      title: t.title || 'Untitled Task',
      description: t.description || '',
      priority,
      suggestedDueDaysFromNow:
        typeof t.suggestedDueDaysFromNow === 'number' && t.suggestedDueDaysFromNow > 0
          ? t.suggestedDueDaysFromNow
          : 5,
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
// ZONE 5: DYNAMIC FALLBACK GENERATOR (OFFLINE / SMART KEYWORD ANALYZER)
// ============================================================================
export function fallbackProjectGenerator(
  prompt: string,
  locale: 'ar' | 'en',
  members: MemberContext[]
): GeneratedProject {
  const isAr = locale === 'ar';
  const pLower = prompt.toLowerCase();

  const designer = members.find((m) => /design|ui|ux|مصمم|تنسيق/i.test(m.jobTitle));
  const backend = members.find((m) => /backend|server|خلفي|بيانات|سيرفر/i.test(m.jobTitle));
  const frontend = members.find((m) => /front|web|واجهات|مطور واجهات/i.test(m.jobTitle));
  const qa = members.find((m) => /qa|test|جودة|فاحص|اختبار/i.test(m.jobTitle));
  const pm = members.find((m) => /manager|owner|مدير|رئيس/i.test(m.jobTitle));

  const hasEcommerce = /متجر|تجارة|دفع|شحن|سلة|منتج|store|shop|cart|payment|order/i.test(pLower);
  const hasAuth = /تسجيل|دخول|أمان|مستخدمين|صلاحيات|auth|login|security|rbac/i.test(pLower);
  const hasAI = /ذكاء|ai|بوت|توليد|تحليل|gemini|llm|voice|صوت/i.test(pLower);

  const tasks: GeneratedTask[] = [];

  // Phase 1: Planning & Design
  tasks.push({
    title: isAr
      ? `دراسة متطلبات وهيكلة تجربة المستخدم (${prompt.slice(0, 35)})`
      : `UX Architecture & Wireframes for ${prompt.slice(0, 35)}`,
    description: isAr
      ? 'رسم مخططات تدفق المستخدم وتحديد متطلبات التصميم والواجهات الرئيسية'
      : 'Map user journey flows and design high-fidelity responsive wireframes',
    priority: 'high',
    suggestedDueDaysFromNow: 3,
    assignedMemberUid: designer?.uid || members[0]?.uid || null,
    assignedMemberName: designer?.displayName || members[0]?.displayName,
    assignedMemberRole: designer?.jobTitle || members[0]?.jobTitle,
    checklist: isAr
      ? ['تحديد مسارات المستخدم الأساسية', 'بناء نماذج الهيكل السلكي (Wireframes)', 'مراجعة المخططات واعتمادها']
      : ['Define core user flows', 'Construct wireframe prototypes', 'Design review & signoff'],
  });

  // Phase 2: Database & Architecture
  tasks.push({
    title: isAr
      ? 'تصميم وبناء مخطط قاعدة البيانات ونماذج الكيانات'
      : 'Database Schema & Data Model Architecture',
    description: isAr
      ? 'إنشاء الجداول ونماذج البيانات وقواعد الأمان لضمان سلامة العمليات'
      : 'Define relational/document schemas, indexes, and write validation rules',
    priority: 'high',
    suggestedDueDaysFromNow: 6,
    assignedMemberUid: backend?.uid || members[1]?.uid || members[0]?.uid || null,
    assignedMemberName: backend?.displayName || members[1]?.displayName || members[0]?.displayName,
    assignedMemberRole: backend?.jobTitle || members[1]?.jobTitle || members[0]?.jobTitle,
    checklist: isAr
      ? ['إعداد مخطط العلاقات وجداول النظام', 'ضبط قواعد أمان البيانات', 'كتابة دوال التحقق Validation']
      : ['Define relational tables/collections', 'Setup security rules', 'Validation schemas'],
  });

  // Phase 3: Auth & Security (if applicable or standard)
  if (hasAuth || hasEcommerce) {
    tasks.push({
      title: isAr
        ? 'بناء نظام المصادقة والصلاحيات وإدارة الحسابات'
        : 'Authentication & Role-Based Access Control',
      description: isAr
        ? 'تنفيذ تسجيل الدخول، حماية المسارات، وإدارة أدوار المستخدمين'
        : 'Implement secure login, session tokens, and route authorization guards',
      priority: 'high',
      suggestedDueDaysFromNow: 8,
      assignedMemberUid: backend?.uid || frontend?.uid || members[0]?.uid || null,
      assignedMemberName: backend?.displayName || frontend?.displayName || members[0]?.displayName,
      assignedMemberRole: backend?.jobTitle || frontend?.jobTitle || members[0]?.jobTitle,
      checklist: isAr
        ? ['شاشات تسجيل الدخول واستعادة الحساب', 'حماية مسارات الـ API', 'إدارة جلسات العمل والصلاحيات']
        : ['Auth forms & recovery flow', 'API route protection', 'Role-based guards'],
    });
  }

  // Phase 4: Core APIs
  tasks.push({
    title: isAr
      ? 'برمجة مسارات الـ API والخدمات الخلفية الرئيسية'
      : 'Core Backend REST/Server API Endpoints',
    description: isAr
      ? 'برمجة ومعالجة الطلبات وإرجاع البيانات مع معالجة الأخطاء'
      : 'Implement core endpoints with structured responses and error resilience',
    priority: 'high',
    suggestedDueDaysFromNow: 11,
    assignedMemberUid: backend?.uid || members[1]?.uid || null,
    assignedMemberName: backend?.displayName || members[1]?.displayName,
    assignedMemberRole: backend?.jobTitle || members[1]?.jobTitle,
    checklist: isAr
      ? ['برمجة الـ Endpoints الأساسية', 'معالجة حالات الخطأ والشبكة', 'توثيق واجهات الاستدعاء']
      : ['Implement primary endpoints', 'Error handling middleware', 'API documentation'],
  });

  // Phase 5: Specialized Features (E-Commerce or AI)
  if (hasEcommerce) {
    tasks.push({
      title: isAr
        ? 'تكامل بوابات الدفع الإلكتروني ونظام الشحن وتتبع الطلبات'
        : 'Payment Gateway Integration & Order Tracking',
      description: isAr
        ? 'ربط بوابة الدفع ومعالجة الفواتير وحالات الطلب اللحظية'
        : 'Integrate checkout provider, invoice generation, and status webhooks',
      priority: 'high',
      suggestedDueDaysFromNow: 14,
      assignedMemberUid: backend?.uid || members[0]?.uid || null,
      assignedMemberName: backend?.displayName || members[0]?.displayName,
      assignedMemberRole: backend?.jobTitle || members[0]?.jobTitle,
      checklist: isAr
        ? ['ربط الـ Webhooks مع بوابة الدفع', 'إدارة سلة الشراء ومراحل الدفع', 'توليد إشعارات الفواتير']
        : ['Payment webhook listener', 'Checkout flow & cart state', 'Invoice generation'],
    });
  }

  if (hasAI) {
    tasks.push({
      title: isAr
        ? 'تكامل محرك الذكاء الاصطناعي ومعالجة المدخلات'
        : 'AI Pipeline & Generative Integration',
      description: isAr
        ? 'ربط نماذج الذكاء الاصطناعي، هندسة الأوامر (Prompts)، ومعالجة الاستجابات'
        : 'Connect AI models, optimize prompt templates, and stream responses',
      priority: 'high',
      suggestedDueDaysFromNow: 14,
      assignedMemberUid: backend?.uid || frontend?.uid || null,
      assignedMemberName: backend?.displayName || frontend?.displayName,
      assignedMemberRole: backend?.jobTitle || frontend?.jobTitle,
      checklist: isAr
        ? ['إعداد Prompt التوليد المنظم', 'معالجة حالات انقطاع الـ API', 'تحسين سرعة الاستجابة']
        : ['Structured prompt engineering', 'API error fallbacks', 'Response streaming'],
    });
  }

  // Phase 6: Frontend Pages & Components
  tasks.push({
    title: isAr
      ? 'تطوير صفحات وواجهات المستخدم التفاعلية المتجاوبة'
      : 'Interactive Frontend Pages & Client Views',
    description: isAr
      ? 'بناء الشاشات الرئيسية وربطها مع استجابات الـ APIs مع دعم الشاشات المختلفة'
      : 'Build responsive views, loading skeletons, and interactive state bindings',
    priority: 'medium',
    suggestedDueDaysFromNow: 17,
    assignedMemberUid: frontend?.uid || members[0]?.uid || null,
    assignedMemberName: frontend?.displayName || members[0]?.displayName,
    assignedMemberRole: frontend?.jobTitle || members[0]?.jobTitle,
    checklist: isAr
      ? ['بناء الصفحات والمكونات التفاعلية', 'ربط الشاشات بالبيانات اللحظية', 'دعم الشاشات والهواتف (Mobile-First)']
      : ['Build UI components & pages', 'Real-time data binding', 'Responsive mobile layout'],
  });

  // Phase 7: Quality Assurance & Testing
  tasks.push({
    title: isAr
      ? 'تنفيذ اختبارات الجودة وضمان معايير الأداء والأمان'
      : 'Quality Assurance, E2E Testing & Performance Audit',
    description: isAr
      ? 'إجراء اختبارات شاملة لكافة السيناريوهات والتحقق من توافق المتصفحات'
      : 'Conduct comprehensive end-to-end tests, edge cases, and accessibility audits',
    priority: 'medium',
    suggestedDueDaysFromNow: 21,
    assignedMemberUid: qa?.uid || members[2]?.uid || members[0]?.uid || null,
    assignedMemberName: qa?.displayName || members[2]?.displayName || members[0]?.displayName,
    assignedMemberRole: qa?.jobTitle || members[2]?.jobTitle || members[0]?.jobTitle,
    checklist: isAr
      ? ['اختبار تدفق رحلة المستخدم الكاملة', 'فحص الأداء والتوافق مع المتصفحات', 'رصد وإصلاح الثغرات وحالات الحافة']
      : ['Full user journey test', 'Cross-browser validation', 'Edge case & load verification'],
  });

  // Phase 8: Deployment & Launch
  tasks.push({
    title: isAr
      ? 'إعداد بيئة الإنتاج والنشر النهائي وتوثيق التسليم'
      : 'Production Deployment, CI/CD Pipeline & Handover',
    description: isAr
      ? 'نشر المشروع على السيرفر وربط النطاق وتفعيل المراقبة والتحليلات'
      : 'Deploy to live infrastructure, configure custom domains, and enable monitoring',
    priority: 'low',
    suggestedDueDaysFromNow: 25,
    assignedMemberUid: pm?.uid || backend?.uid || members[0]?.uid || null,
    assignedMemberName: pm?.displayName || backend?.displayName || members[0]?.displayName,
    assignedMemberRole: pm?.jobTitle || backend?.jobTitle || members[0]?.jobTitle,
    checklist: isAr
      ? ['إعداد بيئة الاستضافة وشهادة SSL', 'تفعيل أنظمة مراقبة الأخطاء', 'اعتماد خطة الإطلاق مع المالك']
      : ['Hosting & SSL configuration', 'Error tracking & telemetry', 'Final stakeholder sign-off'],
  });

  return {
    projectName: isAr ? `مشروع: ${prompt.slice(0, 50)}` : `Project: ${prompt.slice(0, 50)}`,
    projectDescription: isAr
      ? `خطة عمل متكاملة وشاملة تم تفكيكها وتوزيع مهامها على أعضاء الفريق وفق مسمياتهم الوظيفية.`
      : `Comprehensive work breakdown structure dynamically distributed across team members according to their job roles.`,
    tasks,
  };
}

// ============================================================================
// ZONE 6: API EXECUTOR
// ============================================================================
export async function generateProjectWithGemini(
  prompt: string,
  locale: 'ar' | 'en',
  members: MemberContext[],
  overrideApiKey?: string
): Promise<GeneratedProject> {
  const apiKey = overrideApiKey || process.env.GEMINI_API_KEY;

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
