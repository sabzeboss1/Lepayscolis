'use client';

import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  Camera,
  User,
  Phone,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface ProfileFormData {
  name: string;
  phone: string;
  avatar: string;
}

export default function ProfileEditPage() {
  const { user, isLoading } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    phone: '',
    avatar: '',
  });

  const [errors, setErrors] = useState<Partial<ProfileFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        phone: user.phone,
        avatar: user.avatar || '',
      });
      setAvatarPreview(user.avatar || `https://i.pravatar.cc/128?u=${user.id}`);
    }
  }, [user]);

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, avatar: 'Veuillez sélectionner une image.' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, avatar: 'L\'image doit faire moins de 5 MB.' }));
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

  const validateForm = (): boolean => {
    const newErrors: Partial<ProfileFormData> = {};
    if (!formData.name.trim()) {
      newErrors.name = t('errors.required');
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t('validation.minLength', { min: 2 });
    }
    if (!formData.phone.trim()) {
      newErrors.phone = t('errors.required');
    } else if (!/^\+?[\d\s\-()]+$/.test(formData.phone)) {
      newErrors.phone = t('errors.invalidPhone');
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
      let avatarUrl = formData.avatar;
      if (avatarFile) {
        avatarUrl = avatarPreview;
      }

      const response = await fetch(`/api/users/${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          avatar: avatarUrl,
        }),
      });

      if (!response.ok) throw new Error('Failed to update profile');

      setSubmitSuccess(true);
      setTimeout(() => router.push('/profile'), 800);
    } catch (error) {
      console.error('Profile update error:', error);
      setSubmitError(t('profile.updateError'));
    } finally {
      setIsSubmitting(false);
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
            Retour
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-heading)' }}>
                {t('profile.editProfile')}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">Modifiez vos informations personnelles</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ─── Avatar Card ──────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-bold text-gray-700 mb-4">Photo de profil</h2>
            <div className="flex items-center gap-5">
              <div className="relative flex-shrink-0">
                <img
                  src={avatarPreview}
                  alt={formData.name}
                  className="w-20 h-20 rounded-2xl object-cover ring-4 ring-gray-100"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                  aria-label="Changer la photo"
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
                  Changer la photo
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
              <p className="text-xs text-gray-400 mt-0.5">Votre nom et numéro de téléphone</p>
            </div>
            <div className="p-5 space-y-4">
              <Input
                  type="text"
                  label={t('auth.name')}
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  error={errors.name}
                  placeholder="Votre nom complet"
                  required
                />
              <Input
                  type="tel"
                  label={t('auth.phone')}
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  error={errors.phone}
                  placeholder="+33 6 00 00 00 00"
                  required
                />
            </div>
          </div>

          {/* ─── Contact Info (read-only) Card ────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="text-sm font-bold text-gray-700">{t('profile.contactInfo')}</h2>
              <p className="text-xs text-gray-400 mt-0.5">Ces informations ne peuvent pas être modifiées</p>
            </div>
            <div className="p-5 space-y-3">
              {/* Email (read-only) */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 mb-2">
                  <Mail className="w-4 h-4 text-gray-300" />
                  {t('auth.email')}
                </label>
                <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm text-gray-400 cursor-not-allowed">
                  <Lock className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  {user.email}
                </div>
                <p className="text-xs text-gray-400 mt-1">L'adresse e-mail ne peut pas être modifiée</p>
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
              Profil mis à jour avec succès !
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
      </div>
    </div>
  );
}
