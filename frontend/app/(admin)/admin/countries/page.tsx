'use client';

import { useEffect, useState, useCallback } from 'react';
import { Globe, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, AlertTriangle } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface Country {
  id: number;
  code: string;
  name: string;
  name_en: string;
  name_fr: string;
  phone_code: string;
  default_currency_code: string | null;
  default_locale: string;
  is_active: boolean;
  cities_count?: number;
  created_at: string;
  updated_at: string;
}

interface CountriesResponse {
  data: Country[];
  meta?: {
    total: number;
    active: number;
  };
}

interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export default function AdminCountriesPage() {
  const { t } = useTranslation();
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    code: '',
    name_en: '',
    name_fr: '',
    phone_code: '',
    default_currency_code: '',
    default_locale: 'fr',
    is_active: true,
  });
  const [creating, setCreating] = useState(false);
  const [createErrors, setCreateErrors] = useState<Record<string, string[]>>({});

  // Edit state
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [editForm, setEditForm] = useState({
    code: '',
    name_en: '',
    name_fr: '',
    phone_code: '',
    default_currency_code: '',
    default_locale: 'fr',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [editErrors, setEditErrors] = useState<Record<string, string[]>>({});

  // Delete confirmation
  const [deletingCountry, setDeletingCountry] = useState<Country | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const fetchCountries = useCallback(async () => {
    try {
      setError(null);
      const res = await apiClient.get<CountriesResponse>(API_ENDPOINTS.admin.countries.list);
      setCountries(res.data);
    } catch (err: any) {
      setError(err.message || t('admin.countries.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const fetchCurrencies = useCallback(async () => {
    try {
      const res = await apiClient.get<{ data: Currency[] }>(API_ENDPOINTS.admin.currencies.list);
      setCurrencies(res.data);
    } catch {
      // Currencies are optional for dropdown
    }
  }, []);

  useEffect(() => {
    fetchCountries();
    fetchCurrencies();
  }, [fetchCountries, fetchCurrencies]);

  // ── Toggle active/inactive ──
  const toggleCountry = async (country: Country) => {
    try {
      await apiClient.post(API_ENDPOINTS.admin.countries.toggle(country.id));
      showSuccess(
        country.is_active
          ? t('admin.countries.success.deactivated')
          : t('admin.countries.success.activated')
      );
      await fetchCountries();
    } catch (err: any) {
      setError(err.message || t('admin.countries.errors.toggleFailed'));
    }
  };

  // ── Create country ──
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateErrors({});

    try {
      await apiClient.post(API_ENDPOINTS.admin.countries.store, {
        code: createForm.code.toUpperCase(),
        name_en: createForm.name_en,
        name_fr: createForm.name_fr,
        phone_code: createForm.phone_code,
        default_currency_code: createForm.default_currency_code || null,
        default_locale: createForm.default_locale,
        is_active: createForm.is_active,
      });
      showSuccess(t('admin.countries.success.created'));
      setShowCreateForm(false);
      setCreateForm({ code: '', name_en: '', name_fr: '', phone_code: '', default_currency_code: '', default_locale: 'fr', is_active: true });
      await fetchCountries();
    } catch (err: any) {
      if (err.errors) {
        setCreateErrors(err.errors);
      } else {
        setError(err.message || t('admin.countries.errors.createFailed'));
      }
    } finally {
      setCreating(false);
    }
  };

  // ── Edit country ──
  const startEdit = (country: Country) => {
    setEditingCountry(country);
    setEditForm({
      code: country.code,
      name_en: country.name_en,
      name_fr: country.name_fr,
      phone_code: country.phone_code,
      default_currency_code: country.default_currency_code || '',
      default_locale: country.default_locale,
      is_active: country.is_active,
    });
    setEditErrors({});
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCountry) return;

    setSaving(true);
    setEditErrors({});

    try {
      await apiClient.put(API_ENDPOINTS.admin.countries.update(editingCountry.id), {
        code: editForm.code.toUpperCase(),
        name_en: editForm.name_en,
        name_fr: editForm.name_fr,
        phone_code: editForm.phone_code,
        default_currency_code: editForm.default_currency_code || null,
        default_locale: editForm.default_locale,
        is_active: editForm.is_active,
      });
      showSuccess(t('admin.countries.success.updated'));
      setEditingCountry(null);
      await fetchCountries();
    } catch (err: any) {
      if (err.errors) {
        setEditErrors(err.errors);
      } else {
        setError(err.message || t('admin.countries.errors.updateFailed'));
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Delete country ──
  const handleDelete = async (country: Country) => {
    setDeleting(true);
    try {
      await apiClient.delete(API_ENDPOINTS.admin.countries.delete(country.id));
      showSuccess(t('admin.countries.success.deleted'));
      setDeletingCountry(null);
      await fetchCountries();
    } catch (err: any) {
      setError(err.message || t('admin.countries.errors.deleteFailed'));
      setDeletingCountry(null);
    } finally {
      setDeleting(false);
    }
  };

  const activeCount = countries.filter(c => c.is_active).length;

  // ── Country Form (shared between create and edit) ──
  const renderCountryForm = (
    form: typeof createForm,
    setForm: (f: typeof createForm) => void,
    errors: Record<string, string[]>,
    onSubmit: (e: React.FormEvent) => void,
    onClose: () => void,
    isSubmitting: boolean,
    title: string,
    submitLabel: string,
    submittingLabel: string,
  ) => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.countries.code')}</label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder={t('admin.countries.codePlaceholder')}
              maxLength={2}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
            />
            <p className="text-xs text-gray-500 mt-1">{t('admin.countries.codeHelp')}</p>
            {errors.code && <p className="text-xs text-red-600 mt-1">{errors.code[0]}</p>}
          </div>

          {/* Name EN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.countries.nameEn')}</label>
            <input
              type="text"
              value={form.name_en}
              onChange={(e) => setForm({ ...form, name_en: e.target.value })}
              placeholder={t('admin.countries.nameEnPlaceholder')}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.name_en && <p className="text-xs text-red-600 mt-1">{errors.name_en[0]}</p>}
          </div>

          {/* Name FR */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.countries.nameFr')}</label>
            <input
              type="text"
              value={form.name_fr}
              onChange={(e) => setForm({ ...form, name_fr: e.target.value })}
              placeholder={t('admin.countries.nameFrPlaceholder')}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.name_fr && <p className="text-xs text-red-600 mt-1">{errors.name_fr[0]}</p>}
          </div>

          {/* Phone Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.countries.phoneCode')}</label>
            <input
              type="text"
              value={form.phone_code}
              onChange={(e) => setForm({ ...form, phone_code: e.target.value })}
              placeholder={t('admin.countries.phoneCodePlaceholder')}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">{t('admin.countries.phoneCodeHelp')}</p>
            {errors.phone_code && <p className="text-xs text-red-600 mt-1">{errors.phone_code[0]}</p>}
          </div>

          {/* Default Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.countries.defaultCurrency')}</label>
            <select
              value={form.default_currency_code}
              onChange={(e) => setForm({ ...form, default_currency_code: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">—</option>
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
              ))}
            </select>
            {errors.default_currency_code && <p className="text-xs text-red-600 mt-1">{errors.default_currency_code[0]}</p>}
          </div>

          {/* Default Locale */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.countries.defaultLocale')}</label>
            <select
              value={form.default_locale}
              onChange={(e) => setForm({ ...form, default_locale: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
            {errors.default_locale && <p className="text-xs text-red-600 mt-1">{errors.default_locale[0]}</p>}
          </div>

          {/* Active */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">{t('admin.countries.activeOnCreate')}</label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? submittingLabel : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.countries.title')}</h1>
          <p className="text-sm text-gray-600 mt-1">{t('admin.countries.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('admin.countries.addCountry')}
        </button>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <p>{successMessage}</p>
          <button onClick={() => setSuccessMessage(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <p>{error}</p>
          <button onClick={() => setError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">{t('admin.countries.totalCountries')}</p>
          <p className="text-2xl font-bold text-gray-900">{countries.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">{t('admin.countries.activeCountries')}</p>
          <p className="text-2xl font-bold text-green-600">{activeCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">{t('admin.countries.totalCities')}</p>
          <p className="text-2xl font-bold text-blue-600">
            {countries.reduce((sum, c) => sum + (c.cities_count || 0), 0)}
          </p>
        </div>
      </div>

      {/* Create Country Modal */}
      {showCreateForm && renderCountryForm(
        createForm,
        setCreateForm,
        createErrors,
        handleCreate,
        () => { setShowCreateForm(false); setCreateErrors({}); },
        creating,
        t('admin.countries.createTitle'),
        t('admin.countries.create'),
        t('admin.countries.creating'),
      )}

      {/* Edit Country Modal */}
      {editingCountry && renderCountryForm(
        editForm,
        setEditForm,
        editErrors,
        handleEdit,
        () => { setEditingCountry(null); setEditErrors({}); },
        saving,
        t('admin.countries.editTitle'),
        t('admin.countries.save'),
        t('admin.countries.saving'),
      )}

      {/* Delete Confirmation Modal */}
      {deletingCountry && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                {t('admin.countries.confirmDelete', { name: deletingCountry.name })}
              </h2>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              {t('admin.countries.confirmDeleteDescription')}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingCountry(null)}
                disabled={deleting}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => handleDelete(deletingCountry)}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? '...' : t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Countries Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Globe className="w-6 h-6 animate-pulse mr-2" />
            {t('common.loading')}
          </div>
        ) : countries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Globe className="w-10 h-10 mb-2" />
            <p>{t('admin.countries.noCountries')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.countries.code')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.countries.nameEn')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.countries.nameFr')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.countries.phoneCode')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.countries.defaultCurrency')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.countries.totalCities')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.countries.status')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.countries.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {countries.map((country) => (
                  <tr key={country.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono font-semibold text-gray-900">{country.code}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {country.name_en}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {country.name_fr}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 font-mono">
                      {country.phone_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 font-mono">
                      {country.default_currency_code || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {country.cities_count ?? 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          country.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {country.is_active ? t('admin.countries.active') : t('admin.countries.inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit */}
                        <button
                          onClick={() => startEdit(country)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title={t('common.edit')}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        {/* Toggle active */}
                        <button
                          onClick={() => toggleCountry(country)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            country.is_active
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-gray-400 hover:bg-gray-100'
                          }`}
                          title={country.is_active ? t('admin.countries.deactivate') : t('admin.countries.activate')}
                        >
                          {country.is_active ? (
                            <ToggleRight className="w-5 h-5" />
                          ) : (
                            <ToggleLeft className="w-5 h-5" />
                          )}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setDeletingCountry(country)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title={t('admin.countries.deleteCountry')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
