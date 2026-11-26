import { LibraryFilterSelect, LibrarySearch } from '../../components/LibraryControls';
import React from 'react';
import { useTranslation } from 'react-i18next';

export function CourseToolbar({
  search,
  status,
  counts,
  searchRef,
  onSearchChange,
  onStatusChange,
}) {
  const { t } = useTranslation();
  const statusOptions = [
    { value: 'all', label: t('course.allStatus') },
    { value: 'draft', label: t('course.draft') },
    { value: 'published', label: t('course.published') },
  ];

  return (
    <div className="fr-cm-toolbar">
      <LibraryFilterSelect
        className="fr-cm-status-filter"
        label={t('common.status')}
        value={status}
        onChange={onStatusChange}
        options={statusOptions.map(option => ({
          value: option.value,
          label: `${option.label} (${counts[option.value] || 0})`,
        }))}
      />
      <LibrarySearch label={t('course.searchPlaceholder')} value={search} onChange={onSearchChange} inputRef={searchRef} />
    </div>
  );
}
