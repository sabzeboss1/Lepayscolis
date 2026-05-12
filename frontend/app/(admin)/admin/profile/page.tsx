'use client';

import { useRef, useState } from 'react';
import {
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  Calendar,
  Key,
  Save,
  Camera,
  Loader2,
  CheckCircle,
  AlertCircle,
  Globe,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { useLocale } from '@/lib/i18n/LocaleContext';
import { localeNames, locales } from '@/lib/i18n/config';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function AdminProfilePage() {
  const { user, isLoading, refreshUser } = useAuth();
  const { locale, setLocale } = useLocale();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const dateLocale = locale === 'fr' ? 'fr-FR' : 'en-US';

  const startEditing = () => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setMessage(null);
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    if (type === 'success') {
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showMessage('error', t('admin.profile.errors.invalidFormat'));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showMessage('error', t('admin.profile.errors.fileTooLarge'));
      return;
    }

    setUploadingAvatar(true);
    try {
      await apiClient.uploadFile(API_ENDPOINTS.auth.uploadAvatar, file, undefined, 'avatar');
      await refreshUser();
      showMessage('success', t('admin.profile.success.avatarUpdated'));
    } catch (err: any) {
      showMessage('error', err.message || t('admin.profile.errors.uploadFailed'));
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          showMessage('error', t('admin.profile.errors.passwordMismatch'));
          setSaving(false);
          return;
        }
        if (!formData.currentPassword) {
          showMessage('error', t('admin.profile.errors.currentPasswordRequired'));
          setSaving(false);
          return;
        }
        if (formData.newPassword.length < 8) {
          showMessage('error', t('admin.profile.errors.passwordTooShort'));
          setSaving(false);
          return;
        }
      }

      const updateData: Record<string, string> = {};
      if (formData.name !== user?.name) updateData.name = formData.name;
      if (formData.email !== user?.email) updateData.email = formData.email;
      if (formData.phone !== (user?.phone || '')) updateData.phone = formData.phone;
      if (formData.newPassword) {
        updateData.current_password = formData.currentPassword;
        updateData.password = formData.newPassword;
        updateData.password_confirmation = formData.confirmPassword;
      }

      if (Object.keys(updateData).length === 0) {
        showMessage('error', t('admin.profile.errors.noChanges'));
        setSaving(false);
        return;
      }

      await apiClient.put<any>(API_ENDPOINTS.auth.updateProfile, updateData);
      await refreshUser();

      showMessage('success', t('admin.profile.success.profileUpdated'));
      setIsEditing(false);
      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (err: any) {
      if (err.errors) {
        const firstError = Object.values(err.errors).flat()[0];
        showMessage('error', firstError as string);
      } else {
        showMessage('error', err.message || t('admin.profile.errors.updateFailed'));
      }
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t('admin.profile.loadingProfile')}</p>
      </div>
    );
  }

  const roleLabel = user.role === 'super_admin' ? 'Super Admin' : 'Admin';
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.profile.title')}</h1>
        <p className="text-sm text-gray-600 mt-1">
          {t('admin.profile.subtitle')}
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`flex items-center gap-3 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Avatar + Identity Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Banner */}
        <div className="h-28 bg-gradient-to-r from-blue-600 to-indigo-600" />

        <div className="px-6 pb-6">
          {/* Avatar + info row */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-14">
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md bg-white"
                />
              ) : (
                <div className="w-28 h-28 rounded-full border-4 border-white shadow-md bg-blue-100 flex items-center justify-center">
                  <span className="text-3xl font-bold text-blue-600">{initials}</span>
                </div>
              )}
              <button
                onClick={handleAvatarClick}
                disabled={uploadingAvatar}
                className="absolute bottom-1 right-1 p-2 bg-white rounded-full shadow-md border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-300 transition-colors disabled:opacity-50"
                title={t('admin.profile.avatarChangeTitle')}
              >
                {uploadingAvatar ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="flex-1 sm:pb-1">
              <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  <Shield className="w-3 h-3" />
                  {roleLabel}
                </span>
                <span className="text-sm text-gray-500">{user.email}</span>
              </div>
            </div>

            <div className="sm:pb-1">
              {!isEditing ? (
                <button
                  onClick={startEditing}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('admin.profile.editProfile')}
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={cancelEditing}
                    className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {t('admin.profile.cancel')}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {saving ? t('admin.profile.saving') : t('admin.profile.save')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Personal Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-5">{t('admin.profile.personalInfo')}</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Name */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-500 mb-1.5">
              <UserIcon className="w-4 h-4" />
              {t('admin.profile.fullName')}
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            ) : (
              <p className="text-sm text-gray-900 font-medium">{user.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-500 mb-1.5">
              <Mail className="w-4 h-4" />
              {t('admin.profile.email')}
            </label>
            {isEditing ? (
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            ) : (
              <p className="text-sm text-gray-900 font-medium">{user.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-500 mb-1.5">
              <Phone className="w-4 h-4" />
              {t('admin.profile.phone')}
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder={t('admin.profile.phonePlaceholder')}
              />
            ) : (
              <p className="text-sm text-gray-900 font-medium">{user.phone || t('admin.profile.notProvided')}</p>
            )}
          </div>

          {/* Member since */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-500 mb-1.5">
              <Calendar className="w-4 h-4" />
              {t('admin.profile.memberSince')}
            </label>
            <p className="text-sm text-gray-900 font-medium">
              {new Date(user.created_at).toLocaleDateString(dateLocale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Preferences Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-5 flex items-center gap-2">
          <Globe className="w-5 h-5 text-gray-400" />
          {t('admin.profile.preferences')}
        </h3>

        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-500 mb-1.5">
            {t('admin.profile.interfaceLanguage')}
          </label>
          <div className="flex gap-3">
            {locales.map((loc) => (
              <button
                key={loc}
                onClick={() => {
                  setLocale(loc);
                  apiClient.put<any>(API_ENDPOINTS.auth.updateProfile, { locale: loc }).catch(() => {});
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  locale === loc
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">{loc === 'fr' ? '🇫🇷' : '🇬🇧'}</span>
                {localeNames[loc]}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {t('admin.profile.languageHint')}
          </p>
        </div>
      </div>

      {/* Security Card */}
      {isEditing ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <Key className="w-5 h-5 text-gray-400" />
            {t('admin.profile.changePassword')}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('admin.profile.currentPassword')}
              </label>
              <input
                type="password"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder={t('admin.profile.currentPasswordPlaceholder')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('admin.profile.newPassword')}
                </label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder={t('admin.profile.newPasswordPlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('admin.profile.confirmPassword')}
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder={t('admin.profile.confirmPasswordPlaceholder')}
                />
              </div>
            </div>

            <p className="text-xs text-gray-500">
              {t('admin.profile.passwordHint')}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Key className="w-5 h-5 text-gray-400" />
            {t('admin.profile.security')}
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">{t('admin.profile.currentPassword')}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {t('admin.profile.passwordChangeHint')}
              </p>
            </div>
            <span className="text-sm text-gray-400">&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;</span>
          </div>
        </div>
      )}
    </div>
  );
}
