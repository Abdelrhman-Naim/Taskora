import { describe, it, expect } from 'vitest';
import { parseQuickTaskFallback } from '@/app/api/ai/quick-task/route';
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
      displayName: 'Hassan PM',
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

  it('parses user screenshot command with transliterated name, high priority, and next Saturday due date', () => {
    const prompt = 'تحليل مشروع مهمه لممبر يوزر اولويه عاليه التسليم السبت الجاي';
    const result = parseQuickTaskFallback(prompt, mockMembers);

    // 1. Assignee should match "Member User" via transliteration "لممبر يوزر"
    expect(result.assigneeId).toBe('u-member');

    // 2. Priority should be high
    expect(result.priority).toBe('high');

    // 3. Due date should be parsed for next Saturday
    expect(result.dueDate).not.toBeNull();
    const parsedDate = new Date(result.dueDate!);
    // Day of week 6 = Saturday
    expect(parsedDate.getDay()).toBe(6);

    // 4. Title should be cleaned and not contain priority or date command words
    expect(result.title).not.toContain('اولويه عاليه');
    expect(result.title).not.toContain('السبت الجاي');
    expect(result.title).toContain('تحليل مشروع');
  });

  it('assigns task to member with closest job title when no assignee name is present', () => {
    // A: Project analysis -> Project Manager
    const resPM = parseQuickTaskFallback('تحليل مشروع وتحديد متطلبات السبرنت أولوية عالية', mockMembers);
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
