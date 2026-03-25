'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  Mail,
  CreditCard,
  Image as ImageIcon,
  DollarSign,
  Shield,
  Bell,
  Package,
  Upload,
  X
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

type TabType = 'general' | 'smtp' | 'payment' | 'branding' | 'currency' | 'security' | 'notifications' | 'shipping';

interface CurrencyItem {
  code: string;
  name: string;
  symbol: string;
  is_active: boolean;
}

interface PlatformSettings {
  // General
  platform_name: string;
  platform_url: string;
  support_email: string;
  support_phone: string;
  sender_fee_percentage: number;
  traveler_fee_percentage: number;

  // SMTP
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  smtp_encryption: string;
  smtp_from_address: string;
  smtp_from_name: string;

  // Payment - Stripe
  stripe_public_key: string;
  stripe_secret_key: string;
  stripe_webhook_secret: string;
  payment_currency: string;

  // Payment - Orange Money
  orange_money_api_key?: string;
  orange_money_merchant_id?: string;
  orange_money_enabled?: boolean;

  // Payment - MTN Money
  mtn_money_api_key?: string;
  mtn_money_subscription_key?: string;
  mtn_money_enabled?: boolean;

  // Payment - Bank Transfer
  bank_name?: string;
  bank_iban?: string;
  bank_bic?: string;
  bank_transfer_enabled?: boolean;

  // Payment - Cash
  cash_payment_enabled?: boolean;

  // Withdrawal
  withdrawal_fee: number;
  min_withdrawal_amount: number;
  max_withdrawal_amount: number;

  // Shipment
  min_shipment_price: number;
  max_shipment_price: number;

  // Branding
  logo_url: string;
  favicon_url: string;
  primary_color: string;
  secondary_color: string;

  // Currency
  default_currency: string;
  supported_currencies: string[];

  // Security
  kyc_required: boolean;
  two_factor_enabled: boolean;
  session_timeout: number;
  max_login_attempts: number;

  // Notifications
  email_notifications_enabled: boolean;
  push_notifications_enabled: boolean;
  sms_notifications_enabled: boolean;
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploading, setUploading] = useState<'logo' | 'favicon' | null>(null);
  const [currencies, setCurrencies] = useState<CurrencyItem[]>([]);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
    fetchCurrencies();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setSettings(result.data || getDefaultSettings());
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setSettings(getDefaultSettings());
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/currencies`);
      if (response.ok) {
        const result = await response.json();
        setCurrencies(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch currencies:', error);
    }
  };

  const getDefaultSettings = (): PlatformSettings => ({
    platform_name: 'Le Pays Express Colis',
    platform_url: 'https://lepaysexpresscolis.com',
    support_email: 'support@lepaysexpresscolis.com',
    support_phone: '+33 1 23 45 67 89',
    sender_fee_percentage: 1.0,
    traveler_fee_percentage: 2.0,

    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    smtp_encryption: 'tls',
    smtp_from_address: 'noreply@lepaysexpresscolis.com',
    smtp_from_name: 'Le Pays Express Colis',

    stripe_public_key: '',
    stripe_secret_key: '',
    stripe_webhook_secret: '',
    payment_currency: 'EUR',

    orange_money_api_key: '',
    orange_money_merchant_id: '',
    orange_money_enabled: false,

    mtn_money_api_key: '',
    mtn_money_subscription_key: '',
    mtn_money_enabled: false,

    bank_name: '',
    bank_iban: '',
    bank_bic: '',
    bank_transfer_enabled: false,

    cash_payment_enabled: false,

    withdrawal_fee: 2.50,
    min_withdrawal_amount: 20.00,
    max_withdrawal_amount: 5000.00,

    min_shipment_price: 10.00,
    max_shipment_price: 1000.00,

    logo_url: '/logo.png',
    favicon_url: '/favicon.ico',
    primary_color: '#3B82F6',
    secondary_color: '#F97316',

    default_currency: 'EUR',
    supported_currencies: ['EUR', 'USD', 'GBP', 'XAF', 'XOF', 'RUB', 'CAD'],

    kyc_required: true,
    two_factor_enabled: false,
    session_timeout: 3600,
    max_login_attempts: 5,

    email_notifications_enabled: true,
    push_notifications_enabled: true,
    sms_notifications_enabled: false,
  });

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save settings');
      }

      setMessage({ type: 'success', text: t('admin.settings.success') });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage({ type: 'error', text: t('admin.settings.error') });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof PlatformSettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  const handleBrandingUpload = async (file: File, type: 'logo' | 'favicon') => {
    if (!file) return;

    setUploading(type);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/admin/settings/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to upload ${type}`);
      }

      // Update local state with the new URL
      const settingKey = type === 'logo' ? 'logo_url' : 'favicon_url';
      updateSetting(settingKey, data.url);
      setMessage({ type: 'success', text: data.message });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error(`Failed to upload ${type}:`, error);
      setMessage({ type: 'error', text: error.message || `Failed to upload ${type}` });
    } finally {
      setUploading(null);
    }
  };

  const tabs = [
    { id: 'general' as TabType, label: t('admin.settings.tabs.general'), icon: SettingsIcon },
    { id: 'smtp' as TabType, label: t('admin.settings.tabs.smtp'), icon: Mail },
    { id: 'payment' as TabType, label: t('admin.settings.tabs.payment'), icon: CreditCard },
    { id: 'branding' as TabType, label: t('admin.settings.tabs.branding'), icon: ImageIcon },
    { id: 'currency' as TabType, label: t('admin.settings.tabs.currency'), icon: DollarSign },
    { id: 'security' as TabType, label: t('admin.settings.tabs.security'), icon: Shield },
    { id: 'notifications' as TabType, label: t('admin.settings.tabs.notifications'), icon: Bell },
    { id: 'shipping' as TabType, label: t('admin.settings.tabs.shipping'), icon: Package },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t('admin.settings.loadFailed')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <SettingsIcon className="w-8 h-8 text-gray-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('admin.settings.title')}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {t('admin.settings.subtitle')}
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? t('admin.settings.saving') : t('admin.settings.save')}
        </button>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">{t('admin.settings.general.title')}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.settings.general.platformName')}
                  </label>
                  <input
                    type="text"
                    value={settings.platform_name}
                    onChange={(e) => updateSetting('platform_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.settings.general.platformUrl')}
                  </label>
                  <input
                    type="url"
                    value={settings.platform_url}
                    onChange={(e) => updateSetting('platform_url', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.settings.general.supportEmail')}
                  </label>
                  <input
                    type="email"
                    value={settings.support_email}
                    onChange={(e) => updateSetting('support_email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.settings.general.supportPhone')}
                  </label>
                  <input
                    type="tel"
                    value={settings.support_phone}
                    onChange={(e) => updateSetting('support_phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.settings.general.senderFee')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={settings.sender_fee_percentage}
                    onChange={(e) => updateSetting('sender_fee_percentage', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('admin.settings.general.senderFeeHelp')}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.settings.general.travelerFee')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={settings.traveler_fee_percentage}
                    onChange={(e) => updateSetting('traveler_fee_percentage', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('admin.settings.general.travelerFeeHelp')}</p>
                </div>
              </div>
            </div>
          )}

          {/* SMTP Tab */}
          {activeTab === 'smtp' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">{t('admin.settings.smtp.title')}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.settings.smtp.host')}
                  </label>
                  <input
                    type="text"
                    value={settings.smtp_host}
                    onChange={(e) => updateSetting('smtp_host', e.target.value)}
                    placeholder="smtp.gmail.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.settings.smtp.port')}
                  </label>
                  <input
                    type="number"
                    value={settings.smtp_port}
                    onChange={(e) => updateSetting('smtp_port', parseInt(e.target.value))}
                    placeholder="587"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.settings.smtp.username')}
                  </label>
                  <input
                    type="text"
                    value={settings.smtp_username}
                    onChange={(e) => updateSetting('smtp_username', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.settings.smtp.password')}
                  </label>
                  <input
                    type="password"
                    value={settings.smtp_password}
                    onChange={(e) => updateSetting('smtp_password', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.settings.smtp.encryption')}
                  </label>
                  <select
                    value={settings.smtp_encryption}
                    onChange={(e) => updateSetting('smtp_encryption', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="tls">TLS</option>
                    <option value="ssl">SSL</option>
                    <option value="none">{t('admin.settings.smtp.encryptionNone')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.settings.smtp.fromAddress')}
                  </label>
                  <input
                    type="email"
                    value={settings.smtp_from_address}
                    onChange={(e) => updateSetting('smtp_from_address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.settings.smtp.fromName')}
                  </label>
                  <input
                    type="text"
                    value={settings.smtp_from_name}
                    onChange={(e) => updateSetting('smtp_from_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> {t('admin.settings.smtp.gmailNote')}
                </p>
              </div>
            </div>
          )}

          {/* Payment Tab */}
          {activeTab === 'payment' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">{t('admin.settings.payment.title')}</h2>

              <div className="space-y-6">
                {/* Stripe */}
                <div className="border-b pb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <h3 className="text-md font-medium text-gray-900">{t('admin.settings.payment.stripeTitle')}</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('admin.settings.payment.stripePublicKey')}
                      </label>
                      <input
                        type="text"
                        value={settings.stripe_public_key}
                        onChange={(e) => updateSetting('stripe_public_key', e.target.value)}
                        placeholder="pk_test_..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('admin.settings.payment.stripeSecretKey')}
                      </label>
                      <input
                        type="password"
                        value={settings.stripe_secret_key}
                        onChange={(e) => updateSetting('stripe_secret_key', e.target.value)}
                        placeholder="sk_test_..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('admin.settings.payment.stripeWebhookSecret')}
                      </label>
                      <input
                        type="password"
                        value={settings.stripe_webhook_secret}
                        onChange={(e) => updateSetting('stripe_webhook_secret', e.target.value)}
                        placeholder="whsec_..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Orange Money */}
                <div className="border-b pb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-5 h-5 bg-orange-500 rounded-full" />
                    <h3 className="text-md font-medium text-gray-900">{t('admin.settings.payment.orangeMoneyTitle')}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('admin.settings.payment.orangeMoneyApiKey')}
                      </label>
                      <input
                        type="password"
                        value={settings.orange_money_api_key || ''}
                        onChange={(e) => updateSetting('orange_money_api_key', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('admin.settings.payment.orangeMoneyMerchantId')}
                      </label>
                      <input
                        type="text"
                        value={settings.orange_money_merchant_id || ''}
                        onChange={(e) => updateSetting('orange_money_merchant_id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.orange_money_enabled || false}
                          onChange={(e) => updateSetting('orange_money_enabled', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{t('admin.settings.payment.enableOrangeMoney')}</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* MTN Money */}
                <div className="border-b pb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-5 h-5 bg-yellow-500 rounded-full" />
                    <h3 className="text-md font-medium text-gray-900">{t('admin.settings.payment.mtnMoneyTitle')}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('admin.settings.payment.mtnMoneyApiKey')}
                      </label>
                      <input
                        type="password"
                        value={settings.mtn_money_api_key || ''}
                        onChange={(e) => updateSetting('mtn_money_api_key', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('admin.settings.payment.mtnSubscriptionKey')}
                      </label>
                      <input
                        type="password"
                        value={settings.mtn_money_subscription_key || ''}
                        onChange={(e) => updateSetting('mtn_money_subscription_key', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.mtn_money_enabled || false}
                          onChange={(e) => updateSetting('mtn_money_enabled', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{t('admin.settings.payment.enableMtnMoney')}</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Bank Transfer */}
                <div className="border-b pb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-5 h-5 bg-green-600 rounded" />
                    <h3 className="text-md font-medium text-gray-900">{t('admin.settings.payment.bankTransferTitle')}</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('admin.settings.payment.bankName')}
                      </label>
                      <input
                        type="text"
                        value={settings.bank_name || ''}
                        onChange={(e) => updateSetting('bank_name', e.target.value)}
                        placeholder="Ex: BNP Paribas"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('admin.settings.payment.bankIban')}
                        </label>
                        <input
                          type="text"
                          value={settings.bank_iban || ''}
                          onChange={(e) => updateSetting('bank_iban', e.target.value)}
                          placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {t('admin.settings.payment.bankBic')}
                        </label>
                        <input
                          type="text"
                          value={settings.bank_bic || ''}
                          onChange={(e) => updateSetting('bank_bic', e.target.value)}
                          placeholder="BNPAFRPPXXX"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.bank_transfer_enabled || false}
                          onChange={(e) => updateSetting('bank_transfer_enabled', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{t('admin.settings.payment.enableBankTransfer')}</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Cash */}
                <div className="border-b pb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <h3 className="text-md font-medium text-gray-900">{t('admin.settings.payment.cashTitle')}</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.cash_payment_enabled || false}
                          onChange={(e) => updateSetting('cash_payment_enabled', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{t('admin.settings.payment.enableCash')}</span>
                      </label>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> {t('admin.settings.payment.cashNote')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Withdrawals */}
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-4">{t('admin.settings.payment.withdrawalTitle')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('admin.settings.payment.withdrawalFee')}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={settings.withdrawal_fee}
                        onChange={(e) => updateSetting('withdrawal_fee', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('admin.settings.payment.minWithdrawal')}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={settings.min_withdrawal_amount}
                        onChange={(e) => updateSetting('min_withdrawal_amount', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('admin.settings.payment.maxWithdrawal')}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={settings.max_withdrawal_amount}
                        onChange={(e) => updateSetting('max_withdrawal_amount', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Branding Tab */}
          {activeTab === 'branding' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">{t('admin.settings.branding.title')}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.settings.branding.logoUrl')}
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                    {settings.logo_url && (
                      <div className="mb-3 flex justify-center">
                        <img src={settings.logo_url} alt="Logo" className="h-20 object-contain rounded" />
                      </div>
                    )}
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleBrandingUpload(file, 'logo');
                        e.target.value = '';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploading === 'logo'}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                    >
                      {uploading === 'logo' ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {uploading === 'logo' ? t('admin.settings.branding.uploading') : t('admin.settings.branding.uploadLogo')}
                    </button>
                    <p className="text-xs text-gray-500 mt-2">PNG, JPG, SVG - Max 2MB</p>
                  </div>
                  <div className="mt-2">
                    <input
                      type="text"
                      value={settings.logo_url}
                      onChange={(e) => updateSetting('logo_url', e.target.value)}
                      placeholder="/logo.png"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Favicon Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.settings.branding.faviconUrl')}
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                    {settings.favicon_url && (
                      <div className="mb-3 flex justify-center">
                        <img src={settings.favicon_url} alt="Favicon" className="h-12 w-12 object-contain rounded" />
                      </div>
                    )}
                    <input
                      ref={faviconInputRef}
                      type="file"
                      accept="image/x-icon,image/png,image/svg+xml"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleBrandingUpload(file, 'favicon');
                        e.target.value = '';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => faviconInputRef.current?.click()}
                      disabled={uploading === 'favicon'}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                    >
                      {uploading === 'favicon' ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {uploading === 'favicon' ? t('admin.settings.branding.uploading') : t('admin.settings.branding.uploadFavicon')}
                    </button>
                    <p className="text-xs text-gray-500 mt-2">ICO, PNG, SVG - Max 2MB</p>
                  </div>
                  <div className="mt-2">
                    <input
                      type="text"
                      value={settings.favicon_url}
                      onChange={(e) => updateSetting('favicon_url', e.target.value)}
                      placeholder="/favicon.ico"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Primary Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.settings.branding.primaryColor')}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.primary_color}
                      onChange={(e) => updateSetting('primary_color', e.target.value)}
                      className="h-10 w-20 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.primary_color}
                      onChange={(e) => updateSetting('primary_color', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Secondary Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.settings.branding.secondaryColor')}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.secondary_color}
                      onChange={(e) => updateSetting('secondary_color', e.target.value)}
                      className="h-10 w-20 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.secondary_color}
                      onChange={(e) => updateSetting('secondary_color', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Currency Tab */}
          {activeTab === 'currency' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">{t('admin.settings.currency.title')}</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.settings.currency.defaultCurrency')}
                  </label>
                  <select
                    value={settings.default_currency}
                    onChange={(e) => updateSetting('default_currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {currencies.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} - {c.name} ({c.symbol})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.settings.currency.supportedCurrencies')}
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {currencies.map((c) => (
                      <label key={c.code} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.supported_currencies.includes(c.code)}
                          onChange={(e) => {
                            const newCurrencies = e.target.checked
                              ? [...settings.supported_currencies, c.code]
                              : settings.supported_currencies.filter(sc => sc !== c.code);
                            updateSetting('supported_currencies', newCurrencies);
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{c.code} - {c.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">{t('admin.settings.security.title')}</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{t('admin.settings.security.kycRequired')}</h3>
                    <p className="text-sm text-gray-500">{t('admin.settings.security.kycRequiredDesc')}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.kyc_required}
                      onChange={(e) => updateSetting('kyc_required', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{t('admin.settings.security.twoFactor')}</h3>
                    <p className="text-sm text-gray-500">{t('admin.settings.security.twoFactorDesc')}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.two_factor_enabled}
                      onChange={(e) => updateSetting('two_factor_enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('admin.settings.security.sessionTimeout')}
                    </label>
                    <input
                      type="number"
                      value={settings.session_timeout}
                      onChange={(e) => updateSetting('session_timeout', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">{t('admin.settings.security.sessionTimeoutHint')}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('admin.settings.security.maxLoginAttempts')}
                    </label>
                    <input
                      type="number"
                      value={settings.max_login_attempts}
                      onChange={(e) => updateSetting('max_login_attempts', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">{t('admin.settings.notifications.title')}</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{t('admin.settings.notifications.email')}</h3>
                    <p className="text-sm text-gray-500">{t('admin.settings.notifications.emailDesc')}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.email_notifications_enabled}
                      onChange={(e) => updateSetting('email_notifications_enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{t('admin.settings.notifications.push')}</h3>
                    <p className="text-sm text-gray-500">{t('admin.settings.notifications.pushDesc')}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.push_notifications_enabled}
                      onChange={(e) => updateSetting('push_notifications_enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{t('admin.settings.notifications.sms')}</h3>
                    <p className="text-sm text-gray-500">{t('admin.settings.notifications.smsDesc')}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.sms_notifications_enabled}
                      onChange={(e) => updateSetting('sms_notifications_enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Shipping Tab */}
          {activeTab === 'shipping' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">{t('admin.settings.shipping.title')}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.settings.shipping.minPrice')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.min_shipment_price}
                    onChange={(e) => updateSetting('min_shipment_price', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.settings.shipping.maxPrice')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.max_shipment_price}
                    onChange={(e) => updateSetting('max_shipment_price', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> {t('admin.settings.shipping.priceNote')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">{t('admin.settings.notes.title')}</h3>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>{t('admin.settings.notes.immediate')}</li>
          <li>{t('admin.settings.notes.audit')}</li>
          <li>{t('admin.settings.notes.testSmtp')}</li>
          <li>{t('admin.settings.notes.stripeKeys')}</li>
          <li>{t('admin.settings.notes.backup')}</li>
        </ul>
      </div>
    </div>
  );
}
