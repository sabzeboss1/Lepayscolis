'use client';

import React from 'react';
import { Select } from './Select';
import { useCountries } from '@/lib/hooks/useCountries';
import { useTranslation } from '@/lib/i18n/useTranslation';

export interface CountrySelectProps {
  value?: number;
  onChange: (countryId: number | null) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
}

export const CountrySelect: React.FC<CountrySelectProps> = ({
  value,
  onChange,
  label,
  error,
  disabled,
  placeholder,
  required,
}) => {
  const { countries, isLoading } = useCountries();
  const { t } = useTranslation();

  const options = countries.map((country) => ({
    value: String(country.id),
    label: country.name,
  }));

  const handleChange = (val: string) => {
    onChange(val ? Number(val) : null);
  };

  return (
    <Select
      label={label || t('common.selectCountry')}
      value={value ? String(value) : ''}
      onChange={handleChange}
      options={options}
      placeholder={placeholder || t('common.selectCountry')}
      error={error}
      disabled={disabled || isLoading}
      required={required}
    />
  );
};
