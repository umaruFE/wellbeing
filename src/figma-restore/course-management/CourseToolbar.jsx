import React from 'react';
import { Input, Select } from 'antd';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function CourseToolbar({
  search,
  status,
  counts,
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
      <Input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={t('course.searchPlaceholder')}
        prefix={<Search size={14} />}
      />

      <Select
        value={status}
        onChange={onStatusChange}
        options={statusOptions.map(option => ({
          value: option.value,
          label: `${option.label} (${counts[option.value] || 0})`,
        }))}
      />
    </div>
  );
}
