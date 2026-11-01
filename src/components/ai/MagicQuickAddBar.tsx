'use client';

// ============================================================================
// ZONE 1: IMPORTS
// ============================================================================
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n/I18nProvider';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { MemberContext } from '@/lib/ai/gemini';
import { createTask } from '@/services/tasks';
import { getDb } from '@/lib/firebase';
import { TaskInput } from '@/types';
import { Icon } from '@/components/ui/Icon';

// ============================================================================
// ZONE 2: CONFIG & STYLES (EASY EDIT ZONE)
// ============================================================================
const QUICK_COMMAND_EXAMPLES = [
  { ar: 'صمم واجهة الدفع للمصمم الخميس القادم أولوية عالية', en: 'Design checkout UI for designer next Thursday high priority' },
  { ar: 'فحص ثغرات تسجيل الدخول للـ QA غداً أولوية قصوى', en: 'Auth vulnerability audit for QA tomorrow high priority' },
  { ar: 'تجهيز قاعدة البيانات لـ Backend أولوية متوسطة', en: 'Setup Postgres schema for backend medium priority' },
];

const BAR_STYLES = {
  container: 'w-full rounded-xl border border-line bg-surface p-3.5 shadow-sm text-text flex flex-col gap-2.5 transition-all',
  headerRow: 'flex items-center justify-between text-xs text-text-2',
  inputWrapper: 'flex items-center gap-2 rounded-lg border border-line bg-bg p-1.5 focus-within:border-accent transition-colors',
  input: 'flex-1 bg-transparent px-2.5 py-1 text-sm text-text placeholder:text-text-3 focus:outline-none',
  micBtnListening: 'p-2 rounded-md bg-red-500/20 text-red-500 border border-red-500/40 animate-pulse cursor-pointer',
  micBtnIdle: 'p-2 rounded-md bg-surface text-text-2 border border-line hover:border-accent hover:text-accent transition-colors cursor-pointer',
  submitBtn: 'px-4 py-1.5 rounded-md bg-accent text-on-accent text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1.5 cursor-pointer',
  chip: 'text-[11px] px-2 py-0.5 rounded-full border border-line bg-bg hover:border-accent hover:text-accent text-text-3 transition-colors text-start',
};

// ============================================================================
// ZONE 3: TYPES & INTERFACES
// ============================================================================
export interface MagicQuickAddBarProps {
  projectId: string;
  members: MemberContext[];
  onTaskCreated?: () => void;
}

// ============================================================================
// ZONE 6: MAIN COMPONENT
// ============================================================================
export function MagicQuickAddBar({
  projectId,
  members,
  onTaskCreated,
}: MagicQuickAddBarProps): React.ReactElement {
  const { user } = useAuth();
  const { locale } = useI18n();
  const isAr = locale === 'ar';

  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { isListening, isSupported, startListening, stopListening, resetTranscript } =
    useSpeechRecognition({
      onTranscript: (spoken) => setPrompt(spoken),
    });

  function handleToggleMic() {
    if (!isSupported) {
      return;
    }
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening(isAr ? 'ar-SA' : 'en-US');
    }
  }

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setSuccessMessage(null);

    try {
      const storedApiKey =
        typeof window !== 'undefined'
          ? window.localStorage.getItem('taskora_gemini_api_key') || undefined
          : undefined;

      const res = await fetch('/api/ai/quick-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          locale: isAr ? 'ar' : 'en',
          members,
          apiKey: storedApiKey,
        }),
      });

      if (!res.ok) {
        throw new Error('Quick add failed');
      }

      const parsed = await res.json();

      // If user is logged in, insert task to Firestore
      if (user) {
        const db = getDb();
        const taskInput: TaskInput = {
          title: parsed.title || prompt.slice(0, 60),
          description: parsed.description || '',
          priority: parsed.priority || 'medium',
          assigneeId: parsed.assigneeId || null,
          dueDate: parsed.dueDate || null,
          checklist: (parsed.checklist || []).map((text: string, i: number) => ({
            id: `c_${i}`,
            text,
            done: false,
          })),
        };

        await createTask(db, projectId, user.uid, taskInput);
      }

      onTaskCreated?.();
      setPrompt('');
      resetTranscript();
      setSuccessMessage(isAr ? 'تمت إضافة المهمة وتعيينها بنجاح!' : 'Task created and assigned!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      // non-fatal
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={BAR_STYLES.container} data-testid="magic-quick-add-bar">
      <div className={BAR_STYLES.headerRow}>
        <div className="flex items-center gap-1.5 font-medium text-text">
          <span>⚡</span>
          <span>
            {isAr ? 'الإدخال السريع الذكي (بالصوت أو النص)' : 'Magic Quick-Add (Voice & Natural Language)'}
          </span>
        </div>

        {successMessage && (
          <span className="text-xs text-emerald-500 font-medium animate-fade-in">
            ✓ {successMessage}
          </span>
        )}
      </div>

      <form onSubmit={handleQuickAdd} className={BAR_STYLES.inputWrapper}>
        <button
          type="button"
          onClick={handleToggleMic}
          data-testid="magic-quick-add-mic"
          className={isListening ? BAR_STYLES.micBtnListening : BAR_STYLES.micBtnIdle}
          title={isListening ? 'Stop listening' : 'Dictate with voice'}
        >
          <span className="text-xs">🎙️</span>
        </button>

        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          data-testid="magic-quick-add-input"
          placeholder={
            isAr
              ? 'اكتب أو أملِ أمرك: "تصميم واجهة الدفع للمصمم الخميس القادم أولوية عالية"'
              : 'Type or speak: e.g. "Create API tests for QA next Monday high priority"'
          }
          className={BAR_STYLES.input}
        />

        <button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          data-testid="magic-quick-add-btn"
          className={BAR_STYLES.submitBtn}
        >
          {isLoading ? (
            <span className="animate-spin">⏳</span>
          ) : (
            <>
              <Icon name="plus" size={14} />
              <span>{isAr ? 'إضافة ذكية' : 'Add Task'}</span>
            </>
          )}
        </button>
      </form>

      {/* Quick suggestion pills */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK_COMMAND_EXAMPLES.map((ex, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setPrompt(isAr ? ex.ar : ex.en)}
            className={BAR_STYLES.chip}
          >
            {isAr ? ex.ar : ex.en}
          </button>
        ))}
      </div>
    </div>
  );
}
