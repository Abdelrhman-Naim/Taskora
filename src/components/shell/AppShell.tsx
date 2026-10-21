import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileDrawer } from './MobileDrawer';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { ProjectsProvider } from '@/components/projects/ProjectsProvider';
import { NotificationsProvider } from '@/components/notifications/NotificationsProvider';
import styles from './AppShell.module.css';

export interface AppShellProps {
  children: React.ReactNode;
  title?: string;
}

export function AppShell({ children, title }: AppShellProps): React.ReactElement {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <RequireAuth>
      <ProjectsProvider>
        <NotificationsProvider>
          <div className={styles.shell}>
            <div className={styles.desktopSidebar}>
              <Sidebar />
            </div>

            <div className={styles.mainWrapper}>
              <TopBar
                title={title}
                onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
              />
              <main className={styles.mainContent}>
                {children}
              </main>
            </div>

            <MobileDrawer
              isOpen={isMobileMenuOpen}
              onClose={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </NotificationsProvider>
      </ProjectsProvider>
    </RequireAuth>
  );
}
