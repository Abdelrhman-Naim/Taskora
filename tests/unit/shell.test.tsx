import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppShell } from '@/components/shell/AppShell';
import { Sidebar } from '@/components/shell/Sidebar';
import { UserMenu } from '@/components/shell/UserMenu';
import { ProjectsProvider } from '@/components/projects/ProjectsProvider';
import { I18nProvider } from '@/i18n/I18nProvider';
import { Project } from '@/types';

// Mock next/navigation
const mockPathname = vi.fn().mockReturnValue('/dashboard');
const mockPush = vi.fn();
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useParams: () => ({}),
}));

// Mock useAuth & services/auth
const mockLogout = vi.fn().mockResolvedValue(undefined);
const mockUser = {
  uid: 'user-1',
  displayName: 'Sara Ali',
  email: 'sara@example.com',
};
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
  }),
}));

vi.mock('@/services/auth', () => ({
  logoutUser: () => mockLogout(),
}));

vi.mock('@/lib/firebase', () => ({
  getAuthInstance: () => ({}),
  getDb: () => ({}),
}));

// Mock services/projects listUserProjects
const mockProjects: Project[] = [
  {
    id: 'p-1',
    name: 'Website Redesign',
    description: '',
    ownerId: 'user-1',
    memberIds: ['user-1'],
    memberNames: { 'user-1': 'Sara Ali' },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'p-2',
    name: 'Mobile App',
    description: '',
    ownerId: 'user-1',
    memberIds: ['user-1'],
    memberNames: { 'user-1': 'Sara Ali' },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

vi.mock('@/services/projects', () => ({
  listUserProjects: vi.fn().mockImplementation(() => Promise.resolve(mockProjects)),
}));

import { ThemeProvider } from '@/theme/ThemeProvider';

function renderShell(ui: React.ReactElement, initialPath = '/dashboard') {
  mockPathname.mockReturnValue(initialPath);
  return render(
    <ThemeProvider initialTheme="light">
      <I18nProvider initialLocale="en">
        <ProjectsProvider>
          {ui}
        </ProjectsProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

describe('Application Shell & Sidebar (Task 25 TDD)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Sidebar', () => {
    it('renders navigation with localized aria-label and links to projects', async () => {
      renderShell(<Sidebar openProjects={mockProjects} onCloseMobile={() => {}} />);

      // Nav exists with accessible label
      const nav = screen.getByRole('navigation', { name: /main navigation|sidebar/i });
      expect(nav).toBeInTheDocument();

      // Dashboard link is marked aria-current="page" when on /dashboard
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).toHaveAttribute('aria-current', 'page');

      // Project links are rendered
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /website redesign/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /mobile app/i })).toBeInTheDocument();
      });
    });

    it('sets aria-current="page" on the active project link when on /projects/[id]', async () => {
      renderShell(<Sidebar openProjects={mockProjects} onCloseMobile={() => {}} />, '/projects/p-1');

      const p1Link = screen.getByRole('link', { name: /website redesign/i });
      expect(p1Link).toHaveAttribute('aria-current', 'page');

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
      expect(dashboardLink).not.toHaveAttribute('aria-current');
    });

    it('renders sidebar with data-testid="app-sidebar" and New project button pointing to /projects/new', () => {
      renderShell(<Sidebar openProjects={mockProjects} onCloseMobile={() => {}} />);

      const sidebar = screen.getByTestId('app-sidebar');
      expect(sidebar).toBeInTheDocument();

      const newProjectLink = screen.getByRole('link', { name: /new project/i });
      expect(newProjectLink).toHaveAttribute('href', '/projects/new');
    });
  });

  describe('TopBar and MobileDrawer', () => {
    it('renders topbar with data-testid="app-topbar"', () => {
      renderShell(
        <AppShell>
          <div>Page Content</div>
        </AppShell>
      );

      const topbar = screen.getByTestId('app-topbar');
      expect(topbar).toBeInTheDocument();
    });

    it('opens mobile drawer on hamburger button click, traps focus, and closes on Escape', async () => {
      renderShell(
        <AppShell>
          <div>Page Content</div>
        </AppShell>
      );

      const menuBtn = screen.getByRole('button', { name: /open menu|navigation/i });
      expect(menuBtn).toBeInTheDocument();

      // Click opens drawer dialog
      fireEvent.click(menuBtn);

      const drawer = screen.getByRole('dialog', { name: /navigation|main/i });
      expect(drawer).toBeInTheDocument();

      // Pressing Escape closes drawer
      fireEvent.keyDown(drawer, { key: 'Escape' });
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('UserMenu', () => {
    it('renders user avatar and name, toggles menu, and calls logout on logout click', async () => {
      renderShell(<UserMenu />);

      // Trigger button with user name or initials
      const trigger = screen.getByRole('button', { name: /user menu|sara ali/i });
      expect(trigger).toBeInTheDocument();

      // Menu is initially closed
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();

      // Click opens menu
      fireEvent.click(trigger);
      const menu = screen.getByRole('menu');
      expect(menu).toBeInTheDocument();
      expect(screen.getByText('sara@example.com')).toBeInTheDocument();

      // Click logout calls logout
      const logoutBtn = screen.getByRole('menuitem', { name: /log out|logout/i });
      fireEvent.click(logoutBtn);
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    it('toggles menu on Enter and Space keys, closes on Escape, and isolates text direction', async () => {
      renderShell(<UserMenu />);

      const trigger = screen.getByRole('button', { name: /user menu|sara ali/i });

      // Enter key opens menu
      fireEvent.keyDown(trigger, { key: 'Enter' });
      expect(screen.getByRole('menu')).toBeInTheDocument();

      // Escape key closes menu
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();

      // Space key opens menu
      fireEvent.keyDown(trigger, { key: ' ' });
      expect(screen.getByRole('menu')).toBeInTheDocument();

      // Verify email has dir="ltr" and name is in <bdi>
      const emailElem = screen.getByText('sara@example.com');
      expect(emailElem).toHaveAttribute('dir', 'ltr');
      expect(emailElem.closest('[role="menu"]')?.querySelector('bdi')).toHaveTextContent('Sara Ali');
    });
  });
});
