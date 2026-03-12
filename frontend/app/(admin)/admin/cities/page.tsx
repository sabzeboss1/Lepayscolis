'use client';

import { useEffect, useState, useCallback } from 'react';
import { MapPin, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, AlertTriangle } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface City {
  id: number;
  name: string;
  name_en: string;
  name_fr: string;
  country_id: number;
  country?: {
    id: number;
    code: string;
    name: string;
    name_en: string;
    name_fr: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CitiesResponse {
  data: City[];
  meta?: {
    total: number;
    active: number;
  };
}

interface Country {
  id: number;
  code: string;
  name: string;
  name_en: string;
  name_fr: string;
}

export default function AdminCitiesPage() {
  const { t } = useTranslation();
  const [cities, setCities] = useState<City[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filterCountryId, setFilterCountryId] = useState<string>('');

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    name_en: '',
    name_fr: '',
    country_id: '',
    is_active: true,
  });
  const [creating, setCreating] = useState(false);
  const [createErrors, setCreateErrors] = useState<Record<string, string[]>>({});

  // Edit state
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [editForm, setEditForm] = useState({
    name_en: '',
    name_fr: '',
    country_id: '',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [editErrors, setEditErrors] = useState<Record<string, string[]>>({});

  // Delete confirmation
  const [deletingCity, setDeletingCity] = useState<City | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const fetchCities = useCallback(async () => {
    try {
      setError(null);
      const params = filterCountryId ? `?country_id=${filterCountryId}` : '';
      const res = await apiClient.get<CitiesResponse>(`${API_ENDPOINTS.admin.cities.list}${params}`);
      setCities(res.data);
    } catch (err: any) {
      setError(err.message || t('admin.cities.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t, filterCountryId]);

  const fetchCountries = useCallback(async () => {
    try {
      const res = await apiClient.get<{ data: Country[] }>(API_ENDPOINTS.admin.countries.list);
      setCountries(res.data);
    } catch {
      // Countries needed for dropdown
    }
  }, []);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

  // ── Toggle active/inactive ──
  const toggleCity = async (city: City) => {
    try {
      await apiClient.post(API_ENDPOINTS.admin.cities.toggle(city.id));
      showSuccess(
        city.is_active
          ? t('admin.cities.success.deactivated')
          : t('admin.cities.success.activated')
      );
      await fetchCities();
    } catch (err: any) {
      setError(err.message || t('admin.cities.errors.toggleFailed'));
    }
  };

  // ── Create city ──
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateErrors({});

    try {
      await apiClient.post(API_ENDPOINTS.admin.cities.store, {
        name_en: createForm.name_en,
        name_fr: createForm.name_fr,
        country_id: parseInt(createForm.country_id),
        is_active: createForm.is_active,
      });
      showSuccess(t('admin.cities.success.created'));
      setShowCreateForm(false);
      setCreateForm({ name_en: '', name_fr: '', country_id: '', is_active: true });
      await fetchCities();
    } catch (err: any) {
      if (err.errors) {
        setCreateErrors(err.errors);
      } else {
        setError(err.message || t('admin.cities.errors.createFailed'));
      }
    } finally {
      setCreating(false);
    }
  };

  // ── Edit city ──
  const startEdit = (city: City) => {
    setEditingCity(city);
    setEditForm({
      name_en: city.name_en,
      name_fr: city.name_fr,
      country_id: String(city.country_id),
      is_active: city.is_active,
    });
    setEditErrors({});
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCity) return;

    setSaving(true);
    setEditErrors({});

    try {
      await apiClient.put(API_ENDPOINTS.admin.cities.update(editingCity.id), {
        name_en: editForm.name_en,
        name_fr: editForm.name_fr,
        country_id: parseInt(editForm.country_id),
        is_active: editForm.is_active,
      });
      showSuccess(t('admin.cities.success.updated'));
      setEditingCity(null);
      await fetchCities();
    } catch (err: any) {
      if (err.errors) {
        setEditErrors(err.errors);
      } else {
        setError(err.message || t('admin.cities.errors.updateFailed'));
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Delete city ──
  const handleDelete = async (city: City) => {
    setDeleting(true);
    try {
      await apiClient.delete(API_ENDPOINTS.admin.cities.delete(city.id));
      showSuccess(t('admin.cities.success.deleted'));
      setDeletingCity(null);
      await fetchCities();
    } catch (err: any) {
      setError(err.message || t('admin.cities.errors.deleteFailed'));
      setDeletingCity(null);
    } finally {
      setDeleting(false);
    }
  };

  const activeCount = cities.filter(c => c.is_active).length;

  // ── City Form (shared between create and edit) ──
  const renderCityForm = (
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
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.cities.country')}</label>
            <select
              value={form.country_id}
              onChange={(e) => setForm({ ...form, country_id: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">{t('admin.cities.selectCountry')}</option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>{c.code} — {c.name_en}</option>
              ))}
            </select>
            {errors.country_id && <p className="text-xs text-red-600 mt-1">{errors.country_id[0]}</p>}
          </div>

          {/* Name EN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.cities.nameEn')}</label>
            <input
              type="text"
              value={form.name_en}
              onChange={(e) => setForm({ ...form, name_en: e.target.value })}
              placeholder={t('admin.cities.nameEnPlaceholder')}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.name_en && <p className="text-xs text-red-600 mt-1">{errors.name_en[0]}</p>}
          </div>

          {/* Name FR */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.cities.nameFr')}</label>
            <input
              type="text"
              value={form.name_fr}
              onChange={(e) => setForm({ ...form, name_fr: e.target.value })}
              placeholder={t('admin.cities.nameFrPlaceholder')}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.name_fr && <p className="text-xs text-red-600 mt-1">{errors.name_fr[0]}</p>}
          </div>

          {/* Active */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="city_is_active"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="city_is_active" className="text-sm text-gray-700">{t('admin.cities.activeOnCreate')}</label>
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
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.cities.title')}</h1>
          <p className="text-sm text-gray-600 mt-1">{t('admin.cities.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('admin.cities.addCity')}
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

      {/* Summary Cards + Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">{t('admin.cities.totalCities')}</p>
          <p className="text-2xl font-bold text-gray-900">{cities.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">{t('admin.cities.activeCities')}</p>
          <p className="text-2xl font-bold text-green-600">{activeCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">{t('admin.cities.filterByCountry')}</p>
          <select
            value={filterCountryId}
            onChange={(e) => { setFilterCountryId(e.target.value); setLoading(true); }}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">{t('admin.cities.allCountries')}</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>{c.code} — {c.name_en}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Create City Modal */}
      {showCreateForm && renderCityForm(
        createForm,
        setCreateForm,
        createErrors,
        handleCreate,
        () => { setShowCreateForm(false); setCreateErrors({}); },
        creating,
        t('admin.cities.createTitle'),
        t('admin.cities.create'),
        t('admin.cities.creating'),
      )}

      {/* Edit City Modal */}
      {editingCity && renderCityForm(
        editForm,
        setEditForm,
        editErrors,
        handleEdit,
        () => { setEditingCity(null); setEditErrors({}); },
        saving,
        t('admin.cities.editTitle'),
        t('admin.cities.save'),
        t('admin.cities.saving'),
      )}

      {/* Delete Confirmation Modal */}
      {deletingCity && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                {t('admin.cities.confirmDelete', { name: deletingCity.name })}
              </h2>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              {t('admin.cities.confirmDeleteDescription')}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingCity(null)}
                disabled={deleting}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => handleDelete(deletingCity)}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? '...' : t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cities Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <MapPin className="w-6 h-6 animate-pulse mr-2" />
            {t('common.loading')}
          </div>
        ) : cities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <MapPin className="w-10 h-10 mb-2" />
            <p>{t('admin.cities.noCities')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.cities.nameEn')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.cities.nameFr')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.cities.country')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.cities.status')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.cities.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cities.map((city) => (
                  <tr key={city.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">
                      {city.name_en}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {city.name_fr}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                          {city.country?.code}
                        </span>
                        {city.country?.name_en}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          city.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {city.is_active ? t('admin.cities.active') : t('admin.cities.inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit */}
                        <button
                          onClick={() => startEdit(city)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title={t('common.edit')}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        {/* Toggle active */}
                        <button
                          onClick={() => toggleCity(city)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            city.is_active
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-gray-400 hover:bg-gray-100'
                          }`}
                          title={city.is_active ? t('admin.cities.deactivate') : t('admin.cities.activate')}
                        >
                          {city.is_active ? (
                            <ToggleRight className="w-5 h-5" />
                          ) : (
                            <ToggleLeft className="w-5 h-5" />
                          )}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setDeletingCity(city)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title={t('admin.cities.deleteCity')}
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
