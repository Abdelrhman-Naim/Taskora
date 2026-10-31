import { describe, it, expect } from 'vitest';
import {
  buildGeminiProjectPrompt,
  parseGeminiProjectResponse,
  fallbackProjectGenerator,
  GeneratedTask,
} from '@/lib/ai/gemini';

describe('Gemini Project Generator logic', () => {
  const mockMembers = [
    { uid: 'u1', displayName: 'Ahmed Designer', jobTitle: 'UI/UX Designer' },
    { uid: 'u2', displayName: 'Sarah Backend', jobTitle: 'Backend Developer' },
    { uid: 'u3', displayName: 'Khaled QA', jobTitle: 'QA Engineer' },
  ];

  it('buildGeminiProjectPrompt includes members and their job titles', () => {
    const prompt = buildGeminiProjectPrompt(
      'تطوير متجر إلكتروني متكامل',
      'ar',
      mockMembers
    );

    expect(prompt).toContain('تطوير متجر إلكتروني متكامل');
    expect(prompt).toContain('UI/UX Designer');
    expect(prompt).toContain('Backend Developer');
    expect(prompt).toContain('QA Engineer');
  });

  it('parseGeminiProjectResponse validates and sanitizes raw JSON structure', () => {
    const rawJson = JSON.stringify({
      projectName: 'E-Shop Platform',
      projectDescription: 'Full e-commerce store with payments and cart',
      tasks: [
        {
          title: 'Design Checkout Wireframes',
          description: 'Create responsive high-fidelity wireframes',
          priority: 'high',
          suggestedDueDaysFromNow: 5,
          assignedMemberUid: 'u1',
          checklist: ['Cart layout', 'Payment step', 'Success page'],
        },
        {
          title: 'Implement Payment Gateway Webhook',
          description: 'Secure webhook listener for Stripe',
          priority: 'high',
          suggestedDueDaysFromNow: 8,
          assignedMemberUid: 'u2',
          checklist: ['Stripe signature verification', 'Firestore transaction'],
        },
      ],
    });

    const parsed = parseGeminiProjectResponse(rawJson, mockMembers);
    expect(parsed.projectName).toBe('E-Shop Platform');
    expect(parsed.tasks.length).toBe(2);
    expect(parsed.tasks[0].assignedMemberUid).toBe('u1');
    expect(parsed.tasks[1].assignedMemberUid).toBe('u2');
  });

  it('fallbackProjectGenerator produces sensible role-assigned tasks when API key is missing', () => {
    const generated = fallbackProjectGenerator(
      'تطبيق حجز تذاكر الطيران',
      'ar',
      mockMembers
    );

    expect(generated.projectName).toBeDefined();
    expect(generated.tasks.length).toBeGreaterThanOrEqual(3);
    // Design task assigned to designer, QA to QA
    const designerTask = generated.tasks.find((t) => t.assignedMemberUid === 'u1');
    expect(designerTask).toBeDefined();
  });
});
