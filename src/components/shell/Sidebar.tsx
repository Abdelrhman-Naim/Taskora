import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useProjects } from '@/components/projects/ProjectsProvider';
import { useI18n } from '@/i18n/I18nProvider';
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
        >
          <Icon name="plus" size={16} />
          <span>{t('nav.newProject')}</span>
        </Link>
      </div>
    </nav>
  );
}
