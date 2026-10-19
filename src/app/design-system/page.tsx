'use client';

import React, { useState, useRef } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { ThemeToggle } from '@/theme/ThemeToggle';
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Card } from '@/components/ui/Card';
import { Segmented } from '@/components/ui/Segmented';
import { Skeleton } from '@/components/ui/Skeleton';
import { Dialog } from '@/components/ui/Dialog';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import { Avatar } from '@/components/ui/Avatar';
import { StackedBars } from '@/components/charts/StackedBars';
import { ColumnChart } from '@/components/charts/ColumnChart';
import { HBars } from '@/components/charts/HBars';
import { ChartPanel } from '@/components/charts/ChartPanel';
import styles from './page.module.css';

function ToastShowcase() {
  const toast = useToast();
  return (
    <div className={styles.componentRow}>
      <Button
        variant="secondary"
        onClick={() => toast.show('success', 'Changes saved successfully!')}
      >
        Trigger Success Toast
      </Button>
      <Button
        variant="danger"
        onClick={() => toast.show('error', 'Network error occurred. Please retry.')}
      >
        Trigger Error Toast
      </Button>
    </div>
  );
}

export default function DesignSystemPage() {
  const { t } = useI18n();
  const [dialogOpen, setDialogOpen] = useState(false);
  const dialogTriggerRef = useRef<HTMLButtonElement>(null);
  const [segmentedVal, setSegmentedVal] = useState('list');

  const colors = [
    { name: 'Obsidian / Pearl Canvas', role: 'Background (--bg)', hex: 'Light #F4F4F2 / Dark #0C0B0A', varName: 'var(--bg)', contrast: '≥ 15.9:1 (AAA)' },
    { name: 'Warm Charcoal / Pure White', role: 'Surfaces (--surface)', hex: 'Light #FFFFFF / Dark #141211', varName: 'var(--surface)', contrast: '≥ 15.4:1 (AAA)' },
    { name: 'Champagne / Bronze', role: 'Primary Action (--accent)', hex: 'Light #7A5818 / Dark #D4B26E', varName: 'var(--accent)', contrast: '≥ 6.4:1 (AA)' },
    { name: 'Warm Ivory / Deep Ink', role: 'Text (--text)', hex: 'Light #1B1915 / Dark #EFE9DD', varName: 'var(--text)', contrast: '≥ 15.4:1 (AAA)' },
    { name: 'Persistent Dark Sidebar', role: 'Sidebar (--sidebar-bg)', hex: 'Both Themes #11100E', varName: 'var(--sidebar-bg)', contrast: '≥ 15.7:1 (AAA)' },
    { name: 'Muted Sand / Stone', role: 'Muted Labels (--text-muted)', hex: 'Light #5A5348 / Dark #B5AC9C', varName: 'var(--text-muted)', contrast: '≥ 6.4:1 (AA)' },
  ];

  return (
    <ToastProvider>
      <main className={styles.page}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>{t('app.name')} Design System</h1>
            <p className={styles.subtitle}>
              Obsidian Ledger tokens, primitives, typography and RTL layout verification
            </p>
          </div>
          <div className={styles.controls}>
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </header>

        {/* Colors */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Colors & Contrast</h2>
          <div className={styles.grid}>
            {colors.map((c) => (
              <div key={c.name} className={styles.colorSwatch}>
                <div className={styles.swatchPreview} style={{ backgroundColor: c.varName }} />
                <span className={styles.swatchName}>{c.name}</span>
                <span className={styles.swatchRole}>{c.role}</span>
                <span className={styles.swatchContrast}>{c.contrast}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Typography</h2>
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 600 }}>
                Display Title: Fraunces & Amiri (العنوان والترويسة)
              </div>
              <div style={{ fontSize: '1rem', color: 'var(--text)', lineHeight: 1.75 }}>
                Body Text: Instrument Sans & IBM Plex Sans Arabic (خط القراءة والواجهة النظيف والمريح)
              </div>
              <div className="num" style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--accent)' }}>
                12,500 · 34 · 98% (Lining & Tabular Numerals)
              </div>
            </div>
          </Card>
        </section>

        {/* Buttons */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Buttons & Actions</h2>
          <div className={styles.componentRow}>
            <Button variant="primary" icon="plus">Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="danger" icon="trash">Danger Button</Button>
          </div>
          <div className={styles.componentRow}>
            <Button variant="primary" size="sm">Small Primary</Button>
            <Button variant="secondary" size="sm">Small Secondary</Button>
            <Button variant="primary" loading>Loading State</Button>
            <Button variant="primary" disabled>Disabled State</Button>
          </div>
          <div className={styles.componentRow}>
            <IconButton icon="plus" label="Add task" variant="secondary" />
            <IconButton icon="edit" label="Edit item" variant="ghost" />
            <IconButton icon="trash" label="Delete item" variant="danger" />
            <IconButton icon="settings" label="Settings" variant="ghost" />
          </div>
        </section>

        {/* Badges */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Badges & Statuses</h2>
          <div className={styles.componentRow}>
            <Badge kind="todo" />
            <Badge kind="in_progress" />
            <Badge kind="done" />
            <Badge kind="overdue" />
            <Badge kind="low" />
            <Badge kind="medium" />
            <Badge kind="high" />
          </div>
        </section>

        {/* Progress Bar */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Progress Bar</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <ProgressBar value={25} max={100} label="25% complete" />
            <ProgressBar value={60} max={100} label="60% complete" />
            <ProgressBar value={100} max={100} label="100% complete" />
          </div>
        </section>

        {/* Segmented */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Segmented Control</h2>
          <div className={styles.componentRow}>
            <Segmented
              label="View selection"
              value={segmentedVal}
              onChange={setSegmentedVal}
              options={[
                { value: 'list', label: 'List view', icon: 'bars' },
                { value: 'grid', label: 'Grid view', icon: 'folder' },
                { value: 'analytics', label: 'Analytics', icon: 'filter' },
              ]}
            />
          </div>
        </section>

        {/* Form Controls */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Form Controls</h2>
          <div className={styles.formGrid}>
            <Field id="ds-input-normal" label="Project name" hint="3 to 80 characters">
              {(fieldProps) => <Input {...fieldProps} placeholder="e.g. Website Redesign" />}
            </Field>

            <Field id="ds-input-error" label="Email" error="Please enter a valid email address">
              {(fieldProps) => <Input {...fieldProps} type="email" value="invalid-email@" onChange={() => {}} />}
            </Field>

            <Field id="ds-select" label="Task Priority">
              {(fieldProps) => (
                <Select {...fieldProps}>
                  <option value="low">Low priority</option>
                  <option value="medium">Medium priority</option>
                  <option value="high">High priority</option>
                </Select>
              )}
            </Field>

            <Field id="ds-textarea" label="Task Description">
              {(fieldProps) => <Textarea {...fieldProps} placeholder="Enter task notes..." rows={3} />}
            </Field>

            <div style={{ display: 'flex', alignItems: 'center', minBlockSize: 40, marginBlockStart: 8 }}>
              <Checkbox id="ds-checkbox" label="Show overdue tasks only" checked={true} onChange={() => {}} />
            </div>
          </div>
        </section>

        {/* Modal Dialog & Toasts */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Dialog & Toasts</h2>
          <div className={styles.componentRow}>
            <Button
              ref={dialogTriggerRef}
              variant="secondary"
              onClick={() => setDialogOpen(true)}
            >
              Open Confirm Dialog
            </Button>
          </div>
          <ToastShowcase />

          <Dialog
            isOpen={dialogOpen}
            title="Delete Project"
            description="Are you sure you want to delete this project? All associated tasks will be removed."
            isDangerous
            confirmLabel="Delete"
            cancelLabel="Cancel"
            onClose={() => setDialogOpen(false)}
            onCancel={() => setDialogOpen(false)}
            onConfirm={() => setDialogOpen(false)}
            triggerRef={dialogTriggerRef}
          />
        </section>

        {/* Skeleton */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Skeleton Loaders</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Skeleton width="40%" height="24px" />
            <Skeleton width="100%" height="16px" />
            <Skeleton width="80%" height="16px" />
          </div>
        </section>

        {/* Avatars */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Avatars (Bilingual & Initials)</h2>
          <div className={styles.componentRow}>
            <Avatar name="Sara Ali" size="md" />
            <Avatar name="Sara Ali" size="sm" />
            <Avatar name="أحمد محمد" size="md" />
            <Avatar name="أحمد محمد" size="sm" />
            <Avatar name="Zeta Project" size="md" />
          </div>
        </section>

        {/* Charts */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Accessible Charts (HTML/CSS)</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <ChartPanel
              title="Tasks by Project"
              subtitle="Distribution of status across top active projects"
              legend={[
                { key: 'todo', label: 'To do', color: 'var(--chart-todo)' },
                { key: 'in_progress', label: 'In progress', color: 'var(--chart-progress)' },
                { key: 'done', label: 'Done', color: 'var(--chart-done)' },
              ]}
              table={{
                headers: ['Project', 'To do', 'In progress', 'Done', 'Total'],
                rows: [
                  ['Website Redesign', 2, 3, 5, 10],
                  ['Mobile Application', 4, 1, 1, 6],
                  ['Infrastructure', 1, 2, 4, 7],
                ],
              }}
            >
              <StackedBars
                ariaLabel="Tasks by Project showcase"
                series={[
                  { key: 'todo', label: 'To do', color: 'var(--chart-todo)' },
                  { key: 'in_progress', label: 'In progress', color: 'var(--chart-progress)' },
                  { key: 'done', label: 'Done', color: 'var(--chart-done)' },
                ]}
                rows={[
                  { id: '1', label: 'Website Redesign', values: { todo: 2, in_progress: 3, done: 5 } },
                  { id: '2', label: 'Mobile Application', values: { todo: 4, in_progress: 1, done: 1 } },
                  { id: '3', label: 'Infrastructure', values: { todo: 1, in_progress: 2, done: 4 } },
                ]}
              />
            </ChartPanel>

            <ChartPanel
              title="Due in Next 14 Days"
              subtitle="Timeline density with overdue callout"
              table={{
                headers: ['Day', 'Tasks'],
                rows: [
                  ['Overdue', 2],
                  ['Today', 4],
                  ['Tomorrow', 1],
                  ['In 3 days', 3],
                ],
              }}
            >
              <ColumnChart
                ariaLabel="Timeline showcase"
                valueLabel="tasks"
                buckets={[
                  { id: 'od', label: 'Overdue', value: 2, tone: 'overdue' },
                  { id: 'today', label: 'Today', value: 4, highlight: true },
                  { id: 'tom', label: 'Tomorrow', value: 1 },
                  { id: 'd3', label: 'Day 3', value: 3 },
                  { id: 'd4', label: 'Day 4', value: 0 },
                  { id: 'd5', label: 'Day 5', value: 2 },
                ]}
              />
            </ChartPanel>

            <ChartPanel
              title="Priority Breakdown"
              subtitle="Open tasks by urgency tier"
              table={{
                headers: ['Priority', 'Tasks'],
                rows: [
                  ['High', 6],
                  ['Medium', 11],
                  ['Low', 4],
                ],
              }}
            >
              <HBars
                ariaLabel="Priority breakdown showcase"
                rows={[
                  { id: 'high', label: 'High', value: 6 },
                  { id: 'med', label: 'Medium', value: 11 },
                  { id: 'low', label: 'Low', value: 4 },
                ]}
              />
            </ChartPanel>
          </div>
        </section>

        {/* Application Shell */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Application Shell (Sidebar & TopBar)</h2>
          <Card>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                The application shell provides responsive navigation: a persistent desktop sidebar (264px–280px) on wide viewports, a focus-trapped sliding drawer on mobile (≤1024px), a top bar featuring Section Title, Language Switcher, Theme Toggle, and a keyboard-navigable User Profile Menu.
              </p>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <span className={styles.swatchRole} style={{ margin: 0 }}>Sidebar Width: 264px – 280px</span>
                <span className={styles.swatchRole} style={{ margin: 0 }}>Breakpoint: 1024px</span>
                <span className={styles.swatchRole} style={{ margin: 0 }}>Max Content Width: 80rem</span>
              </div>
            </div>
          </Card>
        </section>
      </main>
    </ToastProvider>
  );
}
