'use client';

// ============================================================================
// ZONE 1: IMPORTS
// ============================================================================
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n/I18nProvider';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { MemberContext, GeneratedTask, GeneratedProject } from '@/lib/ai/gemini';
import { createProject, addProjectMemberProfile } from '@/services/projects';
import { createTask } from '@/services/tasks';
import { getDb } from '@/lib/firebase';
import { Icon } from '@/components/ui/Icon';

// ============================================================================
// ZONE 2: CONFIG & STYLES (EASY EDIT ZONE)
// ============================================================================
const QUICK_TEMPLATES = [
  { ar: 'تطبيق متجر إلكتروني متكامل مع نظام دفع وشحن', en: 'E-commerce mobile app with checkout & shipping' },
  { ar: 'إطلاق حملة تسويقية لموسم التخفيضات وإعلانات الفيديو', en: 'Q4 marketing campaign with video ads & landing page' },
  { ar: 'إعادة تصميم موقع الشركة وتحسين سرعة الأداء ومحركات البحث', en: 'Company website redesign with SEO & performance overhaul' },
  { ar: 'تطوير لوحة تحكم إدارية وربط قواعد البيانات وفحص الأمان', en: 'Enterprise SaaS admin dashboard with auth & security audit' },
];

const MODAL_STYLES = {
  backdrop: 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm',
  container: 'w-full max-w-4xl max-h-[90vh] rounded-2xl border border-line bg-surface p-6 shadow-2xl flex flex-col text-text overflow-hidden',
  header: 'flex items-center justify-between border-b border-line pb-4 shrink-0',
  title: 'text-lg font-bold text-text flex items-center gap-2.5',
  promptArea: 'relative flex flex-col gap-2 p-3.5 rounded-xl border border-line bg-bg focus-within:border-accent transition-all',
  micBtnListening: 'p-2 rounded-full bg-red-500/20 text-red-500 border border-red-500/40 animate-pulse',
  micBtnIdle: 'p-2 rounded-full bg-surface text-text-2 border border-line hover:border-accent hover:text-accent transition-colors',
  templateChip: 'text-xs px-2.5 py-1 rounded-full border border-line bg-surface hover:border-accent hover:text-accent text-text-2 transition-colors text-start',
  taskRow: 'p-3.5 rounded-xl border border-line bg-bg hover:border-line-hover transition-all flex flex-col gap-2',
  priorityHigh: 'text-[11px] font-semibold px-2 py-0.5 rounded-md bg-red-500/10 text-red-500 border border-red-500/20',
  priorityMed: 'text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20',
  priorityLow: 'text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
  roleBadge: 'text-[11px] font-medium px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 flex items-center gap-1',
};

// ============================================================================
// ZONE 3: TYPES & INTERFACES
// ============================================================================
export interface AIProjectArchitectModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: MemberContext[];
  onProjectCreated: (newProjectId: string) => void;
}

interface SelectableGeneratedTask extends GeneratedTask {
  selected: boolean;
}

// ============================================================================
// ZONE 4: HELPER FUNCTIONS
// ============================================================================
function computeDueDate(daysFromNow: number): string {
  const d = new Date(Date.now() + Math.max(1, daysFromNow) * 86400000);
  return d.toISOString().slice(0, 10);
}

// ============================================================================
// ZONE 5: SUB-COMPONENTS
// ============================================================================
function TaskPreviewRow({
  task,
  index,
  members,
  onToggle,
  onUpdateRole,
}: {
  task: SelectableGeneratedTask;
  index: number;
  members: MemberContext[];
  onToggle: (idx: number) => void;
  onUpdateRole: (idx: number, memberUid: string) => void;
}) {
  const priorityClass =
    task.priority === 'high'
      ? MODAL_STYLES.priorityHigh
      : task.priority === 'low'
      ? MODAL_STYLES.priorityLow
      : MODAL_STYLES.priorityMed;

  return (
    <div className={`${MODAL_STYLES.taskRow} ${!task.selected ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3 flex-1 min-w-[240px]">
          <input
            type="checkbox"
            checked={task.selected}
            onChange={() => onToggle(index)}
            className="mt-1 h-4 w-4 rounded border-line text-accent focus:ring-accent cursor-pointer"
          />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-text">{task.title}</span>
            <p className="text-xs text-text-3 m-0 leading-relaxed">{task.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className={priorityClass}>{task.priority.toUpperCase()}</span>

          {members.length > 0 && (
            <select
              value={task.assignedMemberUid || ''}
              onChange={(e) => onUpdateRole(index, e.target.value)}
              className="text-xs rounded-md border border-line bg-surface px-2 py-1 text-text focus:outline-none"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.uid} value={m.uid}>
                  {m.displayName} ({m.jobTitle})
                </option>
              ))}
            </select>
          )}

          {task.assignedMemberRole && (
            <span className={MODAL_STYLES.roleBadge}>
              <Icon name="users" size={12} />
              <span>{task.assignedMemberRole}</span>
            </span>
          )}
        </div>
      </div>

      {task.checklist.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-line/40">
          {task.checklist.map((item, i) => (
            <span
              key={i}
              className="text-[11px] text-text-3 bg-surface border border-line/60 px-2 py-0.5 rounded"
            >
              ✓ {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ZONE 6: MAIN COMPONENT
// ============================================================================
export function AIProjectArchitectModal({
  isOpen,
  onClose,
  members,
  onProjectCreated,
}: AIProjectArchitectModalProps): React.ReactElement | null {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const isAr = locale === 'ar';

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('taskora_gemini_api_key') || '';
    }
    return '';
  });

  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    if (typeof window !== 'undefined') {
      if (val.trim()) {
        localStorage.setItem('taskora_gemini_api_key', val.trim());
      } else {
        localStorage.removeItem('taskora_gemini_api_key');
      }
    }
  };

  const [generatedProject, setGeneratedProject] = useState<GeneratedProject | null>(null);
  const [tasks, setTasks] = useState<SelectableGeneratedTask[]>([]);

  // Speech Recognition hook
  const { isListening, isSupported, startListening, stopListening, resetTranscript } =
    useSpeechRecognition({
      onTranscript: (spoken) => setPrompt(spoken),
    });

  if (!isOpen) return null;

  function handleToggleMic() {
    if (!isSupported) {
      setErrorMessage(
        isAr
          ? 'المتصفح الحالي لا يدعم ميزة الإملاء الصوتي المباشر. يمكنك كتابة فكرة المشروع نصياً.'
          : 'Speech recognition is not supported in this browser. Please type your prompt.'
      );
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening(isAr ? 'ar-SA' : 'en-US');
    }
  }

  async function handleGeneratePlan() {
    if (!prompt.trim()) {
      setErrorMessage(isAr ? 'يرجى كتابة فكرة المشروع أو التحدث عبر الميكروفون' : 'Please provide a project prompt or use speech');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/ai/generate-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          locale: isAr ? 'ar' : 'en',
          members,
          apiKey: apiKey.trim() || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate project structure');
      }

      const data: GeneratedProject = await res.json();
      setGeneratedProject(data);
      setTasks(data.tasks.map((t) => ({ ...t, selected: true })));
    } catch {
      setErrorMessage(isAr ? 'حدث خطأ أثناء تفكيك وتوليد خطة المشروع' : 'Error generating project breakdown');
    } finally {
      setIsGenerating(false);
    }
  }

  function handleToggleTask(index: number) {
    setTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, selected: !t.selected } : t))
    );
  }

  function handleUpdateRole(index: number, memberUid: string) {
    const matched = members.find((m) => m.uid === memberUid);
    setTasks((prev) =>
      prev.map((t, i) =>
        i === index
          ? {
              ...t,
              assignedMemberUid: memberUid || null,
              assignedMemberName: matched?.displayName,
              assignedMemberRole: matched?.jobTitle,
            }
          : t
      )
    );
  }

  async function handleConfirmAndCreate() {
    if (!generatedProject || !user) return;
    const selectedTasks = tasks.filter((t) => t.selected);

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const db = getDb();
      // 1. Create project
      const newProjectId = await createProject(
        db,
        { uid: user.uid, displayName: user.displayName || user.email || 'Owner' },
        {
          name: generatedProject.projectName,
          description: generatedProject.projectDescription,
        }
      );

      // 2. Add existing member profiles to project if available
      for (const m of members) {
        if (m.uid !== user.uid) {
          try {
            await addProjectMemberProfile(db, newProjectId, {
              uid: m.uid,
              displayName: m.displayName,
              email: `${m.displayName.toLowerCase().replace(/\s+/g, '.')}@taskora.io`,
              jobTitle: m.jobTitle,
              role: 'member',
              addedAt: new Date().toISOString(),
            });
          } catch {
            // non-fatal
          }
        }
      }

      // 3. Insert generated tasks
      for (const t of selectedTasks) {
        await createTask(db, newProjectId, user.uid, {
          title: t.title,
          description: t.description,
          priority: t.priority,
          assigneeId: t.assignedMemberUid,
          dueDate: computeDueDate(t.suggestedDueDaysFromNow),
          checklist: t.checklist.map((text, idx) => ({
            id: `c_${idx}_${Date.now()}`,
            text,
            done: false,
          })),
        });
      }

      onProjectCreated(newProjectId);
      onClose();
    } catch {
      setErrorMessage(isAr ? 'حدث خطأ أثناء حفظ المشروع والمهام' : 'Failed to save project and tasks');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className={MODAL_STYLES.backdrop} data-testid="ai-architect-modal">
      <div className={MODAL_STYLES.container} role="dialog" aria-modal="true">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-line pb-3 sm:pb-4 gap-2.5 shrink-0">
          <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center font-bold shrink-0 mt-0.5 sm:mt-0">
              ✨
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-bold text-text truncate m-0">
                <span>{isAr ? 'مهندس المشاريع الذكي بالذكاء الاصطناعي' : 'AI Project & Task Architect'}</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-text-3 m-0 line-clamp-1 sm:line-clamp-none">
                {isAr
                  ? 'تفكيك فكرة المشروع وتوزيع المهام وفق المسميات الوظيفية'
                  : 'Voice-decompose your project and auto-assign tasks based on member job roles'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setShowApiKeyInput((prev) => !prev)}
              data-testid="ai-settings-toggle"
              className="text-xs text-text-3 hover:text-accent flex items-center gap-1.5 transition-colors px-2.5 py-1.5 rounded-lg border border-line bg-surface hover:border-accent shrink-0 whitespace-nowrap min-h-[36px]"
              title={isAr ? 'إعدادات مفتاح Gemini API' : 'Gemini API Key Settings'}
            >
              <Icon name="settings" size={13} />
              <span className="whitespace-nowrap">{isAr ? 'مفتاح API' : 'API Key'}</span>
              {apiKey ? <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" /> : null}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-text-2 hover:text-text transition-colors p-1.5 shrink-0 rounded-lg hover:bg-surface min-h-[36px] min-w-[36px] flex items-center justify-center"
              aria-label={t('common.close')}
            >
              <Icon name="x" size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex flex-col gap-4 overflow-y-auto py-4 pr-1">
          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-xs">
              {errorMessage}
            </div>
          )}

          {/* API Key settings panel */}
          {showApiKeyInput && (
            <div className="p-3 bg-surface border border-line rounded-xl flex flex-col gap-2 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-text flex items-center gap-1.5">
                  <Icon name="settings" size={14} className="text-accent" />
                  <span>{isAr ? 'مفتاح Google Gemini API:' : 'Google Gemini API Key:'}</span>
                </label>
                <span className="text-[11px] text-text-3">
                  {isAr ? 'يُحفظ بأمان في متصفحك' : 'Saved locally in browser'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  data-testid="ai-api-key-input"
                  placeholder={isAr ? 'أدخل المفتاح هنا...' : 'Enter API key...'}
                  className="flex-1 rounded-lg border border-line bg-bg px-3 py-1.5 text-xs text-text placeholder:text-text-3 focus:outline-none focus:border-accent"
                />
                {apiKey && (
                  <button
                    type="button"
                    onClick={() => handleApiKeyChange('')}
                    className="text-text-3 hover:text-red-500 text-xs px-2 py-1 rounded border border-line/50 hover:border-red-500/50"
                    title={isAr ? 'مسح المفتاح' : 'Clear key'}
                  >
                    {isAr ? 'مسح' : 'Clear'}
                  </button>
                )}
              </div>
              <p className="text-[11px] text-text-3 m-0">
                {isAr
                  ? 'إذا تركته فارغاً، سيستخدم النظام المفتاح من ملف البيئة (.env.local) أو المحلل الذكي المدمج.'
                  : 'If empty, the server uses GEMINI_API_KEY from the environment or the built-in smart engine.'}
              </p>
            </div>
          )}

          {/* Prompt & Voice Input */}
          <div className={MODAL_STYLES.promptArea}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-text-2">
                {isAr ? 'فكرة المشروع أو الهدف العام:' : 'Project Idea or Goal:'}
              </label>

              <button
                type="button"
                onClick={handleToggleMic}
                data-testid="ai-mic-btn"
                className={isListening ? MODAL_STYLES.micBtnListening : MODAL_STYLES.micBtnIdle}
                title={
                  !isSupported
                    ? isAr
                      ? 'التسجيل الصوتي غير مدعوم في هذا المتصفح، يمكنك استخدام الكتابة'
                      : 'Voice input not supported in this browser, please type'
                    : isListening
                    ? 'Stop listening'
                    : 'Start voice dictation'
                }
              >
                <span className="text-sm">🎙️</span>
              </button>
            </div>

            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              data-testid="ai-prompt-input"
              placeholder={
                isAr
                  ? 'اكتب أو تحدّث بصوتك: مثلاً: إطلاق متجر إلكتروني لمستحضرات التجميل مع بوابات دفع وتصميم عصري وفحص جودة...'
                  : 'Type or speak: e.g. Launching a fintech mobile app with payment gateway, security audit, and wireframes...'
              }
              className="w-full bg-transparent text-sm text-text placeholder:text-text-3 resize-none focus:outline-none"
            />

            {/* Quick Templates */}
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-line/40">
              {QUICK_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(isAr ? tmpl.ar : tmpl.en)}
                  className={MODAL_STYLES.templateChip}
                >
                  {isAr ? tmpl.ar : tmpl.en}
                </button>
              ))}
            </div>
          </div>

          {/* Action Trigger */}
          <div className="flex justify-end">
            <button
              type="button"
              disabled={isGenerating || !prompt.trim()}
              onClick={handleGeneratePlan}
              data-testid="ai-generate-btn"
              className="px-5 py-2.5 rounded-lg bg-accent text-on-accent text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin text-sm">⏳</span>
                  <span>{isAr ? 'الذكاء الاصطناعي يحلل ويوزع المهام...' : 'AI is decomposing & assigning...'}</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>{isAr ? 'تفكيك وتوليد خطة المشروع' : 'Generate Project Breakdown'}</span>
                </>
              )}
            </button>
          </div>

          {/* Generated Plan Review Section */}
          {generatedProject && (
            <div className="flex flex-col gap-3 pt-3 border-t border-line">
              <div className="p-3.5 rounded-xl bg-accent/5 border border-accent/20 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-text m-0">{generatedProject.projectName}</h3>
                  <span className="text-xs text-accent font-medium">
                    {tasks.filter((t) => t.selected).length} {isAr ? 'مهام محددة' : 'tasks selected'}
                  </span>
                </div>
                <p className="text-xs text-text-2 m-0">{generatedProject.projectDescription}</p>
              </div>

              <div className="flex flex-col gap-2.5">
                {tasks.map((task, idx) => (
                  <TaskPreviewRow
                    key={idx}
                    task={task}
                    index={idx}
                    members={members}
                    onToggle={handleToggleTask}
                    onUpdateRole={handleUpdateRole}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between pt-4 border-t border-line gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-text-2 hover:text-text transition-colors text-center min-h-[40px] rounded-lg hover:bg-surface sm:w-auto w-full"
          >
            {t('common.cancel')}
          </button>

          {generatedProject && (
            <button
              type="button"
              disabled={isSaving || tasks.filter((t) => t.selected).length === 0}
              onClick={handleConfirmAndCreate}
              className="px-6 py-2.5 rounded-lg bg-accent text-on-accent text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 min-h-[44px] sm:w-auto w-full whitespace-nowrap"
            >
              {isSaving ? (
                <span>{isAr ? 'جاري حفظ المشروع والمهام...' : 'Saving project...'}</span>
              ) : (
                <>
                  <Icon name="check" size={16} />
                  <span>{isAr ? 'اعتماد وإنشاء المشروع بالمهام' : 'Confirm & Create Project'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
