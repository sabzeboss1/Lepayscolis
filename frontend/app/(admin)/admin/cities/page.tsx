'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, AlertTriangle } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { useTranslation } from '@/lib/i18n/useTranslation';
import DataTable, { Column } from '@/components/admin/DataTable';
import TableFilters, { FilterConfig } from '@/components/admin/TableFilters';

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

interface Country {
  id: number;
  code: string;
  name: string;
  name_en: string;
  name_fr: string;
}

interface CityFilterValues {
  search: string;
  country_id: string;
  status: string;
}

const emptyForm = {
  name_en: '',
  name_fr: '',
  country_id: '',
  is_active: true,
};

export default function AdminCitiesPage() {
  const { t } = useTranslation();
  const [cities, setCities] = useState<City[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState<CityFilterValues>({ search: '', country_id: '', status: '' });

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({ ...emptyForm });
  const [creating, setCreating] = useState(false);
  const [createErrors, setCreateErrors] = useState<Record<string, string[]>>({});

  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [editForm, setEditForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [editErrors, setEditErrors] = useState<Record<string, string[]>>({});

  const [deletingCity, setDeletingCity] = useState<City | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const fetchCities = useCallback(async () => {
    try {
      setError(null);
      const params = filters.country_id ? `?country_id=${filters.country_id}` : '';
      const res = await apiClient.get<{ data: City[] }>(`${API_ENDPOINTS.admin.cities.list}${params}`);
      setCities(res.data);
    } catch (err: any) {
      setError(err.message || t('admin.cities.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t, filters.country_id]);

  const fetchCountries = useCallback(async () => {
    try {
      const res = await apiClient.get<{ data: Country[] }>(API_ENDPOINTS.admin.countries.list);
      setCountries(res.data);
    } catch {
      // Optional
    }
  }, []);

  useEffect(() => { fetchCountries(); }, [fetchCountries]);
  useEffect(() => { fetchCities(); }, [fetchCities]);

  // Client-side filtering for search and status (country_id triggers a refetch via fetchCities dependency)
  const filteredCities = useMemo(() => {
    let data = cities;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      data = data.filter(
        (c) =>
          c.name_en.toLowerCase().includes(q) ||
          c.name_fr.toLowerCase().includes(q) ||
          (c.country?.name_en ?? '').toLowerCase().includes(q) ||
          (c.country?.code ?? '').toLowerCase().includes(q)
      );
    }
    if (filters.status === 'active') data = data.filter((c) => c.is_active);
    if (filters.status === 'inactive') data = data.filter((c) => !c.is_active);
    return data;
  }, [cities, filters.search, filters.status]);

  const toggleCity = async (city: City) => {
    try {
      await apiClient.post(API_ENDPOINTS.admin.cities.toggle(city.id));
      showSuccess(city.is_active ? t('admin.cities.success.deactivated') : t('admin.cities.success.activated'));
      await fetchCities();
    } catch (err: any) {
      setError(err.message || t('admin.cities.errors.toggleFailed'));
    }
  };

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
      setCreateForm({ ...emptyForm });
      await fetchCities();
    } catch (err: any) {
      if (err.errors) setCreateErrors(err.errors);
      else setError(err.message || t('admin.cities.errors.createFailed'));
    } finally {
      setCreating(false);
    }
  };

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
      if (err.errors) setEditErrors(err.errors);
      else setError(err.message || t('admin.cities.errors.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

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

  const columns: Column<City>[] = [
    {
      key: 'name_en',
      label: t('admin.cities.nameEn'),
      sortable: true,
      render: (c) => <span className="font-medium text-gray-900">{c.name_en}</span>,
    },
    {
      key: 'name_fr',
      label: t('admin.cities.nameFr'),
      sortable: true,
      render: (c) => <span className="text-gray-700">{c.name_fr}</span>,
    },
    {
      key: 'country',
      label: t('admin.cities.country'),
      render: (c) =>
        c.country ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-gray-700">
            <span className="font-mono text-xs font-bold bg-gray-100 px-1.5 py-0.5 rounded">
              {c.country.code}
            </span>
            {c.country.name_en}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: 'status',
      label: t('admin.cities.status'),
      render: (c) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          c.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
        }`}>
          {c.is_active ? t('admin.cities.active') : t('admin.cities.inactive')}
        </span>
      ),
    },
    {
      key: 'actions',
      label: t('admin.cities.actions'),
      render: (c) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); startEdit(c); }}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title={t('common.edit')}
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); toggleCity(c); }}
            className={`p-1.5 rounded-lg transition-colors ${
              c.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'
            }`}
            title={c.is_active ? t('admin.cities.deactivate') : t('admin.cities.activate')}
          >
            {c.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeletingCity(c); }}
            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title={t('admin.cities.deleteCity')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  // Country options for filter dropdown
  const countryOptions = useMemo(() => [
    { value: '', label: t('admin.cities.allCountries') },
    ...countries.map((c) => ({ value: String(c.id), label: `${c.code} — ${c.name_en}` })),
  ], [countries, t]);

  const filterConfig: FilterConfig[] = [
    {
      type: 'text',
      key: 'search',
      label: t('common.search'),
      placeholder: `${t('admin.cities.nameEn')}, ${t('admin.cities.country')}...`,
    },
    {
      type: 'select',
      key: 'country_id',
      label: t('admin.cities.filterByCountry'),
      options: countryOptions,
    },
    {
      type: 'select',
      key: 'status',
      label: t('admin.cities.status'),
      options: [
        { value: '', label: `— ${t('common.all')} —` },
        { value: 'active', label: t('admin.cities.active') },
        { value: 'inactive', label: t('admin.cities.inactive') },
      ],
    },
  ];

  const renderCityForm = (
    form: typeof emptyForm,
    setForm: (f: typeof emptyForm) => void,
    errors: Record<string, string[]>,
    onSubmit: (e: React.FormEvent) => void,
    onClose: () => void,
    isSubmitting: boolean,
    title: string,
    submitLabel: string,
    submittingLabel: string,
  ) => (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500 hover:text-gray-700" /></button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.cities.country')}</label>
            <select value={form.country_id} onChange={(e) => setForm({ ...form, country_id: e.target.value })}
              required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="">{t('admin.cities.selectCountry')}</option>
              {countries.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name_en}</option>)}
            </select>
            {errors.country_id && <p className="text-xs text-red-600 mt-1">{errors.country_id[0]}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.cities.nameEn')}</label>
            <input type="text" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })}
              placeholder={t('admin.cities.nameEnPlaceholder')} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            {errors.name_en && <p className="text-xs text-red-600 mt-1">{errors.name_en[0]}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.cities.nameFr')}</label>
            <input type="text" value={form.name_fr} onChange={(e) => setForm({ ...form, name_fr: e.target.value })}
              placeholder={t('admin.cities.nameFrPlaceholder')} required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            {errors.name_fr && <p className="text-xs text-red-600 mt-1">{errors.name_fr[0]}</p>}
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="city_is_active" checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
            <label htmlFor="city_is_active" className="text-sm text-gray-700">{t('admin.cities.activeOnCreate')}</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {isSubmitting ? submittingLabel : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const activeCount = cities.filter((c) => c.is_active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Banners */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <p>{successMessage}</p>
          <button onClick={() => setSuccessMessage(null)}><X className="w-4 h-4" /></button>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <p>{error}</p>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">{t('admin.cities.totalCities')}</p>
          <p className="text-2xl font-bold text-gray-900">{cities.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">{t('admin.cities.activeCities')}</p>
          <p className="text-2xl font-bold text-green-600">{activeCount}</p>
        </div>
      </div>

      {/* Filters */}
      <TableFilters
        filters={filterConfig}
        values={filters}
        onChange={(v) => {
          const newFilters = v as CityFilterValues;
          // country_id change triggers API refetch via useEffect dependency
          setFilters(newFilters);
          if (newFilters.country_id !== filters.country_id) {
            setLoading(true);
          }
        }}
        onReset={() => setFilters({ search: '', country_id: '', status: '' })}
      />

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredCities}
        loading={loading}
        emptyMessage={t('admin.cities.noCities')}
        getRowId={(c) => String(c.id)}
      />

      {/* Modals */}
      {showCreateForm && renderCityForm(
        createForm, setCreateForm, createErrors, handleCreate,
        () => { setShowCreateForm(false); setCreateErrors({}); },
        creating, t('admin.cities.createTitle'), t('admin.cities.create'), t('admin.cities.creating'),
      )}
      {editingCity && renderCityForm(
        editForm, setEditForm, editErrors, handleEdit,
        () => { setEditingCity(null); setEditErrors({}); },
        saving, t('admin.cities.editTitle'), t('admin.cities.save'), t('admin.cities.saving'),
      )}
      {deletingCity && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                {t('admin.cities.confirmDelete', { name: deletingCity.name_en })}
              </h2>
            </div>
            <p className="text-sm text-gray-600 mb-6">{t('admin.cities.confirmDeleteDescription')}</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeletingCity(null)} disabled={deleting}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                {t('common.cancel')}
              </button>
              <button onClick={() => handleDelete(deletingCity)} disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
                {deleting ? '...' : t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
