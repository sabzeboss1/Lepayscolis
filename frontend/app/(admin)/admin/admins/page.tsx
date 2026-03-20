'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shield, Plus, Trash2, RefreshCw, Activity, X, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface Admin {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'super_admin';
  created_at: string;
  last_login?: string;
}

interface AuditLog {
  id: number;
  action: string;
  resource_type: string;
  resource_id: string;
  ip_address: string;
  created_at_formatted: string;
}

type ModalType = 'create' | 'updateRole' | 'removeAccess' | 'activity' | null;

export default function AdminsPage() {
  const { t } = useTranslation();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalType>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [activityLogs, setActivityLogs] = useState<AuditLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Create form
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', role: 'admin' as 'admin' | 'super_admin' });
  const [showPassword, setShowPassword] = useState(false);
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);

  // Update role form
  const [newRole, setNewRole] = useState<'admin' | 'super_admin'>('admin');
  const [updating, setUpdating] = useState(false);

  // Remove confirm
  const [removing, setRemoving] = useState(false);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/admins');
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || t('admin.admins.fetchFailed'));
      setAdmins(data.data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const openModal = (type: ModalType, admin?: Admin) => {
    setSelectedAdmin(admin || null);
    setError(null);
    setSuccess(null);
    if (type === 'updateRole' && admin) setNewRole(admin.role);
    if (type === 'create') setCreateForm({ name: '', email: '', password: '', role: 'admin' });
    setCreateErrors({});
    setModal(type);
  };

  const closeModal = () => {
    setModal(null);
    setSelectedAdmin(null);
    setActivityLogs([]);
  };

  const fetchActivity = async (admin: Admin) => {
    setSelectedAdmin(admin);
    setModal('activity');
    setActivityLoading(true);
    try {
      const response = await fetch(`/api/admin/admins/${admin.id}/activity`);
      const data = await response.json();
      setActivityLogs(data.data || []);
    } catch {
      setActivityLogs([]);
    } finally {
      setActivityLoading(false);
    }
  };

  const handleCreate = async () => {
    const errors: Record<string, string> = {};
    if (!createForm.name.trim()) errors.name = t('admin.admins.createModal.errors.nameRequired');
    if (!createForm.email.trim()) errors.email = t('admin.admins.createModal.errors.emailRequired');
    if (!createForm.password) errors.password = t('admin.admins.createModal.errors.passwordRequired');
    else if (createForm.password.length < 8) errors.password = t('admin.admins.createModal.errors.passwordMin');
    if (Object.keys(errors).length > 0) { setCreateErrors(errors); return; }

    setCreating(true);
    setCreateErrors({});
    try {
      const response = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || t('admin.admins.createModal.errors.createFailed'));
      setSuccess(t('admin.admins.createSuccess'));
      closeModal();
      fetchAdmins();
    } catch (e: any) {
      setCreateErrors({ general: e.message });
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedAdmin) return;
    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/admins/${selectedAdmin.id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || t('admin.admins.updateRoleFailed'));
      setSuccess(t('admin.admins.updateRoleSuccess'));
      closeModal();
      fetchAdmins();
    } catch (e: any) {
      setError(e.message);
      closeModal();
    } finally {
      setUpdating(false);
    }
  };

  const handleRemove = async () => {
    if (!selectedAdmin) return;
    setRemoving(true);
    try {
      const response = await fetch(`/api/admin/admins/${selectedAdmin.id}`, { method: 'DELETE' });
      if (response.status === 204 || response.ok) {
        setSuccess(t('admin.admins.removeSuccess'));
        closeModal();
        fetchAdmins();
      } else {
        const data = await response.json();
        throw new Error(data.message || t('admin.admins.removeFailed'));
      }
    } catch (e: any) {
      setError(e.message);
      closeModal();
    } finally {
      setRemoving(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const styles = role === 'super_admin'
      ? 'bg-purple-100 text-purple-800'
      : 'bg-blue-100 text-blue-800';
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles}`}>
        {t(`admin.admins.roles.${role}`, { defaultValue: role })}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-gray-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('admin.admins.title')}</h1>
            <p className="text-sm text-gray-600 mt-1">{t('admin.admins.description')}</p>
          </div>
        </div>
        <button
          onClick={() => openModal('create')}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('admin.admins.addAdmin')}
        </button>
      </div>

      {/* Banners */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800 flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)}><X className="w-4 h-4" /></button>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{t('admin.admins.listTitle')}</h2>
          <button onClick={fetchAdmins} className="p-1.5 text-gray-500 hover:text-gray-700 rounded" title={t('admin.admins.refresh')}>
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : admins.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">{t('admin.admins.noAdmins')}</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.admins.columns.name')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.admins.columns.email')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.admins.columns.role')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.admins.columns.joined')}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('admin.admins.columns.actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-xs font-semibold text-blue-700">
                            {admin.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{admin.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{admin.email}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(admin.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {new Date(admin.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => fetchActivity(admin)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 rounded transition-colors"
                          title={t('admin.admins.viewActivity')}
                        >
                          <Activity className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openModal('updateRole', admin)}
                          className="p-1.5 text-gray-500 hover:text-yellow-600 rounded transition-colors"
                          title={t('admin.admins.changeRole')}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openModal('removeAccess', admin)}
                          className="p-1.5 text-gray-500 hover:text-red-600 rounded transition-colors"
                          title={t('admin.admins.removeAccess')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {modal === 'create' && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">{t('admin.admins.createModal.title')}</h3>
              <button onClick={closeModal}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              {createErrors.general && (
                <p className="text-sm text-red-600">{createErrors.general}</p>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.admins.createModal.name')}</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(f => ({ ...f, name: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${createErrors.name ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder={t('admin.admins.createModal.namePlaceholder')}
                />
                {createErrors.name && <p className="mt-1 text-xs text-red-600">{createErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.admins.createModal.email')}</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${createErrors.email ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="admin@example.com"
                />
                {createErrors.email && <p className="mt-1 text-xs text-red-600">{createErrors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.admins.createModal.password')}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={createForm.password}
                    onChange={(e) => setCreateForm(f => ({ ...f, password: e.target.value }))}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${createErrors.password ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-2.5 text-gray-400">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {createErrors.password && <p className="mt-1 text-xs text-red-600">{createErrors.password}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.admins.createModal.role')}</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm(f => ({ ...f, role: e.target.value as 'admin' | 'super_admin' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="admin">{t('admin.admins.roles.admin')}</option>
                  <option value="super_admin">{t('admin.admins.roles.super_admin')}</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t">
              <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                {t('admin.admins.createModal.cancel')}
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {creating && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />}
                {creating ? t('admin.admins.createModal.creating') : t('admin.admins.createModal.create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Role Modal */}
      {modal === 'updateRole' && selectedAdmin && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">{t('admin.admins.updateRoleModal.title')}</h3>
              <button onClick={closeModal}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                {t('admin.admins.updateRoleModal.description', { name: selectedAdmin.name })}
              </p>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as 'admin' | 'super_admin')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="admin">{t('admin.admins.roles.admin')}</option>
                <option value="super_admin">{t('admin.admins.roles.super_admin')}</option>
              </select>
            </div>
            <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t">
              <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                {t('admin.admins.cancel')}
              </button>
              <button
                onClick={handleUpdateRole}
                disabled={updating}
                className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center"
              >
                {updating && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />}
                {t('admin.admins.updateRoleModal.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Access Modal */}
      {modal === 'removeAccess' && selectedAdmin && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">{t('admin.admins.removeModal.title')}</h3>
              <button onClick={closeModal}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600">
                {t('admin.admins.removeModal.description', { name: selectedAdmin.name })}
              </p>
            </div>
            <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t">
              <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                {t('admin.admins.cancel')}
              </button>
              <button
                onClick={handleRemove}
                disabled={removing}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
              >
                {removing && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />}
                {t('admin.admins.removeModal.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Modal */}
      {modal === 'activity' && selectedAdmin && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {t('admin.admins.activityModal.title', { name: selectedAdmin.name })}
              </h3>
              <button onClick={closeModal}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              {activityLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : activityLogs.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">{t('admin.admins.activityModal.noActivity')}</p>
              ) : (
                <div className="space-y-3">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">{log.action}</span>
                          <span className="text-xs text-gray-500 ml-2 shrink-0">{log.created_at_formatted}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {log.resource_type} #{log.resource_id}
                          {log.ip_address && ` · ${log.ip_address}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
