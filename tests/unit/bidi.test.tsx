import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nProvider } from '@/i18n/I18nProvider';

// Dummy components to test Bidi isolation patterns
function ProjectItem({ name }: { name: string }) {
  return (
    <div data-testid="project-container">
      <bdi data-testid="project-name">{name}</bdi>
    </div>
  );
}

function WelcomeGreeting({ name }: { name: string }) {
  return (
    <h1 data-testid="greeting-container">
      Welcome back, <bdi data-testid="user-name">{name}</bdi>
    </h1>
  );
}

describe('Bidi Isolation (Task 22 Step 3)', () => {
  it('renders project names inside <bdi> without dir="auto" on container in en locale', () => {
    const arabicName = 'مشروع المنصة الجديدة 2026';
    render(
      <I18nProvider initialLocale="en">
        <ProjectItem name={arabicName} />
      </I18nProvider>
    );

    const container = screen.getByTestId('project-container');
    expect(container.getAttribute('dir')).not.toBe('auto');

    const bdi = screen.getByTestId('project-name');
    expect(bdi.tagName.toLowerCase()).toBe('bdi');
    expect(bdi.textContent).toBe(arabicName);
  });

  it('renders project names inside <bdi> without dir="auto" on container in ar locale', () => {
    const englishName = 'Taskora Mobile App 2.0';
    render(
      <I18nProvider initialLocale="ar">
        <ProjectItem name={englishName} />
      </I18nProvider>
    );

    const container = screen.getByTestId('project-container');
    expect(container.getAttribute('dir')).not.toBe('auto');

    const bdi = screen.getByTestId('project-name');
    expect(bdi.tagName.toLowerCase()).toBe('bdi');
    expect(bdi.textContent).toBe(englishName);
  });

  it('renders project names starting with numbers inside <bdi>', () => {
    const numericName = '360 Analytics Platform';
    render(
      <I18nProvider initialLocale="en">
        <ProjectItem name={numericName} />
      </I18nProvider>
    );

    const container = screen.getByTestId('project-container');
    expect(container.getAttribute('dir')).not.toBe('auto');

    const bdi = screen.getByTestId('project-name');
    expect(bdi.tagName.toLowerCase()).toBe('bdi');
    expect(bdi.textContent).toBe(numericName);
  });

  it('renders user greeting with name enclosed in <bdi>', () => {
    const userName = 'سارة أحمد';
    render(
      <I18nProvider initialLocale="en">
        <WelcomeGreeting name={userName} />
      </I18nProvider>
    );

    const greetingContainer = screen.getByTestId('greeting-container');
    expect(greetingContainer.getAttribute('dir')).not.toBe('auto');

    const bdi = screen.getByTestId('user-name');
    expect(bdi.tagName.toLowerCase()).toBe('bdi');
    expect(bdi.textContent).toBe(userName);
  });
});
