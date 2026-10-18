import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ProjectSummary } from '@/lib/dashboardMetrics';
import { useI18n } from '@/i18n/I18nProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/Icon';
import { toDate } from '@/lib/dates';
import styles from './ProjectsTable.module.css';

export interface ProjectsTableProps {
  summaries: ProjectSummary[];
}

type SortColumn = 'name' | 'role' | 'progress' | 'open' | 'overdue' | 'updated';

export function ProjectsTable({ summaries }: ProjectsTableProps): React.ReactElement {
  const { t, locale } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleHeaderClick = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const filteredAndSorted = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const list = summaries.filter((s) => {
      if (!term) return true;
      const name = s.project.name.toLowerCase();
      const desc = (s.project.description || '').toLowerCase();
      return name.includes(term) || desc.includes(term);
    });

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortColumn) {
        case 'name':
          cmp = a.project.name.localeCompare(b.project.name, locale);
          break;
        case 'role':
          cmp = a.role.localeCompare(b.role);
          break;
        case 'progress':
          cmp = a.progress - b.progress;
          break;
        case 'open':
          cmp = a.open - b.open;
          break;
        case 'overdue':
          cmp = a.overdue - b.overdue;
          break;
        case 'updated': {
          const dateA = toDate(a.project.updatedAt)?.getTime() || 0;
          const dateB = toDate(b.project.updatedAt)?.getTime() || 0;
          cmp = dateA - dateB;
          break;
        }
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [summaries, searchTerm, sortColumn, sortDirection, locale]);

  const getAriaSort = (column: SortColumn): 'ascending' | 'descending' | 'none' => {
    if (sortColumn !== column) return 'none';
    return sortDirection === 'asc' ? 'ascending' : 'descending';
  };

  const renderSortIndicator = (column: SortColumn) => {
    if (sortColumn !== column) return null;
    return (
      <span className={styles.sortIndicator} aria-hidden="true">
        {sortDirection === 'asc' ? ' ▲' : ' ▼'}
      </span>
    );
  };

  return (
    <div className={styles.panel} role="region" aria-label={t('dashboard.projects.title')}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <span className={styles.title}>{t('dashboard.projects.title')}</span>
          <span className={`${styles.countBadge} num`}>{summaries.length}</span>
        </div>

        <div className={styles.controls}>
          <div className={styles.searchWrapper}>
            <Icon name="search" size={16} className={styles.searchIcon} />
            <input
              type="search"
              className={styles.searchInput}
              placeholder={t('dashboard.table.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label={t('dashboard.table.searchPlaceholder')}
            />
          </div>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th
                scope="col"
                className={`${styles.th} ${styles.thSortable}`}
                aria-sort={getAriaSort('name')}
                onClick={() => handleHeaderClick('name')}
              >
                {t('dashboard.table.project')}
                {renderSortIndicator('name')}
              </th>
              <th
                scope="col"
                className={`${styles.th} ${styles.thSortable}`}
                aria-sort={getAriaSort('role')}
                onClick={() => handleHeaderClick('role')}
              >
                {t('dashboard.table.role')}
                {renderSortIndicator('role')}
              </th>
              <th scope="col" className={styles.th}>
                {t('dashboard.table.members')}
              </th>
              <th
                scope="col"
                className={`${styles.th} ${styles.thSortable}`}
                aria-sort={getAriaSort('progress')}
                onClick={() => handleHeaderClick('progress')}
              >
                {t('dashboard.table.progress')}
                {renderSortIndicator('progress')}
              </th>
              <th
                scope="col"
                className={`${styles.th} ${styles.thSortable}`}
                aria-sort={getAriaSort('open')}
                onClick={() => handleHeaderClick('open')}
              >
                {t('dashboard.table.open')}
                {renderSortIndicator('open')}
              </th>
              <th
                scope="col"
                className={`${styles.th} ${styles.thSortable}`}
                aria-sort={getAriaSort('overdue')}
                onClick={() => handleHeaderClick('overdue')}
              >
                {t('dashboard.table.overdue')}
                {renderSortIndicator('overdue')}
              </th>
              <th
                scope="col"
                className={`${styles.th} ${styles.thSortable}`}
                aria-sort={getAriaSort('updated')}
                onClick={() => handleHeaderClick('updated')}
              >
                {t('dashboard.table.updated')}
                {renderSortIndicator('updated')}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.emptyState}>
                  {t('dashboard.table.emptySearch')}
                </td>
              </tr>
            ) : (
              filteredAndSorted.map((summary) => {
                const proj = summary.project;
                const memberIds = proj.memberIds || [];
                const displayMemberIds = memberIds.slice(0, 4);
                const extraMembers = memberIds.length - displayMemberIds.length;
                const updatedDate = toDate(proj.updatedAt);
                const updatedFormatted = updatedDate
                  ? new Intl.DateTimeFormat(locale, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    }).format(updatedDate)
                  : '—';

                return (
                  <tr key={proj.id} className={styles.tr}>
                    <td className={styles.td} data-label={t('dashboard.table.project')}>
                      <div className={styles.projectCell}>
                        <Link href={`/projects/${proj.id}`} className={styles.projectLink}>
                          <bdi dir="auto">{proj.name}</bdi>
                        </Link>
                        {proj.description && (
                          <span className={styles.projectDesc} title={proj.description}>
                            <bdi dir="auto">{proj.description}</bdi>
                          </span>
                        )}
                      </div>
                    </td>

                    <td className={styles.td} data-label={t('dashboard.table.role')}>
                      <span
                        className={`${styles.roleBadge} ${
                          summary.role === 'owner' ? styles.roleOwner : styles.roleMember
                        }`}
                      >
                        {summary.role === 'owner'
                          ? t('dashboard.table.roleOwner')
                          : t('dashboard.table.roleMember')}
                      </span>
                    </td>

                    <td className={styles.td} data-label={t('dashboard.table.members')}>
                      <div className={styles.avatarGroup}>
                        {displayMemberIds.map((uid) => {
                          const mName = proj.memberNames?.[uid] || 'Member';
                          return (
                            <span key={uid} className={styles.avatarItem} title={mName}>
                              <Avatar name={mName} size="sm" />
                            </span>
                          );
                        })}
                        {extraMembers > 0 && (
                          <span className={styles.moreAvatar} title={`+${extraMembers} more`}>
                            +{extraMembers}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className={styles.td} data-label={t('dashboard.table.progress')}>
                      <div className={styles.progressCell}>
                        <div
                          className={styles.progressBarTrack}
                          role="progressbar"
                          aria-valuenow={summary.progress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div
                            className={styles.progressBarFill}
                            style={{ inlineSize: `${summary.progress}%` }}
                          />
                        </div>
                        <span className={`${styles.progressText} num`}>
                          {summary.progress}%
                        </span>
                      </div>
                    </td>

                    <td className={styles.td} data-label={t('dashboard.table.open')}>
                      <span className="num">{summary.open}</span>
                    </td>

                    <td className={styles.td} data-label={t('dashboard.table.overdue')}>
                      <span
                        className={`num ${
                          summary.overdue > 0 ? styles.overdueText : ''
                        }`}
                      >
                        {summary.overdue}
                      </span>
                    </td>

                    <td className={styles.td} data-label={t('dashboard.table.updated')}>
                      <span className="num" title={updatedDate?.toISOString() || ''}>
                        {updatedFormatted}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
