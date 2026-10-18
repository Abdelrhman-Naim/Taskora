import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Avatar } from '@/components/ui/Avatar';
import { StackedBars, Series } from '@/components/charts/StackedBars';
import { ColumnChart } from '@/components/charts/ColumnChart';
import { HBars } from '@/components/charts/HBars';
import { ChartPanel } from '@/components/charts/ChartPanel';
import { I18nProvider } from '@/i18n/I18nProvider';

function renderWithI18n(ui: React.ReactElement, locale: 'en' | 'ar' = 'en') {
  return render(
    <I18nProvider initialLocale={locale}>
      {ui}
    </I18nProvider>
  );
}

describe('Chart Primitives & Avatar (Task 24 TDD)', () => {
  describe('Avatar', () => {
    it('produces "SA" for "Sara Ali"', () => {
      render(<Avatar name="Sara Ali" />);
      expect(screen.getByText('SA')).toBeInTheDocument();
    });

    it('produces "أم" for "أحمد محمد"', () => {
      render(<Avatar name="أحمد محمد" />);
      expect(screen.getByText('أم')).toBeInTheDocument();
    });

    it('handles single word name "Admin" -> "A"', () => {
      render(<Avatar name="Admin" />);
      expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('handles empty name gracefully', () => {
      render(<Avatar name="" />);
      expect(screen.getByText('?')).toBeInTheDocument();
    });
  });

  describe('StackedBars', () => {
    const series: Series[] = [
      { key: 'todo', label: 'To do', color: 'var(--chart-todo)' },
      { key: 'in_progress', label: 'In progress', color: 'var(--chart-progress)' },
      { key: 'done', label: 'Done', color: 'var(--chart-done)' },
    ];

    it('renders stacked slices with correct total and skips 0-value slice', () => {
      const rows = [
        {
          id: 'proj-1',
          label: 'Website Redesign',
          values: { todo: 2, in_progress: 1, done: 3 },
        },
        {
          id: 'proj-2',
          label: 'Mobile App',
          values: { todo: 0, in_progress: 2, done: 0 },
        },
      ];

      renderWithI18n(<StackedBars rows={rows} series={series} ariaLabel="Project status breakdown" />);

      // Total "6" and "2" are displayed textually
      expect(screen.getByText('6')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();

      // Row has tabIndex=0 and accessible aria-label with numbers
      const row1 = screen.getByLabelText(/Website Redesign.*2 To do.*1 In progress.*3 Done/i);
      expect(row1).toBeInTheDocument();
      expect(row1).toHaveAttribute('tabindex', '0');

      // Focus shows tooltip with full description
      fireEvent.focus(row1);
      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      // Escape closes tooltip
      fireEvent.keyDown(row1, { key: 'Escape' });
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  describe('ColumnChart', () => {
    it('renders empty message when all bucket values are 0', () => {
      const buckets = [
        { id: '1', label: 'Today', value: 0 },
        { id: '2', label: 'Tomorrow', value: 0 },
      ];

      renderWithI18n(<ColumnChart buckets={buckets} ariaLabel="Due timeline" valueLabel="tasks" />);
      expect(screen.getByText(/no upcoming tasks/i)).toBeInTheDocument();
    });

    it('renders column bars with highlights and overdue tones', () => {
      const buckets = [
        { id: '1', label: 'Overdue', value: 3, tone: 'overdue' as const },
        { id: '2', label: 'Today', value: 5, highlight: true },
        { id: '3', label: 'Tomorrow', value: 2 },
      ];

      renderWithI18n(<ColumnChart buckets={buckets} ariaLabel="Due timeline" valueLabel="tasks" />);
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();

      // Column bar is keyboard focusable
      const todayBar = screen.getByLabelText(/Today: 5 tasks/i);
      expect(todayBar).toBeInTheDocument();
      expect(todayBar).toHaveAttribute('tabindex', '0');
    });

    it('formats large numbers cleanly like 1k without layout breakage', () => {
      const buckets = [
        { id: '1', label: 'Huge backlog', value: 1200 },
      ];

      renderWithI18n(<ColumnChart buckets={buckets} ariaLabel="Backlog" valueLabel="tasks" />);
      expect(screen.getByText('1.2k')).toBeInTheDocument();
      expect(screen.getByLabelText(/Huge backlog: 1,200 tasks/i)).toBeInTheDocument();
    });
  });

  describe('HBars', () => {
    it('renders horizontal bars with labels and values', () => {
      const rows = [
        { id: 'high', label: 'High', value: 8 },
        { id: 'medium', label: 'Medium', value: 12 },
        { id: 'low', label: 'Low', value: 4 },
      ];

      renderWithI18n(<HBars rows={rows} ariaLabel="Priority breakdown" />);
      expect(screen.getByText('High')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('12')).toBeInTheDocument();
    });
  });

  describe('ChartPanel', () => {
    it('renders title and toggles between chart and accessible table view', () => {
      const table = {
        headers: ['Project', 'To do', 'In progress', 'Done', 'Total'],
        rows: [
          ['Website', 2, 1, 3, 6],
          ['Mobile', 0, 2, 0, 2],
        ],
      };

      renderWithI18n(
        <ChartPanel
          title="Project Distribution"
          subtitle="All active projects"
          table={table}
        >
          <div data-testid="chart-content">Chart Visual</div>
        </ChartPanel>
      );

      // Title & Subtitle
      expect(screen.getByText('Project Distribution')).toBeInTheDocument();
      expect(screen.getByText('All active projects')).toBeInTheDocument();

      // Visual chart is visible initially
      expect(screen.getByTestId('chart-content')).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();

      // Toggle to table view
      const tableToggleBtn = screen.getByRole('button', { name: /table/i });
      fireEvent.click(tableToggleBtn);

      // Table is now rendered with correct accessible headers and rows
      const tableEl = screen.getByRole('table');
      expect(tableEl).toBeInTheDocument();
      expect(screen.getByText('Website')).toBeInTheDocument();
      expect(screen.getByText('Mobile')).toBeInTheDocument();
      expect(screen.queryByTestId('chart-content')).not.toBeInTheDocument();

      // Toggle back to chart
      const chartToggleBtn = screen.getByRole('button', { name: /chart/i });
      fireEvent.click(chartToggleBtn);
      expect(screen.getByTestId('chart-content')).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });
});
