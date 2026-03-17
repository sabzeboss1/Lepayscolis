'use client';

import React, { useEffect, useRef } from 'react';
import { Select } from './Select';
import { useCountries } from '@/lib/hooks/useCountries';
import { useTranslation } from '@/lib/i18n/useTranslation';

export interface CitySelectProps {
  countryId?: number;
  value?: number;
  onChange: (cityId: number | null) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
}

export const CitySelect: React.FC<CitySelectProps> = ({
  countryId,
  value,
  onChange,
  label,
  error,
  disabled,
  placeholder,
  required,
}) => {
  const { getCitiesByCountryId } = useCountries();
  const { t } = useTranslation();
  const prevCountryId = useRef(countryId);

  // Reset city when country changes
  useEffect(() => {
    if (prevCountryId.current !== countryId) {
      prevCountryId.current = countryId;
      onChange(null);
    }
  }, [countryId, onChange]);

  const cities = countryId ? getCitiesByCountryId(countryId) : [];

  const options = cities.map((city) => ({
    value: String(city.id),
    label: city.name,
  }));

  const handleChange = (val: string) => {
    onChange(val ? Number(val) : null);
  };

  const isDisabled = disabled || !countryId;

  return (
    <Select
      label={label}
      value={value ? String(value) : ''}
      onChange={handleChange}
      options={options}
      placeholder={
        placeholder || (!countryId ? t('trips.selectCountryFirst') : t('common.select'))
      }
      error={error}
      disabled={isDisabled}
      required={required}
    />
  );
};
