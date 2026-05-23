import React from 'react';
import { ChevronDown, Filter, Search } from 'lucide-react';
import { statusOptions } from './courseData';

export function CourseToolbar({
  search,
  status,
  counts,
  isFilterOpen,
  onSearchChange,
  onFilterToggle,
  onStatusChange,
}) {
  const current = statusOptions.find(option => option.value === status) || statusOptions[0];

  return (
    <div className="fr-cm-toolbar">
      <div className="fr-cm-search-wrap">
        <Search size={18} aria-hidden="true" />
        <input
          value={search}
          type="search"
          placeholder="搜索课程"
          aria-label="搜索课程"
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="fr-cm-filter-wrap">
        <button className="fr-cm-filter" type="button" onClick={onFilterToggle}>
          <span>
            <Filter size={18} aria-hidden="true" />
            {current.label}
          </span>
          <ChevronDown size={16} className={isFilterOpen ? 'is-open' : ''} aria-hidden="true" />
        </button>

        {isFilterOpen && (
          <div className="fr-cm-filter-menu">
            {statusOptions.map(option => (
              <button
                key={option.value}
                type="button"
                className={option.value === status ? 'is-active' : ''}
                onClick={() => onStatusChange(option.value)}
              >
                <span>{option.label}</span>
                <span>{counts[option.value] || 0}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
