import { describe, it, expect } from 'vitest';
import { parseQuickTaskFallback, getPhoneticArabicVariants } from '@/app/api/ai/quick-task/route';
import { MemberContext } from '@/lib/ai/gemini';

describe('Magic Quick-Task NLP Parser', () => {
  const mockMembers: MemberContext[] = [
    {
      uid: 'u-member',
      displayName: 'Member User',
      jobTitle: 'QA Engineer',
      jobTitles: ['QA Engineer'],
    },
    {
      uid: 'u-designer',
      displayName: 'Sarah Designer',
      jobTitle: 'UI/UX Designer',
      jobTitles: ['UI/UX Designer'],
    },
    {
      uid: 'u-backend',
      displayName: 'Tariq Backend',
      jobTitle: 'Backend Developer',
      jobTitles: ['Backend Developer'],
    },
    {
      uid: 'u-pm',
      displayName: 'Owner User',
      jobTitle: 'Project Manager',
      jobTitles: ['Project Manager'],
    },
    {
      uid: 'u-multi',
      displayName: 'Dana Hybrid',
      jobTitle: 'Frontend Developer, DevOps Specialist',
      jobTitles: ['Frontend Developer', 'DevOps Specialist'],
    },
  ];

  it('parses user screenshot command with Arabic voice transliteration (منبر يوزر), high priority, and next Thursday due date', () => {
    // Exact user screenshot command
    const prompt = 'تحليل مشروع الخميس القادم الاولويه عاليه المكلف به منبر يوزر';
    const result = parseQuickTaskFallback(prompt, mockMembers);

    // 1. Assignee should match "Member User" via speech-to-text transliteration "منبر يوزر"
    expect(result.assigneeId).toBe('u-member');

    // 2. Priority should be high
    expect(result.priority).toBe('high');

    // 3. Due date should be parsed for next Thursday
    expect(result.dueDate).not.toBeNull();
    const parsedDate = new Date(result.dueDate!);
    expect(parsedDate.getDay()).toBe(4); // 4 = Thursday

    // 4. Title should be completely cleaned from assignee phrasing, dates, and priorities
    expect(result.title).not.toContain('المكلف به');
    expect(result.title).not.toContain('منبر');
    expect(result.title).not.toContain('يوزر');
    expect(result.title).not.toContain('اولويه');
    expect(result.title).not.toContain('الخميس');
    expect(result.title).toBe('تحليل مشروع');
  });

  it('cleans titles with prefix "الـ المكلف به" and handles middle-of-sentence assignee phrases', () => {
    const prompt = 'تحليل مشروع الـ المكلف به منبر يوزر اولويه عاليه الخميس القادم';
    const result = parseQuickTaskFallback(prompt, mockMembers);

    expect(result.assigneeId).toBe('u-member');
    expect(result.priority).toBe('high');
    expect(result.title).toBe('تحليل مشروع');
  });

  it('handles variations of Arabic voice transliteration (منبر, ممبر, ميمبر, اونر)', () => {
    // Variation 1: "المسند إليه منبر"
    const res1 = parseQuickTaskFallback('تصميم واجهة الدفع المسند إليه منبر', mockMembers);
    expect(res1.assigneeId).toBe('u-member');
    expect(res1.title).toBe('تصميم واجهة الدفع');

    // Variation 2: "المكلف به ممبر يوزر"
    const res2 = parseQuickTaskFallback('إعداد واجهة المستخدم المكلف به ممبر يوزر أولوية عالية', mockMembers);
    expect(res2.assigneeId).toBe('u-member');
    expect(res2.priority).toBe('high');
    expect(res2.title).toBe('إعداد واجهة المستخدم');

    // Variation 2b: "مهمه لممبر يوزر اولويه عاليه التسليم السبت الجاي" (User's exact command)
    const exactRoster: MemberContext[] = [
      { uid: 'u-user', displayName: 'User', jobTitle: 'Full Stack' },
      { uid: 'u-mem', displayName: 'Member', jobTitle: 'Frontend' },
      { uid: 'u-owner', displayName: 'Owner User', jobTitle: 'Project Manager' },
      { uid: 'u-member-user', displayName: 'Member User', jobTitle: 'Team Member' },
    ];
    const resExact = parseQuickTaskFallback('تحليل مشروع مهمه لممبر يوزر اولويه عاليه التسليم السبت الجاي', exactRoster);
    expect(resExact.assigneeId).toBe('u-member-user');
    expect(resExact.priority).toBe('high');
    expect(resExact.title).toBe('تحليل مشروع');
    expect(resExact.dueDate).not.toBeNull();
    const dSat = new Date(resExact.dueDate!);
    expect(dSat.getDay()).toBe(6); // Saturday

    // Variation 3: "المكلف هو اونر يوزر"
    const res3 = parseQuickTaskFallback('مراجعة خطة الإطلاق المكلف هو اونر يوزر', mockMembers);
    expect(res3.assigneeId).toBe('u-pm');
    expect(res3.title).toBe('مراجعة خطة الإطلاق');
  });

  it('generates phonetic Arabic variants for Latin names correctly', () => {
    const memberVariants = getPhoneticArabicVariants('Member User');
    expect(memberVariants).toContain('منبر يوزر');
    expect(memberVariants).toContain('ممبر يوزر');
    expect(memberVariants).toContain('منبر');

    const ownerVariants = getPhoneticArabicVariants('Owner User');
    expect(ownerVariants).toContain('اونر يوزر');
    expect(ownerVariants).toContain('اونر');
  });

  it('assigns task to member with closest job title when no assignee name is present', () => {
    // A: Project analysis -> Project Manager (Owner User)
    const resPM = parseQuickTaskFallback('تحليل متطلبات السبرنت والمواصفات أولوية عالية', mockMembers);
    expect(resPM.assigneeId).toBe('u-pm');

    // B: Security and vulnerability testing -> QA Engineer
    const resQA = parseQuickTaskFallback('فحص ثغرات تسجيل الدخول واختبار الأمان غداً', mockMembers);
    expect(resQA.assigneeId).toBe('u-member'); // QA Engineer

    // C: UI & Figma -> Designer
    const resDesign = parseQuickTaskFallback('تصميم واجهة الدفع وتنسيق الألوان بالفيجما', mockMembers);
    expect(resDesign.assigneeId).toBe('u-designer'); // UI/UX Designer

    // D: Server / Database -> Backend
    const resBackend = parseQuickTaskFallback('تجهيز قاعدة البيانات ومسارات الـ API للطلبات', mockMembers);
    expect(resBackend.assigneeId).toBe('u-backend');
  });

  it('matches member who has multiple job titles for either role', () => {
    // Dana has both Frontend Developer and DevOps Specialist
    const resDocker = parseQuickTaskFallback('إعداد حاويات Docker وسيرفر النشر السحابي', mockMembers);
    expect(resDocker.assigneeId).toBe('u-multi');

    const resFrontend = parseQuickTaskFallback('تطوير مكونات الواجهة التفاعلية بأزرار البحث', mockMembers);
    expect(resFrontend.assigneeId).toBe('u-multi');
  });

  it('supports various Arabic days and relative dates', () => {
    const resTomorrow = parseQuickTaskFallback('مهمة عاجلة غداً أولوية قصوى', mockMembers);
    expect(resTomorrow.priority).toBe('high');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(resTomorrow.dueDate).toBe(tomorrow.toISOString().slice(0, 10));

    const resThursday = parseQuickTaskFallback('مراجعة التصاميم التسليم الخميس القادم', mockMembers);
    expect(resThursday.dueDate).not.toBeNull();
    const dThursday = new Date(resThursday.dueDate!);
    expect(dThursday.getDay()).toBe(4); // 4 = Thursday
  });
});
