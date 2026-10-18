import React from 'react';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/i18n/I18nProvider';
import { ThemeToggle } from '@/theme/ThemeToggle';
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher';
import { UserMenu } from './UserMenu';
import { Icon } from '@/components/ui/Icon';
import styles from './TopBar.module.css';

export interface TopBarProps {
  onOpenMobileMenu: () => void;
  title?: string;
}

export function TopBar({ onOpenMobileMenu, title }: TopBarProps): React.ReactElement {
  const pathname = usePathname();
  const { t } = useI18n();

  const getSectionTitle = () => {
    if (title) return title;
    if (pathname === '/dashboard') return t('nav.dashboard');
    if (pathname === '/projects/new') return t('project.new.title');
    if (pathname.includes('/settings')) return t('project.edit.title');
    if (pathname.startsWith('/projects/')) return t('nav.projects');
    return t('app.name');
  };

  return (
    <header className={styles.topBar}>
      <div className={styles.leftSection}>
        <button
          type="button"
          className={styles.mobileMenuBtn}
          onClick={onOpenMobileMenu}
          aria-label={t('nav.openMenu')}
        >
          <Icon name="menu" size={20} />
        </button>

        <span className={styles.pageTitle}>{getSectionTitle()}</span>
      </div>

      <div className={styles.rightSection}>
        <LocaleSwitcher />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
