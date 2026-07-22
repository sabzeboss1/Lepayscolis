'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import type { Country } from '@/lib/types/location';

/**
 * Convert ISO country code to flag emoji.
 * Works by mapping each letter to its regional indicator symbol.
 */
function countryCodeToFlag(code: string): string {
  return code
    .toUpperCase()
    .split('')
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join('');
}

export interface PhoneInputProps {
  countries: Country[];
  isLoadingCountries?: boolean;
  /** Currently selected country code (ISO), controlled */
  selectedCountryCode: string;
  /** Called when user picks a different country */
  onCountryChange: (code: string) => void;
  /** Phone number value (local part only) */
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  name?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      countries,
      isLoadingCountries,
      selectedCountryCode,
      onCountryChange,
      value,
      onChange,
      onBlur,
      name,
      placeholder,
      error,
      helperText,
      disabled,
    },
    ref
  ) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const selectedCountry = countries.find((c) => c.code === selectedCountryCode);

    // Close dropdown on outside click
    useEffect(() => {
      function handleClick(e: MouseEvent) {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
          setOpen(false);
          setSearch('');
        }
      }
      if (open) {
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
      }
    }, [open]);

    // Focus search when dropdown opens
    useEffect(() => {
      if (open && searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, [open]);

    const filteredCountries = search
      ? countries.filter(
          (c) =>
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.name_fr.toLowerCase().includes(search.toLowerCase()) ||
            c.code.toLowerCase().includes(search.toLowerCase()) ||
            c.phone_code.includes(search)
        )
      : countries;

    const borderColor = error ? '#ef4444' : '#d1d5db';

    return (
      <div className="w-full">
        <label
          htmlFor="phone"
          className="block text-sm font-medium mb-1"
          style={{ color: '#374151' }}
        >
          Numéro de téléphone
        </label>

        <div className="flex relative" ref={dropdownRef}>
          {/* Country selector button */}
          <button
            type="button"
            disabled={disabled || isLoadingCountries}
            onClick={() => setOpen(!open)}
            className="inline-flex items-center gap-1.5 px-3 rounded-l-lg border border-r-0 text-sm font-medium shrink-0 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              borderColor,
              background: '#f9fafb',
              color: '#374151',
              minHeight: '44px',
            }}
            aria-label="Sélectionner le pays"
            aria-expanded={open}
            aria-haspopup="listbox"
          >
            {selectedCountry ? (
              <>
                <span className="text-lg leading-none">{countryCodeToFlag(selectedCountry.code)}</span>
                <span>{selectedCountry.phone_code}</span>
              </>
            ) : (
              <span className="text-gray-400">Pays</span>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {/* Phone input */}
          <input
            ref={ref}
            id="phone"
            name={name}
            type="tel"
            autoComplete="tel"
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            placeholder={placeholder || 'Numéro de téléphone'}
            className="flex-1 px-4 py-3 min-h-[44px] min-w-0 rounded-r-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
            style={{ borderColor, color: '#111827' }}
            aria-invalid={!!error}
            aria-describedby={error ? 'phone-error' : helperText ? 'phone-helper' : undefined}
          />

          {/* Dropdown */}
          {open && (
            <div
              className="absolute left-0 top-full mt-1 w-72 max-h-64 bg-white rounded-lg border border-gray-200 shadow-xl z-50 flex flex-col overflow-hidden"
              role="listbox"
              aria-label="Liste des pays"
            >
              {/* Search */}
              <div className="p-2 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher un pays..."
                    className="w-full pl-8 pr-3 py-2 text-sm rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setOpen(false);
                        setSearch('');
                      }
                    }}
                  />
                </div>
              </div>

              {/* Country list */}
              <div className="overflow-y-auto flex-1">
                {filteredCountries.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500">Aucun pays trouvé</div>
                ) : (
                  filteredCountries.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      role="option"
                      aria-selected={c.code === selectedCountryCode}
                      onClick={() => {
                        onCountryChange(c.code);
                        setOpen(false);
                        setSearch('');
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-blue-50 transition-colors ${
                        c.code === selectedCountryCode ? 'bg-blue-50 font-medium' : ''
                      }`}
                    >
                      <span className="text-lg leading-none">{countryCodeToFlag(c.code)}</span>
                      <span className="flex-1 truncate">{c.name}</span>
                      <span className="text-gray-400 text-xs">{c.phone_code}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {error && (
          <p id="phone-error" className="mt-1 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id="phone-helper" className="mt-1 text-xs text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

PhoneInput.displayName = 'PhoneInput';
