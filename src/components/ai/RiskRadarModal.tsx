'use client';

// ============================================================================
// ZONE 1: IMPORTS
// ============================================================================
import React, { useState, useEffect } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { Task } from '@/types';
import { MemberContext } from '@/lib/ai/gemini';
import { Icon } from '@/components/ui/Icon';
import { RiskRadarResponse, RiskItem, WorkloadItem } from '@/app/api/ai/risk-radar/route';

// ============================================================================
// ZONE 2: CONFIG & STYLES (EASY EDIT ZONE)
// ============================================================================
const RADAR_STYLES = {
  backdrop: 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm',
  container: 'w-full max-w-4xl max-h-[90vh] rounded-2xl border border-line bg-surface p-6 shadow-2xl flex flex-col text-text overflow-hidden',
  header: 'flex items-center justify-between border-b border-line pb-4 shrink-0',
  title: 'text-lg font-bold text-text flex items-center gap-2.5',
  riskCardHigh: 'p-4 rounded-xl border border-red-500/30 bg-red-500/5 flex flex-col gap-1.5',
  riskCardMed: 'p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 flex flex-col gap-1.5',
  riskCardLow: 'p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex flex-col gap-1.5',
  executiveCard: 'p-4 rounded-xl border border-line bg-bg flex flex-col gap-2 font-mono text-xs whitespace-pre-wrap leading-relaxed text-text select-text',
};

// ============================================================================
// ZONE 3: TYPES & INTERFACES
// ============================================================================
export interface RiskRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  tasks: Task[];
  members: MemberContext[];
}

// ============================================================================
// ZONE 5: SUB-COMPONENTS
// ============================================================================
function HealthBadge({ score, status }: { score: number; status: string }) {
  const isOptimal = status === 'optimal';
  const isMed = status === 'moderate_risk';

  const badgeColor = isOptimal
    ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30'
    : isMed
    ? 'text-amber-500 bg-amber-500/10 border-amber-500/30'
    : 'text-red-500 bg-red-500/10 border-red-500/30';

  return (
    <div className={`flex items-center gap-3 p-3.5 rounded-xl border ${badgeColor}`}>
      <div className="text-2xl font-bold font-mono">{score}%</div>
      <div className="flex flex-col">
        <span className="text-xs uppercase font-bold tracking-wider">
          {isOptimal ? 'صحة المشروع ممتازة' : isMed ? 'مخاطر تشغيلية متوسطة' : 'المشروع بحاجة لتدخل عاجل'}
        </span>
        <span className="text-[11px] opacity-80">
          {isOptimal
            ? 'المهام تسير بانتظام وتوزيع طاقة الفريق متوازن'
            : 'توجد اختناقات في المواعيد أو تركز المهام على أفراد محددين'}
        </span>
      </div>
    </div>
  );
}

function RiskItemCard({ risk }: { risk: RiskItem }) {
  const cardClass =
    risk.level === 'high'
      ? RADAR_STYLES.riskCardHigh
      : risk.level === 'medium'
      ? RADAR_STYLES.riskCardMed
      : RADAR_STYLES.riskCardLow;

  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-text">{risk.title}</span>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-surface border border-line">
          {risk.level}
        </span>
      </div>
      <p className="text-xs text-text-2 m-0">{risk.description}</p>
      <div className="text-xs font-medium text-accent mt-1 flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1.5"><Icon name="sparkles" size={14} className="text-accent" /><span>التوصية:</span></span>
        <span>{risk.recommendation}</span>
      </div>
    </div>
  );
}

function WorkloadRosterRow({ item }: { item: WorkloadItem }) {
  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg border border-line bg-surface text-xs">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-text">{item.memberName}</span>
        <span className="text-text-3">({item.role})</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono font-bold text-text">{item.taskCount} مهام</span>
        {item.isOverloaded && (
          <span className="text-[10px] bg-red-500/10 text-red-500 border border-red-500/20 px-1.5 py-0.5 rounded font-bold">
            ضغط مرتفع
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// ZONE 6: MAIN COMPONENT
// ============================================================================
export function RiskRadarModal({
  isOpen,
  onClose,
  projectName,
  tasks,
  members,
}: RiskRadarModalProps): React.ReactElement | null {
  const { t, locale } = useI18n();
  const isAr = locale === 'ar';

  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<RiskRadarResponse | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function loadAnalysis() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/ai/risk-radar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectName,
            tasks: tasks.map((t) => ({
              title: t.title,
              status: t.status,
              priority: t.priority,
              dueDate: t.dueDate,
              assigneeId: t.assigneeId,
            })),
            members,
            locale: isAr ? 'ar' : 'en',
          }),
        });

        if (res.ok && isMounted) {
          const json: RiskRadarResponse = await res.json();
          setData(json);
        }
      } catch {
        // non-fatal
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadAnalysis();
    return () => {
      isMounted = false;
    };
  }, [isOpen, projectName, tasks, members, isAr]);

  if (!isOpen) return null;

  function handleCopySummary() {
    if (data?.executiveSummary) {
      navigator.clipboard.writeText(data.executiveSummary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <div className={RADAR_STYLES.backdrop} data-testid="risk-radar-modal">
      <div className={RADAR_STYLES.container} role="dialog" aria-modal="true">
        {/* Header */}
        <div className={RADAR_STYLES.header}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center font-bold">
              <Icon name="chart" size={16} />
            </div>
            <div>
              <h2 className={RADAR_STYLES.title}>
                <span>{isAr ? 'رادار المخاطر والتقرير التنفيذي الذكي' : 'AI Risk Radar & Executive Digest'}</span>
              </h2>
              <span className="text-xs text-text-3">
                {isAr
                  ? `تحليل ذكي لحالة مشروع "${projectName}" واكتشاف المعوقات`
                  : `Automated health audit and bottleneck detection for "${projectName}"`}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-text-2 hover:text-text transition-colors p-1"
            aria-label={t('common.close')}
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-4 overflow-y-auto py-4 pr-1">
          {isLoading ? (
            <div className="py-16 text-center text-text-2 flex flex-col items-center gap-3">
              <span className="text-2xl animate-spin">⏳</span>
              <span className="text-sm">
                {isAr ? 'الذكاء الاصطناعي يحلل لوحة الكانبان والمواعيد وضغط العمل...' : 'AI is auditing velocity and bottlenecks...'}
              </span>
            </div>
          ) : data ? (
            <>
              {/* Overall Health Card */}
              <HealthBadge score={data.healthScore} status={data.overallHealth} />

              {/* Identified Risks */}
              <div className="flex flex-col gap-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-2 m-0">
                  {isAr ? 'المخاطر المكتشفة والتوصيات المباشرة:' : 'Identified Operational Risks:'}
                </h4>
                {data.risks.map((r) => (
                  <RiskItemCard key={r.id} risk={r} />
                ))}
              </div>

              {/* Workload Roster */}
              {data.workloadDistribution.length > 0 && (
                <div className="flex flex-col gap-2.5 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-2 m-0">
                    {isAr ? 'توزيع طاقة وأدوار أعضاء الفريق:' : 'Team Workload & Role Allocation:'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {data.workloadDistribution.map((item) => (
                      <WorkloadRosterRow key={item.memberUid} item={item} />
                    ))}
                  </div>
                </div>
              )}

              {/* Executive Summary Report */}
              <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-2 m-0">
                    {isAr ? 'تقرير الإنجاز التنفيذي (جاهز للمشاركة):' : 'Executive Progress Report:'}
                  </h4>
                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="text-xs text-accent hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Icon name={copied ? 'check' : 'clipboard'} size={14} />
                    <span>{copied ? (isAr ? 'تم النسخ للحافظة' : 'Copied') : (isAr ? 'نسخ التقرير' : 'Copy')}</span>
                  </button>
                </div>
                <div className={RADAR_STYLES.executiveCard}>{data.executiveSummary}</div>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-text-3 text-sm">
              {isAr ? 'تعذر جلب تقرير التحليل' : 'Could not fetch analysis report'}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-line shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-text-2 hover:text-text transition-colors"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>

          {data && (
            <button
              type="button"
              onClick={handleCopySummary}
              className="px-5 py-2 rounded-lg bg-accent text-on-accent text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer"
            >
              <Icon name="clipboard" size={14} />
              <span>{copied ? 'تم نسخ التقرير' : 'نسخ التقرير التنفيذي'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
