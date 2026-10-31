import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { MemberContext } from '@/lib/ai/gemini';

const riskRadarRequestSchema = z.object({
  projectName: z.string().default('Project'),
  tasks: z.array(
    z.object({
      title: z.string(),
      status: z.string(),
      priority: z.string(),
      dueDate: z.string().nullable().optional(),
      assigneeId: z.string().nullable().optional(),
    })
  ),
  members: z.array(
    z.object({
      uid: z.string(),
      displayName: z.string(),
      jobTitle: z.string(),
    })
  ).default([]),
  locale: z.enum(['ar', 'en']).default('ar'),
});

export interface RiskItem {
  id: string;
  level: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  recommendation: string;
}

export interface WorkloadItem {
  memberUid: string;
  memberName: string;
  role: string;
  taskCount: number;
  isOverloaded: boolean;
}

export interface RiskRadarResponse {
  overallHealth: 'optimal' | 'moderate_risk' | 'critical';
  healthScore: number;
  risks: RiskItem[];
  executiveSummary: string;
  workloadDistribution: WorkloadItem[];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = riskRadarRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { projectName, tasks, members, locale } = parsed.data;
    const isAr = locale === 'ar';
    const today = new Date().toISOString().slice(0, 10);

    // Heuristic calculations
    const totalTasks = tasks.length;
    const doneTasks = tasks.filter((t) => t.status === 'done').length;
    const openTasks = tasks.filter((t) => t.status !== 'done');
    const overdueTasks = openTasks.filter((t) => t.dueDate && t.dueDate < today);
    const unassignedTasks = openTasks.filter((t) => !t.assigneeId);

    // Workload calculation
    const memberTaskCounts: Record<string, number> = {};
    members.forEach((m) => (memberTaskCounts[m.uid] = 0));
    openTasks.forEach((t) => {
      if (t.assigneeId && memberTaskCounts[t.assigneeId] !== undefined) {
        memberTaskCounts[t.assigneeId]++;
      }
    });

    const workloadDistribution: WorkloadItem[] = members.map((m) => {
      const count = memberTaskCounts[m.uid] || 0;
      return {
        memberUid: m.uid,
        memberName: m.displayName,
        role: m.jobTitle,
        taskCount: count,
        isOverloaded: count >= 5,
      };
    });

    const overloadedMembers = workloadDistribution.filter((w) => w.isOverloaded);

    // Calculate Health Score
    let score = 100;
    score -= overdueTasks.length * 15;
    score -= unassignedTasks.length * 5;
    score -= overloadedMembers.length * 10;
    if (totalTasks > 0 && doneTasks / totalTasks < 0.2 && overdueTasks.length > 0) {
      score -= 10;
    }
    const healthScore = Math.max(15, Math.min(100, score));

    const overallHealth =
      healthScore >= 80 ? 'optimal' : healthScore >= 50 ? 'moderate_risk' : 'critical';

    // Build Risks
    const risks: RiskItem[] = [];

    if (overdueTasks.length > 0) {
      risks.push({
        id: 'r_overdue',
        level: 'high',
        title: isAr
          ? `يوجد ${overdueTasks.length} مهام متأخرة عن موعدها النهائي`
          : `${overdueTasks.length} overdue task(s) detected`,
        description: isAr
          ? `المهام المتأخرة تشمل: ${overdueTasks.slice(0, 3).map((t) => `"${t.title}"`).join('، ')}`
          : `Overdue deliverables include: ${overdueTasks.slice(0, 3).map((t) => `"${t.title}"`).join(', ')}`,
        recommendation: isAr
          ? 'إعادة جدولة المواعيد أو تقديم المساعدة للأعضاء المسؤولين لتجنب تأخير المشروع.'
          : 'Reschedule deadlines or assist assignees to avoid project delivery delays.',
      });
    }

    if (overloadedMembers.length > 0) {
      risks.push({
        id: 'r_overload',
        level: 'medium',
        title: isAr
          ? `ضغط عمل مركز على ${overloadedMembers.length} من أعضاء الفريق`
          : `Workload bottleneck on ${overloadedMembers.length} team member(s)`,
        description: isAr
          ? `العضو ${overloadedMembers.map((m) => `${m.memberName} (${m.role})`).join('، ')} لديه أكثر من 5 مهام مفتوحة.`
          : `Member(s) ${overloadedMembers.map((m) => `${m.memberName} (${m.role})`).join(', ')} have 5+ concurrent open tasks.`,
        recommendation: isAr
          ? 'إعادة توزيع بعض المهام على أعضاء آخرين وفق المسميات الوظيفية المناسبة.'
          : 'Rebalance tasks across other team members with matching roles.',
      });
    }

    if (unassignedTasks.length > 0) {
      risks.push({
        id: 'r_unassigned',
        level: 'low',
        title: isAr
          ? `يوجد ${unassignedTasks.length} مهام غير مسندة لأي عضو`
          : `${unassignedTasks.length} unassigned task(s)`,
        description: isAr
          ? 'مهام معلقة بدون مسؤول مباشر قد يتم نسيانها.'
          : 'Pending deliverables without a dedicated assignee.',
        recommendation: isAr
          ? 'استخدم ميزة التوزيع الذكي بالـ AI لإسنادها بناءً على المسميات الوظيفية.'
          : 'Use AI auto-assignment to pair with members based on their job titles.',
      });
    }

    if (risks.length === 0) {
      risks.push({
        id: 'r_optimal',
        level: 'low',
        title: isAr ? 'المشروع يسير بوتيرة منتظمة ومثالية' : 'Project is on track and healthy',
        description: isAr ? 'لا توجد مهام متأخرة وتوزيع العمل متوازن بين الأعضاء.' : 'Zero overdue items and balanced team allocation.',
        recommendation: isAr ? 'الاستمرار في متابعة المهام حتى موعد الإطلاق.' : 'Maintain current momentum toward release.',
      });
    }

    // Build Executive Summary
    const completionPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    const executiveSummary = isAr
      ? `## تقرير الإنجاز التنفيذي — ${projectName}
**تاريخ التقرير:** ${today} | **مؤشر الصحة التشغيلية:** ${healthScore}% (${overallHealth === 'optimal' ? 'ممتاز' : overallHealth === 'moderate_risk' ? 'مخاطر متوسطة' : 'حرج'})

### 1. ملخص الأداء والإنجاز:
• إجمالي المهام: **${totalTasks}** مهمة (تم إنجاز **${doneTasks}** بنسبة **${completionPercent}%**).
• المهام النشطة قيد التنفيذ: **${openTasks.length}** مهمة.
• المهام المتأخرة: **${overdueTasks.length}** مهمة بحاجة لتدخل عاجل.

### 2. توزيع طاقة الفريق:
${workloadDistribution.map((w) => `• **${w.memberName}** (${w.role}): ${w.taskCount} مهام نشطة ${w.isOverloaded ? '⚠️ (ضغط عمل مرتفع)' : '✅'}`).join('\n')}

### 3. التوصيات التنفيذية المقترحة:
${risks.map((r) => `• **${r.title}:** ${r.recommendation}`).join('\n')}`
      : `## Executive Progress Brief — ${projectName}
**Date:** ${today} | **Operational Health Index:** ${healthScore}% (${overallHealth.toUpperCase()})

### 1. Delivery & Velocity Metrics:
• Total Deliverables: **${totalTasks}** (Completed: **${doneTasks}** / **${completionPercent}%**).
• Active In-Progress Tasks: **${openTasks.length}**.
• Overdue Action Items: **${overdueTasks.length}** requiring immediate intervention.

### 2. Team Workload Allocation:
${workloadDistribution.map((w) => `• **${w.memberName}** (${w.role}): ${w.taskCount} active tasks ${w.isOverloaded ? '⚠️ (High workload)' : '✅'}`).join('\n')}

### 3. Executive Action Items:
${risks.map((r) => `• **${r.title}:** ${r.recommendation}`).join('\n')}`;

    const responseData: RiskRadarResponse = {
      overallHealth,
      healthScore,
      risks,
      executiveSummary,
      workloadDistribution,
    };

    return NextResponse.json(responseData);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error analyzing risks';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
