'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  HardDrive,
  Save,
  Play,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Link as LinkIcon,
  FolderPlus,
  RefreshCw,
  X,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

type TabType = 'config' | 'history';

interface BackupSettings {
  backup_enabled: boolean;
  backup_schedule_frequency: string;
  backup_schedule_time: string;
  backup_schedule_day: number;
  backup_timezone: string;
  backup_include_files: boolean;
  backup_include_db: boolean;
  backup_retention_days: number;
  backup_max_count: number;
  backup_notify_email: string;
  google_drive_client_id: string;
  google_drive_folder_name: string;
  google_drive_folder_id: string;
  google_drive_connected: boolean;
  google_drive_client_secret_set: boolean;
  google_drive_refresh_token_set: boolean;
}

interface BackupRecord {
  id: number;
  file_name: string;
  file_size: number | null;
  status: string;
  type: string;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  formatted_file_size: string;
  triggered_by: { id: number; name: string } | null;
  created_at: string;
}

const STATUS_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Terminé' },
  in_progress: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En cours' },
  failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Échoué' },
  pending: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'En attente' },
};

export default function BackupsPage() {
  const [tab, setTab] = useState<TabType>('config');
  const [settings, setSettings] = useState<BackupSettings | null>(null);
  const [formData, setFormData] = useState<Partial<BackupSettings & { google_drive_client_secret?: string }>>({});
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    if (type === 'success') {
      setTimeout(() => setMessage(null), 4000);
    }
  };

  // ─── Load settings ──────────────────────────────────────

  const loadSettings = useCallback(async () => {
    try {
      const res: any = await apiClient.get(API_ENDPOINTS.admin.backups.settings);
      const data = res.data;
      setSettings(data);
      setFormData(data);
      setAccessDenied(false);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setAccessDenied(true);
      } else {
        const status = err?.response?.status || 'network';
        const msg = err?.response?.data?.message || err?.message || 'Erreur inconnue';
        showMessage('error', `Impossible de charger la configuration (${status}: ${msg})`);
      }
    }
  }, []);

  // ─── Load history ───────────────────────────────────────

  const loadBackups = useCallback(async (page = 1) => {
    try {
      const res: any = await apiClient.get(API_ENDPOINTS.admin.backups.list, { params: { page, per_page: 15 } });
      setBackups(res.data || []);
      setMeta(res.meta || { current_page: 1, last_page: 1, total: 0 });
    } catch {
      showMessage('error', 'Impossible de charger l\'historique.');
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadSettings(), loadBackups()]);
      setLoading(false);
    })();
  }, [loadSettings, loadBackups]);

  // Auto-refresh if any backup is pending/in_progress
  useEffect(() => {
    if (!backups?.length || tab !== 'history') return;
    const hasPending = backups.some(b => b.status === 'pending' || b.status === 'in_progress');
    if (!hasPending) return;
    const page = meta?.current_page || 1;
    const interval = setInterval(() => loadBackups(page), 10000);
    return () => clearInterval(interval);
  }, [backups, tab, meta, loadBackups]);

  // ─── Handlers ───────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res: any = await apiClient.put(API_ENDPOINTS.admin.backups.updateSettings, formData);
      setSettings(res.data || res);
      showMessage('success', 'Configuration sauvegardée.');
    } catch (err: any) {
      showMessage('error', err?.response?.data?.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleRun = async () => {
    setRunning(true);
    setMessage(null);
    try {
      await apiClient.post(API_ENDPOINTS.admin.backups.run);
      showMessage('success', 'Sauvegarde lancée en arrière-plan.');
      setTab('history');
      await loadBackups();
    } catch (err: any) {
      showMessage('error', err?.response?.data?.message || 'Erreur lors du lancement.');
    } finally {
      setRunning(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/api/admin/backups/${deleteTarget}`);
      await loadBackups(meta?.current_page || 1);
      showMessage('success', 'Sauvegarde supprimée.');
    } catch (err: any) {
      showMessage('error', err?.response?.data?.message || 'Erreur lors de la suppression.');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setMessage(null);
    try {
      const res: any = await apiClient.post(API_ENDPOINTS.admin.backups.googleDriveTest);
      if (res.data.connected) {
        showMessage('success', `Google Drive connecté (${res.data.email}).`);
        await loadSettings();
      } else {
        showMessage('error', `Connexion échouée : ${res.data.error}`);
      }
    } catch (err: any) {
      showMessage('error', err?.response?.data?.data?.error || 'Erreur de connexion.');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleCreateFolder = async () => {
    setCreatingFolder(true);
    setMessage(null);
    try {
      const res: any = await apiClient.post(API_ENDPOINTS.admin.backups.googleDriveCreateFolder);
      setFormData(prev => ({ ...prev, google_drive_folder_id: res.data.folder_id }));
      showMessage('success', 'Dossier créé sur Google Drive.');
      await loadSettings();
    } catch (err: any) {
      showMessage('error', err?.response?.data?.message || 'Erreur lors de la création du dossier.');
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleConnectDrive = async () => {
    try {
      const res: any = await apiClient.get(API_ENDPOINTS.admin.backups.googleDriveAuthUrl);
      window.open(res.data.url, '_blank', 'width=600,height=700');
    } catch (err: any) {
      showMessage('error', 'Impossible de générer l\'URL OAuth.');
    }
  };

  const updateField = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // ─── Access denied ──────────────────────────────────────

  if (accessDenied) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-red-800">Accès refusé</h2>
          <p className="text-red-600 mt-1">Votre email ne figure pas dans la liste des administrateurs autorisés pour les sauvegardes.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-red-800">Impossible de charger la configuration</h2>
          <p className="text-red-600 mt-1">{message?.text || 'Vérifiez que le serveur backend est accessible.'}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <HardDrive className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sauvegardes</h1>
            <p className="text-sm text-gray-500">Gestion des sauvegardes automatiques et manuelles</p>
          </div>
        </div>
        <button
          onClick={handleRun}
          disabled={running}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          <span>Lancer une sauvegarde</span>
        </button>
      </div>

      {/* Toast notification */}
      {message && (
        <div className={`fixed top-6 right-6 z-50 max-w-md px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 animate-in slide-in-from-right ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.type === 'success'
            ? <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          }
          <span className="text-sm flex-1">{message.text}</span>
          <button onClick={() => setMessage(null)} className="flex-shrink-0 hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {(['config', 'history'] as TabType[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'config' ? 'Configuration' : 'Historique'}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {tab === 'config' ? (
        <div className="space-y-8">
          {/* Activation */}
          <Section title="Activation">
            <Toggle
              label="Activer les sauvegardes automatiques"
              checked={!!formData.backup_enabled}
              onChange={v => updateField('backup_enabled', v)}
            />
          </Section>

          {/* Schedule */}
          <Section title="Planification">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fréquence</label>
                <select
                  value={formData.backup_schedule_frequency || 'daily'}
                  onChange={e => updateField('backup_schedule_frequency', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="hourly">Toutes les heures</option>
                  <option value="daily">Quotidien</option>
                  <option value="weekly">Hebdomadaire</option>
                  <option value="monthly">Mensuel</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Heure</label>
                <input
                  type="time"
                  value={formData.backup_schedule_time || '02:00'}
                  onChange={e => updateField('backup_schedule_time', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fuseau horaire</label>
                <select
                  value={formData.backup_timezone || 'UTC'}
                  onChange={e => updateField('backup_timezone', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="UTC">UTC</option>
                  <option value="Africa/Douala">Africa/Douala (UTC+1)</option>
                  <option value="Africa/Lagos">Africa/Lagos (UTC+1)</option>
                  <option value="Africa/Abidjan">Africa/Abidjan (UTC+0)</option>
                  <option value="Europe/Paris">Europe/Paris (UTC+1/+2)</option>
                  <option value="Europe/London">Europe/London (UTC+0/+1)</option>
                  <option value="America/New_York">America/New_York (UTC-5/-4)</option>
                  <option value="America/Montreal">America/Montreal (UTC-5/-4)</option>
                  <option value="Asia/Dubai">Asia/Dubai (UTC+4)</option>
                </select>
              </div>
              {(formData.backup_schedule_frequency === 'weekly' || formData.backup_schedule_frequency === 'monthly') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.backup_schedule_frequency === 'weekly' ? 'Jour de la semaine' : 'Jour du mois'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={formData.backup_schedule_frequency === 'weekly' ? 7 : 28}
                    value={formData.backup_schedule_day || 1}
                    onChange={e => updateField('backup_schedule_day', parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              )}
            </div>
          </Section>

          {/* Content */}
          <Section title="Contenu de la sauvegarde">
            <div className="space-y-3">
              <Toggle
                label="Inclure la base de données"
                checked={formData.backup_include_db !== false}
                onChange={v => updateField('backup_include_db', v)}
              />
              <Toggle
                label="Inclure les fichiers (storage)"
                checked={formData.backup_include_files !== false}
                onChange={v => updateField('backup_include_files', v)}
              />
            </div>
          </Section>

          {/* Retention */}
          <Section title="Rétention">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jours de conservation</label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={formData.backup_retention_days || 30}
                  onChange={e => updateField('backup_retention_days', parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre maximum de sauvegardes</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={formData.backup_max_count || 10}
                  onChange={e => updateField('backup_max_count', parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
          </Section>

          {/* Notifications */}
          <Section title="Notifications">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Emails de notification (séparés par des virgules)
              </label>
              <input
                type="text"
                placeholder="admin@example.com, boss@example.com"
                value={formData.backup_notify_email || ''}
                onChange={e => updateField('backup_notify_email', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Ces emails servent aussi de liste de contrôle d'accès pour cette section.
              </p>
            </div>
          </Section>

          {/* Google Drive */}
          <Section title="Google Drive">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700">Statut :</span>
                {settings?.google_drive_connected ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" /> Connecté
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <XCircle className="w-3 h-3 mr-1" /> Non connecté
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
                  <input
                    type="text"
                    value={formData.google_drive_client_id || ''}
                    onChange={e => updateField('google_drive_client_id', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client Secret</label>
                  <input
                    type="password"
                    placeholder={settings?.google_drive_client_secret_set ? '••••••••' : ''}
                    value={formData.google_drive_client_secret || ''}
                    onChange={e => updateField('google_drive_client_secret', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom du dossier</label>
                  <input
                    type="text"
                    value={formData.google_drive_folder_name || 'LePaysExpressColis-Backups'}
                    onChange={e => updateField('google_drive_folder_name', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Folder ID</label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Coller un ID existant ou créer ci-dessous"
                      value={formData.google_drive_folder_id || ''}
                      onChange={e => updateField('google_drive_folder_id', e.target.value)}
                      disabled={!!settings?.google_drive_folder_id}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    <button
                      onClick={handleCreateFolder}
                      disabled={creatingFolder}
                      className="flex items-center space-x-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm disabled:opacity-50"
                      title="Créer le dossier sur Drive"
                    >
                      {creatingFolder ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderPlus className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleConnectDrive}
                  disabled={!formData.google_drive_client_id || (!formData.google_drive_client_secret && !settings?.google_drive_client_secret_set)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LinkIcon className="w-4 h-4" />
                  <span>Connecter Google Drive</span>
                </button>
                <button
                  onClick={handleTestConnection}
                  disabled={testingConnection || !formData.google_drive_client_id || (!formData.google_drive_client_secret && !settings?.google_drive_client_secret_set)}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm disabled:opacity-50"
                >
                  {testingConnection ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  <span>Tester la connexion</span>
                </button>
              </div>
            </div>
          </Section>

          {/* Save button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Enregistrer</span>
            </button>
          </div>
        </div>
      ) : (
        /* ─── History Tab ─────────────────────────────── */
        <div className="space-y-4">
          {backups.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <HardDrive className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Aucune sauvegarde effectuée.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-500">
                      <th className="pb-3 font-medium">Nom</th>
                      <th className="pb-3 font-medium">Taille</th>
                      <th className="pb-3 font-medium">Type</th>
                      <th className="pb-3 font-medium">Statut</th>
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">Déclenché par</th>
                      <th className="pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups.map(backup => {
                      const badge = STATUS_BADGES[backup.status] || STATUS_BADGES.pending;
                      return (
                        <tr key={backup.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 font-medium text-gray-900">{backup.file_name}</td>
                          <td className="py-3 text-gray-600">{backup.formatted_file_size || '—'}</td>
                          <td className="py-3">
                            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                              {backup.type === 'scheduled' ? 'Planifié' : 'Manuel'}
                            </span>
                          </td>
                          <td className="py-3">
                            <span className={`text-xs px-2 py-0.5 rounded ${badge.bg} ${badge.text}`}>
                              {backup.status === 'in_progress' && <Loader2 className="w-3 h-3 animate-spin inline mr-1" />}
                              {badge.label}
                            </span>
                            {backup.error_message && (
                              <p className="text-xs text-red-500 mt-1 max-w-xs truncate" title={backup.error_message}>
                                {backup.error_message}
                              </p>
                            )}
                          </td>
                          <td className="py-3 text-gray-600">
                            {new Date(backup.created_at).toLocaleDateString('fr-FR', {
                              day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3 text-gray-600">
                            {backup.triggered_by?.name || 'Système'}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => setDeleteTarget(backup.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {meta.last_page > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-gray-500">{meta.total} sauvegarde(s) au total</span>
                  <div className="flex space-x-2">
                    <button
                      disabled={meta.current_page <= 1}
                      onClick={() => loadBackups(meta.current_page - 1)}
                      className="px-3 py-1 text-sm border rounded disabled:opacity-50 hover:bg-gray-50"
                    >
                      Précédent
                    </button>
                    <span className="px-3 py-1 text-sm">{meta.current_page} / {meta.last_page}</span>
                    <button
                      disabled={meta.current_page >= meta.last_page}
                      onClick={() => loadBackups(meta.current_page + 1)}
                      className="px-3 py-1 text-sm border rounded disabled:opacity-50 hover:bg-gray-50"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
      {/* Delete confirmation modal */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Supprimer la sauvegarde"
        message="Cette action est irréversible. La sauvegarde sera supprimée du serveur et de Google Drive."
        confirmLabel="Supprimer"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}

// ─── Shared components ──────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center space-x-3 cursor-pointer">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
      >
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </div>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}
