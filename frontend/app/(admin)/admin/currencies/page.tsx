'use client';

import { useEffect, useState, useCallback } from 'react';
import { Coins, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, Check, AlertTriangle } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface Currency {
  id: number;
  code: string;
  symbol: string;
  name: string;
  exchange_rate: number;
  is_active: boolean;
  is_base: boolean;
  created_at: string;
  updated_at: string;
}

interface CurrenciesResponse {
  data: Currency[];
  meta: {
    total: number;
    active: number;
    base_currency: string | null;
  };
}

export default function AdminCurrenciesPage() {
  const { t } = useTranslation();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [meta, setMeta] = useState<CurrenciesResponse['meta'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Edit rate state
  const [editingRate, setEditingRate] = useState<string | null>(null);
  const [newRate, setNewRate] = useState('');
  const [savingRate, setSavingRate] = useState(false);

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    code: '',
    symbol: '',
    name: '',
    exchange_rate: '',
    is_active: true,
  });
  const [creating, setCreating] = useState(false);
  const [createErrors, setCreateErrors] = useState<Record<string, string[]>>({});

  // Delete confirmation
  const [deletingCode, setDeletingCode] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const fetchCurrencies = useCallback(async () => {
    try {
      setError(null);
      const res = await apiClient.get<CurrenciesResponse>(API_ENDPOINTS.admin.currencies.list);
      setCurrencies(res.data);
      setMeta(res.meta);
    } catch (err: any) {
      setError(err.message || t('admin.currencies.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchCurrencies();
  }, [fetchCurrencies]);

  // ── Edit exchange rate ──
  const startEditRate = (currency: Currency) => {
    setEditingRate(currency.code);
    setNewRate(String(currency.exchange_rate));
  };

  const cancelEditRate = () => {
    setEditingRate(null);
    setNewRate('');
  };

  const saveRate = async (code: string) => {
    const rate = parseFloat(newRate);
    if (isNaN(rate) || rate <= 0) return;

    setSavingRate(true);
    try {
      await apiClient.put(API_ENDPOINTS.admin.currencies.updateRate(code), {
        exchange_rate: rate,
      });
      showSuccess(t('admin.currencies.success.rateUpdated'));
      setEditingRate(null);
      setNewRate('');
      await fetchCurrencies();
    } catch (err: any) {
      setError(err.message || t('admin.currencies.errors.updateFailed'));
    } finally {
      setSavingRate(false);
    }
  };

  // ── Toggle active/inactive ──
  const toggleCurrency = async (code: string) => {
    try {
      await apiClient.post(API_ENDPOINTS.admin.currencies.toggle(code));
      const currency = currencies.find(c => c.code === code);
      showSuccess(
        currency?.is_active
          ? t('admin.currencies.success.deactivated')
          : t('admin.currencies.success.activated')
      );
      await fetchCurrencies();
    } catch (err: any) {
      setError(err.message || t('admin.currencies.errors.toggleFailed'));
    }
  };

  // ── Create currency ──
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateErrors({});

    try {
      await apiClient.post(API_ENDPOINTS.admin.currencies.store, {
        code: createForm.code.toUpperCase(),
        symbol: createForm.symbol,
        name: createForm.name,
        exchange_rate: parseFloat(createForm.exchange_rate),
        is_active: createForm.is_active,
      });
      showSuccess(t('admin.currencies.success.created'));
      setShowCreateForm(false);
      setCreateForm({ code: '', symbol: '', name: '', exchange_rate: '', is_active: true });
      await fetchCurrencies();
    } catch (err: any) {
      if (err.errors) {
        setCreateErrors(err.errors);
      } else {
        setError(err.message || t('admin.currencies.errors.createFailed'));
      }
    } finally {
      setCreating(false);
    }
  };

  // ── Delete currency ──
  const handleDelete = async (code: string) => {
    setDeleting(true);
    try {
      await apiClient.delete(API_ENDPOINTS.admin.currencies.delete(code));
      showSuccess(t('admin.currencies.success.deleted'));
      setDeletingCode(null);
      await fetchCurrencies();
    } catch (err: any) {
      setError(err.message || t('admin.currencies.errors.deleteFailed'));
      setDeletingCode(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.currencies.title')}</h1>
          <p className="text-sm text-gray-600 mt-1">{t('admin.currencies.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('admin.currencies.addCurrency')}
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
      {meta && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">{t('admin.currencies.totalCurrencies')}</p>
            <p className="text-2xl font-bold text-gray-900">{meta.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">{t('admin.currencies.activeCurrencies')}</p>
            <p className="text-2xl font-bold text-green-600">{meta.active}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">{t('admin.currencies.baseCurrency')}</p>
            <p className="text-2xl font-bold text-blue-600">{meta.base_currency || '—'}</p>
          </div>
        </div>
      )}

      {/* Create Currency Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">{t('admin.currencies.createTitle')}</h2>
              <button onClick={() => { setShowCreateForm(false); setCreateErrors({}); }}>
                <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.currencies.code')}</label>
                <input
                  type="text"
                  value={createForm.code}
                  onChange={(e) => setCreateForm({ ...createForm, code: e.target.value.toUpperCase() })}
                  placeholder={t('admin.currencies.codePlaceholder')}
                  maxLength={3}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                />
                <p className="text-xs text-gray-500 mt-1">{t('admin.currencies.codeHelp')}</p>
                {createErrors.code && <p className="text-xs text-red-600 mt-1">{createErrors.code[0]}</p>}
              </div>

              {/* Symbol */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.currencies.symbol')}</label>
                <input
                  type="text"
                  value={createForm.symbol}
                  onChange={(e) => setCreateForm({ ...createForm, symbol: e.target.value })}
                  placeholder={t('admin.currencies.symbolPlaceholder')}
                  maxLength={10}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {createErrors.symbol && <p className="text-xs text-red-600 mt-1">{createErrors.symbol[0]}</p>}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.currencies.name')}</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder={t('admin.currencies.namePlaceholder')}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {createErrors.name && <p className="text-xs text-red-600 mt-1">{createErrors.name[0]}</p>}
              </div>

              {/* Exchange Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.currencies.exchangeRate')}</label>
                <input
                  type="number"
                  step="0.000001"
                  min="0.000001"
                  value={createForm.exchange_rate}
                  onChange={(e) => setCreateForm({ ...createForm, exchange_rate: e.target.value })}
                  placeholder={t('admin.currencies.ratePlaceholder')}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">{t('admin.currencies.rateHelp')}</p>
                {createErrors.exchange_rate && <p className="text-xs text-red-600 mt-1">{createErrors.exchange_rate[0]}</p>}
              </div>

              {/* Active */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={createForm.is_active}
                  onChange={(e) => setCreateForm({ ...createForm, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">{t('admin.currencies.activeOnCreate')}</label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreateForm(false); setCreateErrors({}); }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {creating ? t('admin.currencies.creating') : t('admin.currencies.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                {t('admin.currencies.confirmDelete', { code: deletingCode })}
              </h2>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              {t('admin.currencies.confirmDeleteDescription')}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingCode(null)}
                disabled={deleting}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => handleDelete(deletingCode)}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? '...' : t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Currencies Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Coins className="w-6 h-6 animate-pulse mr-2" />
            {t('common.loading')}
          </div>
        ) : currencies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Coins className="w-10 h-10 mb-2" />
            <p>{t('admin.currencies.noCurrencies')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.currencies.code')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.currencies.symbol')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.currencies.name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.currencies.exchangeRate')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.currencies.status')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.currencies.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currencies.map((currency) => (
                  <tr key={currency.code} className="hover:bg-gray-50">
                    {/* Code */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-2">
                        <span className="font-mono font-semibold text-gray-900">{currency.code}</span>
                        {currency.is_base && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {t('admin.currencies.base')}
                          </span>
                        )}
                      </span>
                    </td>

                    {/* Symbol */}
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {currency.symbol}
                    </td>

                    {/* Name */}
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                      {currency.name}
                    </td>

                    {/* Exchange Rate */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingRate === currency.code ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.000001"
                            min="0.000001"
                            value={newRate}
                            onChange={(e) => setNewRate(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveRate(currency.code);
                              if (e.key === 'Escape') cancelEditRate();
                            }}
                            className="w-28 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            autoFocus
                          />
                          <button
                            onClick={() => saveRate(currency.code)}
                            disabled={savingRate}
                            className="p-1 text-green-600 hover:text-green-700"
                            title={t('admin.currencies.save')}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={cancelEditRate}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title={t('common.cancel')}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-gray-900">
                            {currency.is_base ? '1.000000' : Number(currency.exchange_rate).toFixed(6)}
                          </span>
                          {!currency.is_base && (
                            <button
                              onClick={() => startEditRate(currency)}
                              className="p-1 text-gray-400 hover:text-blue-600"
                              title={t('admin.currencies.editRate')}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          currency.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {currency.is_active ? t('admin.currencies.active') : t('admin.currencies.inactive')}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Toggle active */}
                        {!currency.is_base && (
                          <button
                            onClick={() => toggleCurrency(currency.code)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              currency.is_active
                                ? 'text-green-600 hover:bg-green-50'
                                : 'text-gray-400 hover:bg-gray-100'
                            }`}
                            title={currency.is_active ? t('admin.currencies.deactivate') : t('admin.currencies.activate')}
                          >
                            {currency.is_active ? (
                              <ToggleRight className="w-5 h-5" />
                            ) : (
                              <ToggleLeft className="w-5 h-5" />
                            )}
                          </button>
                        )}

                        {/* Delete */}
                        {!currency.is_base && (
                          <button
                            onClick={() => setDeletingCode(currency.code)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title={t('admin.currencies.deleteCurrency')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
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
