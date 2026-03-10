'use client';

import { useState } from 'react';
import { Search, X, ChevronDown, ChevronUp, Filter } from 'lucide-react';

export interface FilterConfig {
  key: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'daterange';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface FilterValues {
  [key: string]: string | { from: string; to: string };
}

interface TableFiltersProps {
  filters: FilterConfig[];
  values: FilterValues;
  onChange: (values: FilterValues) => void;
  onReset: () => void;
}

export default function TableFilters({
  filters,
  values,
  onChange,
  onReset
}: TableFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleChange = (key: string, value: string | { from: string; to: string }) => {
    onChange({
      ...values,
      [key]: value
    });
  };

  const handleReset = () => {
    onReset();
  };

  const hasActiveFilters = Object.values(values).some(value => {
    if (typeof value === 'string') {
      return value !== '';
    }
    return value.from !== '' || value.to !== '';
  });

  const activeFilterCount = Object.values(values).filter(value => {
    if (typeof value === 'string') {
      return value !== '';
    }
    return value.from !== '' || value.to !== '';
  }).length;

  return (
    <div className="bg-white rounded-lg shadow mb-6">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {activeFilterCount} active
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Reset</span>
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={isExpanded ? 'Collapse filters' : 'Expand filters'}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Filter inputs */}
      <div
        className={`
          px-6 py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4
          ${isExpanded ? 'block' : 'hidden lg:grid'}
        `}
      >
        {filters.map((filter) => {
          switch (filter.type) {
            case 'text':
              return (
                <div key={filter.key}>
                  <label
                    htmlFor={filter.key}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {filter.label}
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id={filter.key}
                      type="text"
                      value={(values[filter.key] as string) || ''}
                      onChange={(e) => handleChange(filter.key, e.target.value)}
                      placeholder={filter.placeholder || `Search ${filter.label.toLowerCase()}...`}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              );

            case 'select':
              return (
                <div key={filter.key}>
                  <label
                    htmlFor={filter.key}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {filter.label}
                  </label>
                  <select
                    id={filter.key}
                    value={(values[filter.key] as string) || ''}
                    onChange={(e) => handleChange(filter.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All {filter.label}</option>
                    {filter.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              );

            case 'date':
              return (
                <div key={filter.key}>
                  <label
                    htmlFor={filter.key}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {filter.label}
                  </label>
                  <input
                    id={filter.key}
                    type="date"
                    value={(values[filter.key] as string) || ''}
                    onChange={(e) => handleChange(filter.key, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              );

            case 'daterange':
              const dateRange = (values[filter.key] as { from: string; to: string }) || {
                from: '',
                to: ''
              };
              return (
                <div key={filter.key} className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {filter.label}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="date"
                        value={dateRange.from}
                        onChange={(e) =>
                          handleChange(filter.key, {
                            ...dateRange,
                            from: e.target.value
                          })
                        }
                        placeholder="From"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <input
                        type="date"
                        value={dateRange.to}
                        onChange={(e) =>
                          handleChange(filter.key, {
                            ...dateRange,
                            to: e.target.value
                          })
                        }
                        placeholder="To"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              );

            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}
