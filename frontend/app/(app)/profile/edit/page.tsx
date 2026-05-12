'use client';

import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useLocale } from '@/lib/i18n/LocaleContext';
import { locales, localeNames, Locale } from '@/lib/i18n/config';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useCountries } from '@/lib/hooks/useCountries';
import { formatPhoneToE164, getPhonePlaceholder, getPhoneHelperText } from '@/lib/utils/phoneFormatter';
import {
  ChevronLeft,
  Camera,
  User,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Globe,
  Eye,
  EyeOff,
  Shield,
} from 'lucide-react';

interface CurrencyItem {
  code: string;
  name: string;
  symbol: string;
  is_active: boolean;
}

interface ProfileFormData {
  name: string;
  phone: string;
  avatar: string;
  currency_code: string;
  locale: Locale;
}

interface PasswordFormData {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export default function ProfileEditPage() {
  const { user, isLoading, refreshUser } = useAuth();
  const { t } = useTranslation();
  const { setLocale } = useLocale();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    phone: '',
    avatar: '',
    currency_code: '',
    locale: 'fr',
  });

  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [currencies, setCurrencies] = useState<CurrencyItem[]>([]);
  const [phoneCountry, setPhoneCountry] = useState('');
  const { countries } = useCountries();

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        phone: user.phone,
        avatar: user.avatar || '',
        currency_code: user.currency_code || '',
        locale: user.locale || 'fr',
      });
      setAvatarPreview(user.avatar || '');
      if (user.phone && countries.length > 0) {
        const matched = countries.find(c => user.phone.startsWith(c.phone_code));
        if (matched) setPhoneCountry(matched.code);
      }
    }
  }, [user, countries]);

  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const apiUrl = apiClient.baseUrl;
        const res = await fetch(`${apiUrl}/api/currencies`);
        if (res.ok) {
          const result = await res.json();
          setCurrencies(result.data || []);
        }
      } catch {
        // Keep empty
      }
    };
    fetchCurrencies();
  }, []);

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value } as ProfileFormData));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, avatar: t('profile.invalidImage') || 'Veuillez sélectionner une image.' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, avatar: t('profile.imageTooLarge') || "L'image doit faire moins de 5 MB." }));
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setErrors(prev => ({ ...prev, avatar: undefined }));
  };

  // Build the final phone number: always use selected country's phone_code
  const buildPhoneNumber = (): string => {
    const raw = formData.phone.trim();
    if (!phoneCountry) return raw;

    const country = countries.find(c => c.code === phoneCountry);
    if (!country) return raw;

    // Strip any existing country prefix and non-digit chars to get local digits
    let digits = raw.replace(/[\s\-()]/g, '');

    // Remove any international prefix the user may have typed
    if (digits.startsWith('+')) {
      // Remove the + and any known country prefix
      digits = digits.substring(1);
      for (const c of countries) {
        const prefixDigits = c.phone_code.replace('+', '');
        if (digits.startsWith(prefixDigits)) {
          digits = digits.substring(prefixDigits.length);
          break;
        }
      }
    }

    // Remove leading 0 (local format)
    if (digits.startsWith('0')) {
      digits = digits.substring(1);
    }

    return country.phone_code + digits;
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<string, string>> = {};
    if (!formData.name.trim()) {
      newErrors.name = t('errors.required');
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t('validation.minLength', { min: 2 });
    }
    if (!formData.phone.trim()) {
      newErrors.phone = t('errors.required');
    } else if (!phoneCountry) {
      newErrors.phone = t('profile.selectCountryFirst');
    } else if (!/^\+?[\d\s\-()]+$/.test(formData.phone)) {
      newErrors.phone = t('errors.invalidPhone');
    } else {
      // Validate that if user typed a +prefix, it matches the selected country
      const raw = formData.phone.trim().replace(/[\s\-()]/g, '');
      const country = countries.find(c => c.code === phoneCountry);
      if (raw.startsWith('+') && country) {
        const prefixDigits = country.phone_code;
        if (!raw.startsWith(prefixDigits)) {
          newErrors.phone = t('profile.phonePrefixMismatch') || `Le numéro ne correspond pas au pays sélectionné (${prefixDigits})`;
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const formattedPhone = buildPhoneNumber();

      await apiClient.put<any>(API_ENDPOINTS.auth.updateProfile, {
        name: formData.name,
        phone: formattedPhone,
        currency_code: formData.currency_code,
        locale: formData.locale,
      });

      // Upload avatar separately if changed
      if (avatarFile) {
        await apiClient.uploadFile(API_ENDPOINTS.auth.uploadAvatar, avatarFile, undefined, 'avatar');
      }

      // Refresh auth context with updated user data
      await refreshUser();

      // Sync locale context
      setLocale(formData.locale);

      setSubmitSuccess(true);
      setTimeout(() => router.push('/profile'), 800);
    } catch (error: any) {
      console.error('Profile update error:', error);
      setSubmitError(error.message || t('profile.updateError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!passwordData.current_password) {
      setPasswordError(t('profile.currentPasswordRequired') || 'Le mot de passe actuel est requis');
      return;
    }
    if (passwordData.new_password.length < 8) {
      setPasswordError(t('profile.passwordMinLength') || 'Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (passwordData.new_password !== passwordData.new_password_confirmation) {
      setPasswordError(t('profile.passwordMismatch') || 'Les mots de passe ne correspondent pas');
      return;
    }

    setIsChangingPassword(true);

    try {
      await apiClient.put('/api/users/password', passwordData);

      setPasswordSuccess(true);
      setPasswordData({ current_password: '', new_password: '', new_password_confirmation: '' });
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (error: any) {
      setPasswordError(error.message || t('profile.passwordChangeError'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <User className="w-8 h-8 text-orange-200" />
          </div>
          <div className="h-4 bg-gray-200 rounded-full w-48 mx-auto mb-2 animate-pulse" />
          <div className="h-3 bg-gray-100 rounded-full w-32 mx-auto animate-pulse" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const selectedCountry = countries.find(c => c.code === phoneCountry);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ─── Page Header ────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-5">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            {t('common.back') || 'Retour'}
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
                {t('profile.editProfile')}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">{t('profile.editProfileDesc') || 'Modifiez vos informations personnelles'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ─── Avatar Card ──────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-700 mb-4">{t('profile.avatar') || 'Photo de profil'}</h2>
            <div className="flex items-center gap-5">
              <div className="relative flex-shrink-0">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={formData.name}
                    className="w-20 h-20 rounded-2xl object-cover ring-4 ring-gray-100"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gray-100 ring-4 ring-gray-100 flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                  aria-label={t('profile.changeAvatar') || 'Changer la photo'}
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  id="avatar-upload"
                />
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors"
                >
                  {t('profile.changeAvatar') || 'Changer la photo'}
                </button>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG ou GIF — max 5 MB</p>
                {errors.avatar && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.avatar}
                  </p>
                )}
                {avatarFile && !errors.avatar && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {avatarFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ─── Personal Info Card ───────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="text-sm font-bold text-gray-700">{t('profile.personalInfo')}</h2>
            </div>
            <div className="p-5 space-y-4">
              <Input
                type="text"
                label={t('auth.name')}
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={errors.name}
                placeholder={t('auth.namePlaceholder') || 'Votre nom complet'}
                required
              />

              {/* Phone with country selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('auth.phone')}
                </label>
                <div className="flex items-start gap-0">
                  {/* Country selector */}
                  <div className="relative shrink-0">
                    <select
                      value={phoneCountry}
                      onChange={(e) => {
                        const code = e.target.value;
                        setPhoneCountry(code);
                        const country = countries.find(c => c.code === code);
                        if (country?.default_currency_code) {
                          handleInputChange('currency_code', country.default_currency_code);
                        }
                      }}
                      className="h-[42px] appearance-none pl-3 pr-7 border border-r-0 border-gray-300 rounded-l-lg text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent focus:z-10"
                    >
                      <option value="">{t('profile.country')}</option>
                      {countries.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name} ({c.phone_code})
                        </option>
                      ))}
                    </select>
                    <ChevronLeft className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 rotate-[270deg] pointer-events-none" />
                  </div>
                  {/* Phone input */}
                  <input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder={phoneCountry ? getPhonePlaceholder(phoneCountry) : t('profile.selectCountryFirst')}
                    required
                    className={`h-[42px] flex-1 min-w-0 px-3 border border-gray-300 rounded-r-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      errors.phone ? 'border-red-300 focus:ring-red-500' : ''
                    }`}
                  />
                </div>
                {phoneCountry && (
                  <p className="text-xs text-gray-400 mt-1.5">
                    {selectedCountry?.name} — {getPhoneHelperText(phoneCountry)}
                  </p>
                )}
                {errors.phone && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ─── Preferences Card ─────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-400" />
                {t('profile.preferences')}
              </h2>
            </div>
            <div className="p-5 space-y-6">
              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('profile.language') || 'Langue'}
                </label>
                <div className="flex gap-3">
                  {locales.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => handleInputChange('locale', loc)}
                      className={`flex items-center gap-2.5 px-5 py-3 rounded-xl border text-sm font-medium transition-all ${
                        formData.locale === loc
                          ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-lg">{loc === 'fr' ? '\u{1F1EB}\u{1F1F7}' : '\u{1F1EC}\u{1F1E7}'}</span>
                      {localeNames[loc]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('profile.currency')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {currencies.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleInputChange('currency_code', c.code)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        formData.currency_code === c.code
                          ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-base font-semibold">{c.symbol}</span>
                      {c.code}
                    </button>
                  ))}
                </div>
                {formData.currency_code && (
                  <p className="text-xs text-gray-500 mt-2">
                    {currencies.find(c => c.code === formData.currency_code)?.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ─── Contact Info (read-only) Card ────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="text-sm font-bold text-gray-700">{t('profile.contactInfo')}</h2>
              <p className="text-xs text-gray-400 mt-0.5">{t('profile.contactInfoReadonly') || 'Ces informations ne peuvent pas être modifiées'}</p>
            </div>
            <div className="p-5">
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-500 mb-1.5">
                <Mail className="w-4 h-4 text-gray-300" />
                {t('auth.email')}
              </label>
              <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-400 cursor-not-allowed">
                <Lock className="w-4 h-4 text-gray-300 flex-shrink-0" />
                {user.email}
              </div>
            </div>
          </div>

          {/* ─── Error / Success ─────────────────────────────────────────── */}
          {submitError && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {submitError}
            </div>
          )}
          {submitSuccess && (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              {t('profile.updateSuccess')}
            </div>
          )}

          {/* ─── Actions ─────────────────────────────────────────────────── */}
          <div className="flex gap-3 pt-1">
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              loading={isSubmitting}
              className="flex-1"
            >
              {t('common.save')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
          </div>
        </form>

        {/* ─── Password Change Card (separate from main form) ─────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Shield className="w-4 h-4 text-gray-400" />
              {t('profile.security') || 'Sécurité'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{t('profile.changePassword') || 'Modifier votre mot de passe'}</p>
          </div>
          <div className="p-5 space-y-4">
            {/* Current password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('profile.currentPassword') || 'Mot de passe actuel'}
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                  className="w-full h-[42px] px-3 pr-10 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="********"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('profile.newPassword') || 'Nouveau mot de passe'}
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                  className="w-full h-[42px] px-3 pr-10 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder={t('profile.newPasswordPlaceholder') || 'Min. 8 caractères'}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm new password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('profile.confirmPassword') || 'Confirmer le nouveau mot de passe'}
              </label>
              <input
                type="password"
                value={passwordData.new_password_confirmation}
                onChange={(e) => setPasswordData(prev => ({ ...prev, new_password_confirmation: e.target.value }))}
                className="w-full h-[42px] px-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="********"
              />
            </div>

            {passwordError && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                {t('profile.passwordChanged') || 'Mot de passe modifié avec succès'}
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={handlePasswordChange}
              disabled={isChangingPassword || !passwordData.current_password || !passwordData.new_password}
              loading={isChangingPassword}
              className="w-full"
            >
              {t('profile.changePassword') || 'Modifier le mot de passe'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
