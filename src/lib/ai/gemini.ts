// ============================================================================
// ZONE 1: IMPORTS
// ============================================================================
import { TaskPriority } from '@/types';

// ============================================================================
// ZONE 2: CONFIG & CONSTANTS
// ============================================================================
const GEMINI_MODELS = [
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-pro',
];

// ============================================================================
// ZONE 3: TYPES & INTERFACES
// ============================================================================
export interface MemberContext {
  uid: string;
  displayName: string;
  jobTitle: string;
  jobTitles?: string[];
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
      ? 'Generate all project titles, descriptions, task titles, and checklist items in fluent, professional, context-rich Arabic.'
      : 'Generate all project titles, descriptions, task titles, and checklist items in fluent, professional English.';

  return `You are Taskora AI, an executive project architect and intelligent software decomposition engine.
Your goal is to deeply analyze the user's specific idea and break it down into an exhaustive, highly specialized Work Breakdown Structure (WBS).

USER PROJECT IDEA:
"${prompt}"

ACTIVE TEAM ROSTER & ROLES:
${membersList || 'No team members provided yet.'}

${languageDirective}

DYNAMIC TASK DECOMPOSITION INSTRUCTIONS:
- Analyze the user's idea specifically. Do NOT generate generic or boilerplate tasks.
- If the project is about website testing, link inspection, or security scanning: generate explicit tasks for URL crawlers, SSL check, vulnerability detection (XSS/SQLi), performance metrics, background workers, interactive reports, and public APIs.
- If the project is an e-commerce platform: generate explicit tasks for product catalogs, cart, checkout, payment gateway webhooks, shipping tracker, and merchant portal.
- Tailor the task count dynamically to the true project scope (between 7 to 14 tasks).
- Each task MUST have 2 to 4 actionable checklist sub-steps describing concrete deliverables.
- Sequentially stagger "suggestedDueDaysFromNow" to reflect a realistic sprint schedule (e.g. 3, 5, 8, 12, 16...).

CRITICAL ROLE-BASED ASSIGNMENT INSTRUCTIONS:
- For each task, evaluate the ACTIVE TEAM ROSTER and assign it to the member whose "Job Title / Role" matches best:
  * Design, wireframes, user journeys, UI styling -> match with UI/UX Designer / Product Designer.
  * Databases, APIs, server architecture, cloud, security -> match with Backend Developer / System Architect.
  * Web components, interactive UI, responsive layouts -> match with Frontend Developer / Web Developer.
  * Quality assurance, end-to-end tests, security tests -> match with QA Engineer / Tester / Security.
  * Project milestones, documentation, release review -> match with Project Manager / Product Owner.
- If a member matches, set their exact UID in "assignedMemberUid".
- If no matching member role exists or the roster is empty, set "assignedMemberUid" to null.

OUTPUT FORMAT:
Return ONLY a valid raw JSON object matching this schema without markdown code blocks:
{
  "projectName": "Accurate, professional title reflecting the specific idea",
  "projectDescription": "Detailed overview of the system architecture and objectives",
  "tasks": [
    {
      "title": "Clear action-oriented task title specific to the domain",
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
// ZONE 5: DOMAIN-SPECIFIC SMART DECOMPOSITION ENGINE (DEEP LOCAL AI)
// ============================================================================
export function fallbackProjectGenerator(
  prompt: string,
  locale: 'ar' | 'en',
  members: MemberContext[]
): GeneratedProject {
  const isAr = locale === 'ar';
  const pLower = prompt.toLowerCase();

  // Find suitable team members by role keywords
  const designer = members.find((m) => /design|ui|ux|مصمم|تنسيق/i.test(m.jobTitle));
  const backend = members.find((m) => /backend|server|خلفي|بيانات|سيرفر|cloud|سحابي/i.test(m.jobTitle));
  const frontend = members.find((m) => /front|web|واجهات|مطور واجهات|react/i.test(m.jobTitle));
  const qa = members.find((m) => /qa|test|جودة|فاحص|اختبار|أمان|security/i.test(m.jobTitle));
  const pm = members.find((m) => /manager|owner|مدير|رئيس/i.test(m.jobTitle));

  const tasks: GeneratedTask[] = [];

  // Helper to construct a task with role assignment
  const addTask = (
    titleAr: string,
    titleEn: string,
    descAr: string,
    descEn: string,
    priority: TaskPriority,
    dueDays: number,
    preferredMember: MemberContext | undefined,
    checklistAr: string[],
    checklistEn: string[]
  ) => {
    const assigned = preferredMember || members[0] || null;
    tasks.push({
      title: isAr ? titleAr : titleEn,
      description: isAr ? descAr : descEn,
      priority,
      suggestedDueDaysFromNow: dueDays,
      assignedMemberUid: assigned?.uid || null,
      assignedMemberName: assigned?.displayName,
      assignedMemberRole: assigned?.jobTitle,
      checklist: isAr ? checklistAr : checklistEn,
    });
  };

  // 1. Detect Domain: Security, Link Inspection, Crawler & Website Testing
  const isSecurityOrTesting =
    /تست|سكيورتي|أمان|فحص|اختبار|ثغرات|رابط|روابط|security|test|audit|pentest|scanner|crawler|vulnerability|inspect/i.test(
      pLower
    );

  // 2. Detect Domain: E-Commerce & Retail
  const isEcommerce =
    /متجر|تسوق|شحن|دفع|سلة|منتج|منتجات|طلب|طلبات|store|shop|cart|payment|order|checkout|ecommerce/i.test(
      pLower
    );

  // 3. Detect Domain: SaaS, Management & Dashboards
  const isDashboardOrSaaS =
    /لوحة تحكم|إدارة|سيرفر|بيانات|crm|erp|saas|admin|dashboard|analytics|تحليلات/i.test(
      pLower
    );

  let detectedProjectName = '';
  let detectedProjectDesc = '';

  if (isSecurityOrTesting) {
    detectedProjectName = isAr
      ? 'منصة فحص أمان وأداء المواقع الإلكترونية بالروابط'
      : 'Automated Website Security & Performance Testing Platform';
    detectedProjectDesc = isAr
      ? 'منصة سحابية متقدمة تتيح للمستخدمين والمطورين فحص المواقع عبر الرابط، ورصد الثغرات الأمنية، واختبار سرعة الاستجابة، وتوليد تقارير أمان فورية.'
      : 'Comprehensive cloud platform for automated URL inspection, vulnerability scanning, security certificate verification, and executive audit reports.';

    addTask(
      'تطوير محرك الزحف الآلي وفحص استجابة الروابط (URL Crawler Engine)',
      'URL Crawler & Response Inspector Engine',
      'بناء خوارزمية الزحف على صفحات الموقع وفحص حالات استجابة HTTP وتتبع التحويلات وتحديد الروابط المعطوبة',
      'Build scalable crawler to map website paths, inspect HTTP status codes, and trace redirects',
      'high',
      3,
      backend,
      [
        'برمجة خوارزمية استكشاف الروابط الداخلية والخارجية',
        'فحص أكواد الاستجابة HTTP (200, 301, 404, 500)',
        'رصد الروابط المعطوبة وصفحات الخطأ المتكررة',
      ],
      ['Map internal and external URLs', 'Validate HTTP status codes', 'Detect broken links']
    );

    addTask(
      'فحص شهادات التشفير SSL/TLS وبروتوكولات الاتصال الآمن',
      'SSL/TLS Certificate & Cipher Suite Security Audit',
      'فحص تاريخ صلاحية شهادة الأمان، نوع التشفير، وقوة البروتوكول مع تنبيهات عند الاقتراب من الانتهاء',
      'Verify SSL validity, cipher suite strength, TLS protocols, and expiration countdowns',
      'high',
      5,
      backend || qa,
      [
        'التحقق من صحة سلسلة الشهادة وسلطة الإصدار CA',
        'فحص دعم بروتوكولات TLS 1.2 و TLS 1.3',
        'تحديد نقاط الضعف في خوارزميات التشفير القديمة',
      ],
      ['Verify certificate chain & issuer', 'Validate TLS 1.2/1.3 enforcement', 'Audit weak ciphers']
    );

    addTask(
      'برمجة كاشف ثغرات الويب الآلي (Web Vulnerability & Headers Scanner)',
      'Automated Vulnerability & Security Headers Scanner',
      'فحص وجود ترويسات الأمان (CSP, HSTS, X-Frame-Options) واختبار الحماية من هجمات XSS و CSRF',
      'Inspect security headers and audit protection against XSS, clickjacking, and CSRF vectors',
      'high',
      8,
      qa || backend,
      [
        'فحص ترويسات الأمان (HSTS, CSP, X-Frame-Options, CORS)',
        'رصد ثغرات حقن النصوص البرمجية الخبيثة XSS',
        'التحقق من حماية النماذج ضد هجمات تزوير الطلبات CSRF',
      ],
      ['Audit HTTP security headers', 'Test XSS injection resistance', 'Verify CSRF token protections']
    );

    addTask(
      'بناء خوارزمية قياس سرعة استجابة السيرفر وأداء صفحات الويب (Core Web Vitals)',
      'Performance Benchmarking & Core Web Vitals Analyzer',
      'قياس أوقات استجابة الخادم TTFB وسرعة تحميل المحتوى وفحص أحجام الموارد والملفات',
      'Benchmark server response times (TTFB), asset compression, and Core Web Vitals metrics',
      'medium',
      11,
      frontend || qa,
      [
        'قياس سرعة استجابة الخادم الأولية TTFB',
        'فحص أحجام الصور والملفات القابلة للضغط (Gzip/Brotli)',
        'حساب درجات الأداء وفق معايير Google Lighthouse',
      ],
      ['Measure TTFB and server response', 'Check asset compression & weights', 'Calculate performance scores']
    );

    addTask(
      'تطوير طابور المهام في الخلفية (Background Queue & Distributed Workers)',
      'Background Task Queue & Distributed Scanning Workers',
      'إدارة طوابير مهام الفحص المجدولة لمنع استنزاف الموارد ومتابعة نسبة تقدم الفحص اللحظية',
      'Build background job queue with concurrency limits, retry mechanisms, and live progress streaming',
      'high',
      14,
      backend,
      [
        'برمجة طابور المهام (Job Queue) والتحكم بمعدل الفحص',
        'بث نسبة تقدم الفحص في الوقت الفعلي عبر WebSockets',
        'معالجة حالات انقطاع الاتصال ومحاولات الإعادة الآلية',
      ],
      ['Implement background queue system', 'Stream real-time progress updates', 'Fault-tolerant retry logic']
    );

    addTask(
      'تصميم وبناء لوحة تقارير الفحص التفاعلية ودرجة الأمان (Security Dashboard)',
      'Interactive Security & Health Reporting Dashboard',
      'واجهة عصرية تعرض نتيجة الفحص، الرسم البياني للتقييم الأمني (A+ إلى F)، والتفاصيل حسب درجة الخطورة',
      'Visual interface displaying audit findings, vulnerability severities, and grade scores',
      'high',
      17,
      frontend || designer,
      [
        'تصميم مؤشرات درجات الأمان الملونة (Critical, High, Medium, Low)',
        'بناء رسوم بيانية توضح توزيع الثغرات ومستوى المخاطر',
        'تصفية نتائج الفحص حسب نوع المشكلة ومسار الصفحة',
      ],
      ['Design color-coded severity badges', 'Render vulnerability breakdown charts', 'Filter findings by category']
    );

    addTask(
      'نظام توليد وتصدير التقارير الرسمية التنفيذية (PDF & Excel Export)',
      'Executive & Technical PDF/Excel Report Generator',
      'توليد تقرير موثق يحتوي على خطوات الإصلاح البرمجية وتوصيات المعالجة للثغرات المرصودة',
      'Generate downloadable PDF & Excel reports with remediation steps and executive summaries',
      'medium',
      20,
      backend || frontend,
      [
        'تنسيق ملف الـ PDF التنفيذي مع شعار المنصة والتاريخ',
        'تضمين خطوات المعالجة البرمجية المقترحة لكل ثغرة',
        'إرسال إشعار وملخص التقرير بالبريد الإلكتروني للعميل',
      ],
      ['Format professional PDF document', 'Include actionable remediation guides', 'Deliver email report summary']
    );

    addTask(
      'برمجة واجهات الـ REST API والمفاتيح للمطورين (Developer API & CI/CD)',
      'Developer REST API & CI/CD Webhooks Integration',
      'إتاحة واجهات برمجية تسمح لفرق التطوير بفحص مواقعهم آلياً قبل كل عملية نشر',
      'Provide developer endpoints, API key authentication, rate-limiting, and webhook notifications',
      'medium',
      23,
      backend,
      [
        'برمجة مسارات الـ API الآمنة لفحص الروابط للمطورين',
        'إدارة مفاتيح الـ API وتحديد حدود الاستخدام (Rate Limiting)',
        'توفير وثائق تفاعلية لاستدعاء الواجهات عبر Swagger/OpenAPI',
      ],
      ['Build authenticated scan endpoints', 'Manage developer API keys & quotas', 'Provide OpenAPI documentation']
    );

    addTask(
      'اختبار دقة الكاشف الأمني وضبط الإنذارات الكاذبة (False Positives Tuning)',
      'Scanner Accuracy Tuning & False-Positive Calibration',
      'اختبار النظام على تطبيقات معيارية للتحقق من اكتشاف الثغرات الفعلية دون إزعاج المستخدم بتنبيهات خاطئة',
      'Benchmark scanner accuracy against standard test suites to minimize false positives',
      'medium',
      26,
      qa,
      [
        'إجراء اختبارات مقارنة على بيئات فحص قياسية',
        'معايرة قواعد الكشف لتقليل الإنذارات الكاذبة',
        'اختبار استقرار السيرفر تحت الضغط عند فحص مئات الروابط',
      ],
      ['Benchmark against test suites', 'Calibrate detection heuristics', 'Stress test server under high link load']
    );
  } else if (isEcommerce) {
    detectedProjectName = isAr ? 'متجر إلكتروني متكامل مع نظام دفع وشحن' : 'Enterprise E-Commerce Platform';
    detectedProjectDesc = isAr
      ? 'متجر إلكتروني متكامل يشمل كتالوج المنتجات، سلة المشتريات، بوابات الدفع، تتبع الشحنات، ولوحة تحكم التاجر.'
      : 'Full-stack e-commerce solution with product catalog, cart, multi-gateway payments, shipping logistics, and seller dashboard.';

    addTask(
      'تصميم كتالوج المنتجات وتصنيفات الأقسام والتصفية الذكية',
      'Product Catalog, Categories & Smart Filter Architecture',
      'تصميم نماذج بيانات المنتجات، خيارات الألوان والأحجام، ومحرك البحث السريع',
      'Architect product schemas, variant options, categories, and instant search',
      'high',
      3,
      designer || frontend,
      ['تحديد تصنيفات الأقسام والسمات', 'بناء مرشحات التصفية الذكية', 'واجهات استعراض المنتجات المسرعة'],
      ['Define category taxonomy', 'Build multi-facet filtering', 'Optimize catalog browsing UI']
    );

    addTask(
      'برمجة سلة المشتريات التفاعلية وإدارة المخزون اللحظي',
      'Interactive Shopping Cart & Real-Time Inventory Control',
      'إدارة عناصر السلة محلياً وسحابياً وحجز المنتجات مؤقتاً أثناء عملية الشراء',
      'Manage shopping cart state, session persistence, and real-time inventory reservation',
      'high',
      6,
      backend || frontend,
      ['مزامنة عناصر السلة عبر الجلسات', 'تأكيد توفر الكميات بالمستودع', 'تطبيق كوبونات الخصم وقواعد العروض'],
      ['Sync cart state across sessions', 'Validate live warehouse stock', 'Apply promo codes and discounts']
    );

    addTask(
      'تكامل بوابات الدفع الإلكتروني المعتمدة (Checkout & Payments)',
      'Payment Gateway Integration (Stripe, Apple Pay, Mada)',
      'ربط بوابات الدفع ومعالجة العمليات المالية الآمنة وإصدار الفواتير الرقمية',
      'Integrate payment providers, handle secure webhooks, and generate digital receipts',
      'high',
      10,
      backend,
      ['ربط الـ Webhooks لتأكيد عمليات الدفع', 'معالجة حالات الدفع الفاشلة وإعادة المحاولة', 'إصدار الفاتورة الرقمية بصيغة PDF'],
      ['Implement payment webhooks', 'Handle failed transactions gracefully', 'Generate PDF invoices']
    );

    addTask(
      'نظام إدارة وتتبع الشحنات والربط مع شركات النقل',
      'Shipping Logistics & Live Courier Tracking System',
      'حساب تكاليف الشحن تلقائياً وتوليد بوليصات الشحن وتتبع مسار الطرد',
      'Calculate dynamic shipping rates, generate shipping labels, and track delivery status',
      'high',
      14,
      backend,
      ['حساب تكلفة الشحن حسب الوزن والوجهة', 'توليد أرقام التتبع وبوليصة الشحن', 'تحديث حالة الشحنة لحظياً للعميل'],
      ['Dynamic rate calculation by weight/zone', 'Generate tracking numbers & labels', 'Live status updates for buyers']
    );

    addTask(
      'لوحة تحكم التاجر لإدارة الطلبات والتقارير المالية',
      'Merchant Administration & Orders Management Portal',
      'لوحة تحكم لإدارة ومتابعة الطلبات، تعديل أسعار المنتجات، ومتابعة الأرباح',
      'Admin portal for order fulfillment, inventory replenishment, and financial analytics',
      'medium',
      18,
      frontend || pm,
      ['جداول متابعة حالات الطلبات اليومية', 'تحديث كميات المخزون وتنبيهات النقص', 'إحصائيات المبيعات والأرباح الشهرية'],
      ['Order fulfillment workflow tables', 'Low stock alerts and updates', 'Monthly sales and revenue insights']
    );

    addTask(
      'فحص أمان المعاملات المالية ومعايير الامتثال (PCI-DSS Security Audit)',
      'E-Commerce Security & Payment Compliance Verification',
      'فحص أمان تدفق الدفع وتشفير بيانات المعاملات وحماية الجلسات ضد الاختراق',
      'Audit checkout security flow, encrypt sensitive tokens, and ensure compliance standards',
      'high',
      22,
      qa || backend,
      ['التحقق من عدم تخزين أي بيانات بطاقات مصرفية', 'فحص حماية الجلسات والمسارات المحمية', 'اختبار تجربة الدفع تحت الضغط العالي'],
      ['Ensure no raw card data stored', 'Validate session protection guards', 'Stress-test checkout pipeline']
    );
  } else if (isDashboardOrSaaS) {
    detectedProjectName = isAr ? 'لوحة تحكم وسحابة إدارة أعمال ذكية' : 'Enterprise SaaS & Operations Dashboard';
    detectedProjectDesc = isAr
      ? 'لوحة إدارة سحابية متقدمة تدعم إدارة الفريق، جداول البيانات التفاعلية، الصلاحيات، والتحليلات البيانية.'
      : 'Modern SaaS administration suite with role-based access, interactive data tables, metrics, and audit logging.';

    addTask(
      'بناء هيكل الصلاحيات والأدوار متعدد المستويات (RBAC Security)',
      'Multi-Tier Role-Based Access Control Architecture',
      'تحديد صلاحيات المدير، المشرف، والعضو العادي وحماية المسارات والعمليات',
      'Define granular roles and permissions, route guards, and operation authorization',
      'high',
      3,
      backend,
      ['تحديد مصفوفة الصلاحيات لكل دور', 'حماية مسارات الـ API بـ Middleware', 'تفعيل التحقق الثنائي 2FA للحسابات'],
      ['Define permission matrix per role', 'Protect API routes with middleware', 'Support two-factor authentication']
    );

    addTask(
      'تصميم الجداول التفاعلية المتقدمة مع التصفية والفرز (Data Grid)',
      'High-Performance Interactive Data Grid & Filters',
      'بناء جداول تدعم الفرز المتعدد، البحث اللحظي، التصفية المتقدمة، والتنقل السريع',
      'Build responsive data tables with multi-column sorting, live filtering, and pagination',
      'high',
      7,
      frontend,
      ['برمجة الفرز والتصفية اللحظية', 'دعم التمرير الافتراضي للبيانات الضخمة', 'تخصيص الأعمدة المعروضة وحفظ التفضيلات'],
      ['Live multi-sort and filtering', 'Virtual scrolling for heavy tables', 'Column customization and persistence']
    );

    addTask(
      'برمجة لوحة التحليلات والرسوم البيانية ومؤشرات الأداء (KPIs)',
      'Interactive Analytics & KPI Metrics Dashboard',
      'رسوم بيانية توضح معدلات النمو، استهلاك الموارد، والمهام المكتملة',
      'Interactive charts illustrating growth trends, resource metrics, and throughput',
      'medium',
      12,
      frontend || designer,
      ['رسوم بيانية تفاعلية للمؤشرات الرئيسية', 'تصفية البيانات حسب النطاق الزمني', 'حساب معدل التغيير والنسب المئوية'],
      ['Interactive charts for core metrics', 'Date-range filtering controls', 'Period-over-period percentage changes']
    );

    addTask(
      'تدفقات استيراد وتصدير البيانات السحابية (Excel & CSV Pipelines)',
      'Enterprise Data Import & Export Pipelines (Excel / CSV)',
      'تصدير التقارير بتنسيق احترافي واستيراد كميات ضخمة مع التحقق من صحة المدخلات',
      'Export formatted reports and import bulk datasets with schema validation and error reports',
      'medium',
      16,
      backend || frontend,
      ['تصدير جداول Excel مع تنسيق كامل للأعمدة', 'استيراد البيانات مع فحص الأخطاء قبل الحفظ', 'النسخ الاحتياطي الآلي لقاعدة البيانات'],
      ['Export styled Excel workbooks', 'Validate bulk imports before save', 'Automated data backup routines']
    );

    addTask(
      'سجل التدقيق الأمني وعمليات النظام (Audit Logs & Telemetry)',
      'Comprehensive Audit Trail & System Activity Logging',
      'تسجيل كافة تعديلات المستخدمين مع التاريخ، المعرف، وعنوان IP للتدقيق والامتثال',
      'Log user mutations with timestamp, actor UID, and IP for audit and compliance requirements',
      'medium',
      20,
      backend,
      ['تسجيل عمليات الإنشاء والتعديل والحذف', 'لوحة بحث سريعة في سجلات النشاط', 'تنبيهات عند العمليات الحساسة أو المشبوهة'],
      ['Record create/update/delete mutations', 'Searchable audit log interface', 'Alerts on sensitive operations']
    );
  } else {
    // Dynamic Custom Domain: Extract keywords directly from the prompt!
    const cleanPrompt = prompt.trim().slice(0, 45);
    detectedProjectName = isAr ? `مشروع: ${cleanPrompt}` : `Project: ${cleanPrompt}`;
    detectedProjectDesc = isAr
      ? `خطة عمل متكاملة وشاملة تم تفكيكها خصيصاً لتغطية كافة متطلبات (${cleanPrompt}) وتوزيعها على الفريق.`
      : `Complete, specialized work breakdown structure tailored for ${cleanPrompt} distributed across team roles.`;

    addTask(
      `دراسة متطلبات وهيكلة النظام لـ (${cleanPrompt})`,
      `System Requirements & Architecture for (${cleanPrompt})`,
      'تحليل السيناريوهات الأساسية للنظام ورسم مخطط تدفق البيانات واعتماد وثيقة المواصفات',
      'Analyze core user scenarios, map data flow, and approve technical specifications',
      'high',
      3,
      designer || pm,
      ['تحديد المتطلبات الوظيفية الرئيسية', 'رسم مخططات التدفق والنماذج السلكية', 'مراجعة واعتماد خطة العمل مع الفريق'],
      ['Define core functional specs', 'Draft user journeys and wireframes', 'Team review and approval']
    );

    addTask(
      'تصميم وبناء قواعد البيانات ونماذج الكيانات والعلاقات',
      'Database Schema & Entity Relationship Architecture',
      'إنشاء الجداول ونماذج الكيانات وقواعد أمان البيانات لضمان السرعة والاعتمادية',
      'Construct relational models, write validation rules, and establish indexes',
      'high',
      6,
      backend,
      ['إنشاء الجداول ونماذج البيانات الرئيسية', 'ضبط قواعد الأمان والصلاحيات', 'كتابة دوال التحقق Validation'],
      ['Create database tables & models', 'Configure security and access rules', 'Implement validation schemas']
    );

    addTask(
      'برمجة مسارات الـ API وخدمات معالجة البيانات المركزية',
      'Core Business Logic & Backend REST Services',
      'برمجة الخدمات الخلفية ومعالجة الطلبات مع إدارة قوية للأخطاء والاستجابة',
      'Develop backend endpoints with resilient error handling and fast query performance',
      'high',
      10,
      backend,
      ['برمجة نقاط الاتصال Endpoints الأساسية', 'معالجة حالات الخطأ وانقطاع الشبكة', 'توثيق واجهات الاستدعاء للمطورين'],
      ['Build core API endpoints', 'Handle error states and network drops', 'Document endpoint contracts']
    );

    addTask(
      'تطوير واجهات المستخدم التفاعلية والتجاوبية للأجهزة المختلفة',
      'Responsive Frontend Components & Interactive Screens',
      'بناء الصفحات والمكونات التفاعلية وضمان عملها بسلاسة على شاشات الجوال والحاسوب',
      'Construct responsive views, handle state updates, and ensure smooth touch interactions',
      'high',
      14,
      frontend || designer,
      ['تطوير الصفحات والمكونات الرئيسية', 'دعم التجاوب مع شاشات الجوال والحاسوب', 'التحقق من سلاسة تفاعل المستخدم'],
      ['Build primary pages & components', 'Mobile & desktop responsive layouts', 'Ensure smooth user interactions']
    );

    addTask(
      'تكامل الخدمات الخارجية والإشعارات اللحظية',
      'External Integrations & Real-Time Alerts',
      'ربط الخدمات الخارجية وتفعيل الإشعارات والتنبيهات المباشرة للمستخدمين',
      'Connect third-party webhooks, telemetry, and real-time push alerts',
      'medium',
      18,
      backend || frontend,
      ['ربط واجهات الخدمات والـ Webhooks', 'تفعيل الإشعارات الفورية للمستخدمين', 'اختبار تكامل الخدمات في بيئة معزولة'],
      ['Configure third-party APIs/webhooks', 'Enable live user notifications', 'Integration testing in sandbox']
    );

    addTask(
      'فحص الجودة وضمان الأمان واختبار حالات الحافة (QA & Security)',
      'Quality Assurance, Edge-Case & Security Testing',
      'إجراء اختبارات شاملة لتغطية الأخطاء المحتملة واختبار الأمان والتوافق',
      'Conduct comprehensive tests across browsers, security boundaries, and edge cases',
      'medium',
      22,
      qa,
      ['اختبار رحلة المستخدم الشاملة من البداية للنهاية', 'فحص الأمان والتحقق من عدم تسريب البيانات', 'رصد وإصلاح الثغرات وحالات الحافة'],
      ['End-to-end user journey tests', 'Security boundary and data leak audit', 'Detect and fix edge cases']
    );

    addTask(
      'إعداد بيئة الإنتاج والنشر النهائي وتوثيق التسليم',
      'Production Deployment, CI/CD Pipeline & Handover',
      'نشر المشروع على السيرفر وربط النطاق وتفعيل المراقبة والتحليلات',
      'Deploy to live infrastructure, configure custom domains, and enable monitoring',
      'low',
      26,
      pm || backend,
      ['إعداد بيئة الاستضافة وشهادة SSL', 'تفعيل أنظمة مراقبة الأخطاء والأداء', 'اعتماد خطة الإطلاق والتسليم مع المالك'],
      ['Hosting & SSL setup', 'Telemetry & error monitoring', 'Final stakeholder sign-off']
    );
  }

  return {
    projectName: detectedProjectName,
    projectDescription: detectedProjectDesc,
    tasks,
  };
}

// ============================================================================
// ZONE 6: API EXECUTOR WITH RESILIENT MODEL FALLBACK
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

  // Try available Gemini models sequentially
  for (const model of GEMINI_MODELS) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: promptText }],
            },
          ],
          generationConfig: {
            temperature: 0.35,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!response.ok) {
        console.warn(`Gemini model ${model} failed with status:`, response.status);
        continue;
      }

      const data = await response.json();
      const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!candidateText) {
        continue;
      }

      return parseGeminiProjectResponse(candidateText, members);
    } catch (err) {
      console.warn(`Gemini request to ${model} threw error:`, err);
    }
  }

  // If all live models failed, run the deep smart decomposition engine
  return fallbackProjectGenerator(prompt, locale, members);
}
