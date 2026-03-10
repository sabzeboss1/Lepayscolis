'use client';

import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Save, 
  Mail, 
  CreditCard, 
  Image as ImageIcon,
  DollarSign,
  Globe,
  Shield,
  Bell,
  Package
} from 'lucide-react';

type TabType = 'general' | 'smtp' | 'payment' | 'branding' | 'currency' | 'security' | 'notifications' | 'shipping';

interface PlatformSettings {
  // General
  platform_name: string;
  platform_url: string;
  support_email: string;
  support_phone: string;
  platform_fee_percentage: number;
  
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
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings');
      const data = await response.json();
      setSettings(data.settings || getDefaultSettings());
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setSettings(getDefaultSettings());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultSettings = (): PlatformSettings => ({
    platform_name: 'Le Pays Express Colis',
    platform_url: 'https://lepaysexpresscolis.com',
    support_email: 'support@lepaysexpresscolis.com',
    support_phone: '+33 1 23 45 67 89',
    platform_fee_percentage: 10.0,
    
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
        body: JSON.stringify(settings)
      });
      
      if (!response.ok) throw new Error('Failed to save settings');
      
      setMessage({ type: 'success', text: 'Paramètres enregistrés avec succès' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement' });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof PlatformSettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  const tabs = [
    { id: 'general' as TabType, label: 'Général', icon: SettingsIcon },
    { id: 'smtp' as TabType, label: 'SMTP / Email', icon: Mail },
    { id: 'payment' as TabType, label: 'Paiement', icon: CreditCard },
    { id: 'branding' as TabType, label: 'Branding', icon: ImageIcon },
    { id: 'currency' as TabType, label: 'Devises', icon: DollarSign },
    { id: 'security' as TabType, label: 'Sécurité', icon: Shield },
    { id: 'notifications' as TabType, label: 'Notifications', icon: Bell },
    { id: 'shipping' as TabType, label: 'Expédition', icon: Package },
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
        <p className="text-gray-500">Impossible de charger les paramètres</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Paramètres de la plateforme</h1>
            <p className="text-sm text-gray-600 mt-1">
              Configurez tous les paramètres de votre plateforme
            </p>
          </div>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Enregistrement...' : 'Enregistrer'}
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
              <h2 className="text-lg font-semibold text-gray-900">Paramètres généraux</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de la plateforme
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
                    URL de la plateforme
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
                    Email de support
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
                    Téléphone de support
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
                    Frais de plateforme (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.platform_fee_percentage}
                    onChange={(e) => updateSetting('platform_fee_percentage', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SMTP Tab */}
          {activeTab === 'smtp' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Configuration SMTP</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hôte SMTP
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
                    Port SMTP
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
                    Nom d'utilisateur SMTP
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
                    Mot de passe SMTP
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
                    Chiffrement
                  </label>
                  <select
                    value={settings.smtp_encryption}
                    onChange={(e) => updateSetting('smtp_encryption', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="tls">TLS</option>
                    <option value="ssl">SSL</option>
                    <option value="none">Aucun</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse d'expéditeur
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
                    Nom d'expéditeur
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
                  <strong>Note:</strong> Pour Gmail, vous devez activer "Accès moins sécurisé" ou utiliser un mot de passe d'application.
                </p>
              </div>
            </div>
          )}

          {/* Payment Tab */}
          {activeTab === 'payment' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Configuration des paiements</h2>
              
              <div className="space-y-6">
                {/* Stripe */}
                <div className="border-b pb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <h3 className="text-md font-medium text-gray-900">Stripe (Cartes bancaires)</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Clé publique Stripe
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
                        Clé secrète Stripe
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
                        Secret Webhook Stripe
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
                    <h3 className="text-md font-medium text-gray-900">Orange Money</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        API Key Orange Money
                      </label>
                      <input
                        type="password"
                        value={settings.orange_money_api_key || ''}
                        onChange={(e) => updateSetting('orange_money_api_key', e.target.value)}
                        placeholder="Clé API Orange Money"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Merchant ID
                      </label>
                      <input
                        type="text"
                        value={settings.orange_money_merchant_id || ''}
                        onChange={(e) => updateSetting('orange_money_merchant_id', e.target.value)}
                        placeholder="ID Marchand"
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
                        <span className="text-sm text-gray-700">Activer Orange Money</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* MTN Money */}
                <div className="border-b pb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-5 h-5 bg-yellow-500 rounded-full" />
                    <h3 className="text-md font-medium text-gray-900">MTN Money</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        API Key MTN Money
                      </label>
                      <input
                        type="password"
                        value={settings.mtn_money_api_key || ''}
                        onChange={(e) => updateSetting('mtn_money_api_key', e.target.value)}
                        placeholder="Clé API MTN Money"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subscription Key
                      </label>
                      <input
                        type="password"
                        value={settings.mtn_money_subscription_key || ''}
                        onChange={(e) => updateSetting('mtn_money_subscription_key', e.target.value)}
                        placeholder="Clé d'abonnement"
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
                        <span className="text-sm text-gray-700">Activer MTN Money</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Virement bancaire */}
                <div className="border-b pb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-5 h-5 bg-green-600 rounded" />
                    <h3 className="text-md font-medium text-gray-900">Virement bancaire</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom de la banque
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
                          IBAN
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
                          BIC/SWIFT
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
                        <span className="text-sm text-gray-700">Activer les virements bancaires</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Cash */}
                <div className="border-b pb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <h3 className="text-md font-medium text-gray-900">Paiement en espèces</h3>
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
                        <span className="text-sm text-gray-700">Autoriser les paiements en espèces</span>
                      </label>
                    </div>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> Les paiements en espèces doivent être effectués en personne lors de la remise du colis. Assurez-vous que les utilisateurs comprennent les risques.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Retraits */}
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-4">Paramètres de retrait</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Frais de retrait (€)
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
                        Retrait minimum (€)
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
                        Retrait maximum (€)
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
              <h2 className="text-lg font-semibold text-gray-900">Branding et apparence</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL du logo
                  </label>
                  <input
                    type="text"
                    value={settings.logo_url}
                    onChange={(e) => updateSetting('logo_url', e.target.value)}
                    placeholder="/logo.png"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {settings.logo_url && (
                    <div className="mt-2">
                      <img src={settings.logo_url} alt="Logo" className="h-16 object-contain" />
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL du favicon
                  </label>
                  <input
                    type="text"
                    value={settings.favicon_url}
                    onChange={(e) => updateSetting('favicon_url', e.target.value)}
                    placeholder="/favicon.ico"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Couleur primaire
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
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Couleur secondaire
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
              <h2 className="text-lg font-semibold text-gray-900">Gestion des devises</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Devise par défaut
                  </label>
                  <select
                    value={settings.default_currency}
                    onChange={(e) => updateSetting('default_currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="EUR">EUR - Euro</option>
                    <option value="USD">USD - Dollar américain</option>
                    <option value="GBP">GBP - Livre sterling</option>
                    <option value="XAF">XAF - Franc CFA (CEMAC)</option>
                    <option value="XOF">XOF - Franc CFA (UEMOA)</option>
                    <option value="RUB">RUB - Rouble russe</option>
                    <option value="CAD">CAD - Dollar canadien</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Devises supportées
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['EUR', 'USD', 'GBP', 'XAF', 'XOF', 'RUB', 'CAD', 'CHF'].map((currency) => (
                      <label key={currency} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={settings.supported_currencies.includes(currency)}
                          onChange={(e) => {
                            const newCurrencies = e.target.checked
                              ? [...settings.supported_currencies, currency]
                              : settings.supported_currencies.filter(c => c !== currency);
                            updateSetting('supported_currencies', newCurrencies);
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{currency}</span>
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
              <h2 className="text-lg font-semibold text-gray-900">Paramètres de sécurité</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">KYC obligatoire</h3>
                    <p className="text-sm text-gray-500">Exiger la vérification KYC pour tous les utilisateurs</p>
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
                    <h3 className="text-sm font-medium text-gray-900">Authentification à deux facteurs</h3>
                    <p className="text-sm text-gray-500">Activer 2FA pour les administrateurs</p>
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
                      Timeout de session (secondes)
                    </label>
                    <input
                      type="number"
                      value={settings.session_timeout}
                      onChange={(e) => updateSetting('session_timeout', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">3600 = 1 heure</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tentatives de connexion max
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
              <h2 className="text-lg font-semibold text-gray-900">Paramètres de notifications</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Notifications par email</h3>
                    <p className="text-sm text-gray-500">Envoyer des notifications par email aux utilisateurs</p>
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
                    <h3 className="text-sm font-medium text-gray-900">Notifications push</h3>
                    <p className="text-sm text-gray-500">Envoyer des notifications push aux applications mobiles</p>
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
                    <h3 className="text-sm font-medium text-gray-900">Notifications SMS</h3>
                    <p className="text-sm text-gray-500">Envoyer des notifications par SMS (nécessite un service SMS)</p>
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
              <h2 className="text-lg font-semibold text-gray-900">Paramètres d'expédition</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix minimum d'expédition (€)
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
                    Prix maximum d'expédition (€)
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
                  <strong>Note:</strong> Ces limites s'appliquent aux prix par kilogramme définis par les voyageurs.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">Notes importantes</h3>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>Les modifications prennent effet immédiatement sur toute la plateforme</li>
          <li>Toutes les modifications sont enregistrées dans le journal d'audit</li>
          <li>Assurez-vous de tester les paramètres SMTP avant de les activer en production</li>
          <li>Les clés API Stripe doivent être gardées confidentielles</li>
          <li>Sauvegardez régulièrement vos paramètres</li>
        </ul>
      </div>
    </div>
  );
}
