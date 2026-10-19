import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useProjects } from '@/components/projects/ProjectsProvider';
import { useI18n } from '@/i18n/I18nProvider';
import { useAuth } from '@/hooks/useAuth';
import { logoutUser } from '@/services/auth';
import { getAuthInstance } from '@/lib/firebase';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { Project } from '@/types';
import styles from './Sidebar.module.css';

export interface SidebarProps {
  openProjects?: Project[];
  onCloseMobile?: () => void;
  className?: string;
}

export function Sidebar({
  openProjects,
  onCloseMobile,
  className,
}: SidebarProps): React.ReactElement {
  const pathname = usePathname();
  const { t } = useI18n();
  const { projects: contextProjects } = useProjects();

  const projects = openProjects || contextProjects || [];
  const displayProjects = projects.slice(0, 8);
  const hasMore = projects.length > 8;

  const isDashboardActive = pathname === '/dashboard';
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const auth = getAuthInstance();
      await logoutUser(auth);
      router.replace('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <nav
      data-testid="app-sidebar"
      className={`${styles.sidebar} ${className || ''}`}
      aria-label={t('nav.main')}
    >
      <Link href="/dashboard" className={styles.brand} onClick={onCloseMobile}>
        <div className={styles.brandIcon} aria-hidden="true">
          T
        </div>
        <span className={styles.brandName}>{t('app.name')}</span>
      </Link>

      <div className={styles.navSection}>
        <Link
          href="/dashboard"
          className={`${styles.navLink} ${isDashboardActive ? styles.navLinkActive : ''}`}
          aria-current={isDashboardActive ? 'page' : undefined}
          onClick={onCloseMobile}
        >
          <Icon name="dashboard" size={18} />
          <span>{t('nav.dashboard')}</span>
        </Link>
      </div>

      <div className={styles.navSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionTitle}>{t('nav.projects')}</span>
          <span className="num" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
            {projects.length}
          </span>
        </div>

        <div className={styles.projectList}>
          {displayProjects.map((proj) => {
            const isProjActive = pathname === `/projects/${proj.id}` || pathname.startsWith(`/projects/${proj.id}/`);

            return (
              <Link
                key={proj.id}
                href={`/projects/${proj.id}`}
                className={`${styles.projectLink} ${isProjActive ? styles.projectLinkActive : ''}`}
                aria-current={isProjActive ? 'page' : undefined}
                onClick={onCloseMobile}
              >
                <span className={styles.projectDot} aria-hidden="true" />
                <span className={styles.projectName}>
                  <bdi>{proj.name}</bdi>
                </span>
              </Link>
            );
          })}

          {hasMore && (
            <Link
              href="/dashboard"
              className={styles.viewAllLink}
              onClick={onCloseMobile}
            >
              {t('nav.viewAll')} ({projects.length})
            </Link>
          )}
        </div>
      </div>

      <div className={styles.bottomAction}>
        <Link
          href="/projects/new"
          className={styles.newProjectBtn}
          onClick={onCloseMobile}
          aria-label={`+ ${t('nav.newProject')}`}
        >
          <Icon name="plus" size={16} />
          <span>{t('nav.newProject')}</span>
        </Link>
      </div>

      {user && (
        <div className={styles.userSection}>
          <div className={styles.userInfo}>
            <Avatar name={user.displayName || user.email || 'User'} size="sm" />
            <span className={styles.userDisplayName}>
              <bdi dir="auto">{user.displayName || user.email}</bdi>
            </span>
          </div>
          <button
            type="button"
            className={styles.logoutBtn}
            onClick={handleLogout}
            aria-label={t('nav.logout')}
          >
            <Icon name="logout" size={16} />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      )}
    </nav>
  );
}
