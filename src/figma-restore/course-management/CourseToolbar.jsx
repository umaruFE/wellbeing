import React from 'react';
import { Input, Select } from 'antd';
import { Search } from 'lucide-react';
import { statusOptions } from './courseData';

export function CourseToolbar({
  search,
  status,
  counts,
  onSearchChange,
  onStatusChange,
}) {
  return (
    <div className="fr-cm-toolbar">
      <Input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="搜索课程"
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
