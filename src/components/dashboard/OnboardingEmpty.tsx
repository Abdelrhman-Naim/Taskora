import React from 'react';
import Link from 'next/link';
import { useI18n } from '@/i18n/I18nProvider';
import { Icon } from '@/components/ui/Icon';
import styles from './OnboardingEmpty.module.css';

export interface OnboardingEmptyProps {
  onCreateProject?: () => void;
}

export function OnboardingEmpty({ onCreateProject }: OnboardingEmptyProps): React.ReactElement {
  const { t } = useI18n();

  return (
    <div
      data-testid="onboarding"
      className={styles.container}
      role="region"
      aria-label={t('dashboard.onboarding.title')}
    >
      <h2 className={styles.title}>{t('dashboard.onboarding.title')}</h2>
      <p className={styles.subtitle}>
        <strong>{t('dashboard.projects.emptyTitle')}</strong> — {t('dashboard.projects.emptyDescription')}
      </p>

      <div className={styles.steps}>
        <div className={styles.stepCard}>
          <div className={`${styles.stepNumber} num`}>1</div>
          <span className={styles.stepTitle}>{t('dashboard.onboarding.step1')}</span>
          <span className={styles.stepDesc}>{t('dashboard.onboarding.step1Desc')}</span>
        </div>

        <div className={styles.stepCard}>
          <div className={`${styles.stepNumber} num`}>2</div>
          <span className={styles.stepTitle}>{t('dashboard.onboarding.step2')}</span>
          <span className={styles.stepDesc}>{t('dashboard.onboarding.step2Desc')}</span>
        </div>

        <div className={styles.stepCard}>
          <div className={`${styles.stepNumber} num`}>3</div>
          <span className={styles.stepTitle}>{t('dashboard.onboarding.step3')}</span>
          <span className={styles.stepDesc}>{t('dashboard.onboarding.step3Desc')}</span>
        </div>
      </div>

      {onCreateProject ? (
        <button
          type="button"
          className={styles.ctaButton}
          onClick={onCreateProject}
        >
          <Icon name="plus" size={16} />
          <span>{t('dashboard.onboarding.cta')}</span>
        </button>
      ) : (
        <Link href="/projects/new" className={styles.ctaButton}>
          <Icon name="plus" size={16} />
          <span>{t('dashboard.onboarding.cta')}</span>
        </Link>
      )}
    </div>
  );
}
