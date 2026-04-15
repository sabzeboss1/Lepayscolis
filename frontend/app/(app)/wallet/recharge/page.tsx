'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { KYCBlocker } from '@/components/features/KYCBlocker';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { ErrorHandler } from '@/lib/errors/ErrorHandler';
import type { Wallet } from '@/lib/types/api';
import {
  ArrowLeft,
  Wallet as WalletIcon,
  CreditCard,
  Building2,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react';
import { useUserCurrency } from '@/lib/hooks/useUserCurrency';
import { useCurrencyFormatter } from '@/lib/hooks/useCurrencyFormatter';

const MINIMUM_RECHARGE = 5;
const PRESET_AMOUNTS = [10, 20, 50, 100, 200, 500];

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  fields: Array<{
    name: string;
    label: string;
    type: string;
    placeholder?: string;
    required: boolean;
    helpText?: string;
  }>;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'direct_payment',
    name: 'Paiement direct',
    description: 'Un administrateur vous contactera pour finaliser le paiement',
    icon: <CreditCard className="w-5 h-5" />,
    fields: [
      {
        name: 'phone',
        label: 'Numéro de téléphone',
        type: 'tel',
        placeholder: '+33 6 12 34 56 78',
        required: true,
        helpText: 'Nous vous contacterons sur ce numéro',
      },
      {
        name: 'preferred_contact_time',
        label: 'Horaire de contact préféré',
        type: 'text',
        placeholder: 'Ex: 9h-12h, 14h-18h',
        required: false,
      },
    ],
  },
  {
    id: 'bank_transfer',
    name: 'Virement bancaire',
    description: 'Effectuez un virement et envoyez-nous la preuve',
    icon: <Building2 className="w-5 h-5" />,
    fields: [
      {
        name: 'bank_name',
        label: 'Nom de votre banque',
        type: 'text',
        placeholder: 'Ex: BNP Paribas',
        required: true,
      },
      {
        name: 'account_holder',
        label: 'Titulaire du compte',
        type: 'text',
        placeholder: 'Nom complet',
        required: true,
      },
      {
        name: 'reference',
        label: 'Référence du virement',
        type: 'text',
        placeholder: 'Numéro de transaction',
        required: false,
        helpText: 'Si vous avez déjà effectué le virement',
      },
    ],
  },
  {
    id: 'mobile_money',
    name: 'Mobile Money',
    description: 'Orange Money, MTN Money, Moov Money, etc.',
    icon: <Smartphone className="w-5 h-5" />,
    fields: [
      {
        name: 'provider',
        label: 'Opérateur',
        type: 'text',
        placeholder: 'Ex: Orange Money, MTN',
        required: true,
      },
      {
        name: 'phone_number',
        label: 'Numéro Mobile Money',
        type: 'tel',
        placeholder: '+225 XX XX XX XX XX',
        required: true,
      },
      {
        name: 'account_name',
        label: 'Nom du compte',
        type: 'text',
        placeholder: 'Nom complet',
        required: true,
      },
    ],
  },
];

export default function RechargeWalletPage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { formatCurrency, currencyCode, currencySymbol } = useUserCurrency();
  const { formatWithCurrencyNote } = useCurrencyFormatter();
  
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState<number | ''>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWalletBalance();
    }
  }, [user]);

  const fetchWalletBalance = async () => {
    try {
      const walletResponse = await apiClient.get<{ data: Wallet }>(API_ENDPOINTS.wallet.balance);
      setBalance(walletResponse.data.balance);
    } catch (err) {
      const errorResponse = ErrorHandler.handle(err, locale);
      setError(errorResponse.message);
    }
  };

  const handlePresetClick = (value: number) => {
    setAmount(value);
    setError(null);
  };

  const handlePaymentDetailChange = (fieldName: string, value: string) => {
    setPaymentDetails((prev) => ({ ...prev, [fieldName]: value }));
  };

  const validatePaymentDetails = (): boolean => {
    if (!selectedPaymentMethod) return false;
    for (const field of selectedPaymentMethod.fields) {
      const value = paymentDetails[field.name];
      if (field.required && !value) {
        setError(`Le champ "${field.label}" est requis`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const rechargeAmount = typeof amount === 'number' ? amount : parseFloat(amount);

    if (!selectedPaymentMethod) {
      setError('Veuillez sélectionner une méthode de paiement');
      return;
    }
    if (isNaN(rechargeAmount) || rechargeAmount <= 0) {
      setError('Veuillez entrer un montant valide');
      return;
    }
    if (rechargeAmount < MINIMUM_RECHARGE) {
      setError(`Le montant minimum est de ${MINIMUM_RECHARGE} ${currencySymbol}`);
      return;
    }
    if (!validatePaymentDetails()) return;

    setIsSubmitting(true);
    try {
      await apiClient.post('/api/recharge-requests', {
        amount: rechargeAmount,
        payment_method: selectedPaymentMethod.id,
        payment_details: paymentDetails,
      });
      setSuccess(true);
      setTimeout(() => router.push('/wallet'), 2500);
    } catch (err: any) {
      const errorResponse = ErrorHandler.handle(err, locale);
      setError(errorResponse.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <KYCBlocker action="recharger votre portefeuille">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent" />
        </div>
      </KYCBlocker>
    );
  }

  if (!user) return null;

  if (success) {
    return (
      <KYCBlocker action="recharger votre portefeuille">
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center max-w-md w-full">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-9 h-9 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Demande envoyée !</h2>
            <p className="text-sm text-slate-500 mb-1">
              Votre demande de recharge a été soumise avec succès.
            </p>
            <p className="text-sm text-slate-400">Un administrateur la traitera sous peu.</p>
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
              <div className="animate-spin rounded-full h-3 w-3 border border-slate-300 border-t-slate-600" />
              Redirection en cours...
            </div>
          </div>
        </div>
      </KYCBlocker>
    );
  }

  return (
    <KYCBlocker action="recharger votre portefeuille">
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <WalletIcon className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 font-heading">
                  Recharger mon portefeuille
                </h1>
                <p className="text-sm text-slate-500">Ajoutez des fonds à votre compte</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">
          {/* Balance banner */}
          <div className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl p-4 flex items-center justify-between text-white">
            <div>
              <p className="text-xs text-emerald-100 mb-0.5">Solde actuel</p>
              <p className="text-2xl font-bold">{formatWithCurrencyNote(balance)}</p>
            </div>
            <div className="text-right text-xs text-emerald-100">
              <p>Minimum :</p>
              <p className="font-medium text-white">{MINIMUM_RECHARGE} {currencySymbol}</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Amount selection */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-semibold text-slate-900 mb-4">Montant à recharger</h3>
              
              {/* Preset amounts */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {PRESET_AMOUNTS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handlePresetClick(preset)}
                    className={`py-3 px-4 rounded-lg border-2 font-semibold text-sm transition-all ${
                      amount === preset
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {preset}{currencySymbol}
                  </button>
                ))}
              </div>

              {/* Custom amount */}
              <Input
                type="number"
                label="Ou entrez un montant personnalisé"
                value={amount.toString()}
                onChange={(e) => {
                  setAmount(e.target.value ? parseFloat(e.target.value) : '');
                  setError(null);
                }}
                placeholder="0.00"
                min={MINIMUM_RECHARGE}
                step={0.01}
              />
            </div>

            {/* Payment method selection */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-semibold text-slate-900 mb-4">Méthode de paiement</h3>
              <div className="space-y-2.5">
                {PAYMENT_METHODS.map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      selectedPaymentMethod?.id === method.id
                        ? 'border-emerald-400 bg-emerald-50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value={method.id}
                      checked={selectedPaymentMethod?.id === method.id}
                      onChange={() => {
                        setSelectedPaymentMethod(method);
                        setPaymentDetails({});
                      }}
                      className="mt-0.5 accent-emerald-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-emerald-600">{method.icon}</div>
                        <p className="text-sm font-semibold text-slate-900">{method.name}</p>
                      </div>
                      <p className="text-xs text-slate-500">{method.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Payment details fields */}
            {selectedPaymentMethod && (
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="font-semibold text-slate-900 mb-4">Informations de paiement</h3>
                <div className="space-y-4">
                  {selectedPaymentMethod.fields.map((field) => (
                    <div key={field.name}>
                      <Input
                        label={field.label}
                        id={field.name}
                        type={field.type}
                        value={paymentDetails[field.name] || ''}
                        onChange={(e) => handlePaymentDetailChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                      />
                      {field.helpText && (
                        <p className="mt-1 text-xs text-slate-500">{field.helpText}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Info notice */}
            {selectedPaymentMethod && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <div className="text-xs text-blue-700 space-y-1">
                    <p className="font-semibold mb-1">À savoir :</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Votre demande sera traitée par un administrateur</li>
                      <li>Vous recevrez une notification une fois votre demande traitée</li>
                      <li>Le montant sera crédité sur votre portefeuille après validation</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Summary */}
            {amount && amount >= MINIMUM_RECHARGE && (
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Montant à recharger</span>
                  <span className="text-2xl font-bold text-slate-900">{formatWithCurrencyNote(amount as number)}</span>
                </div>
                <p className="text-xs text-slate-500">
                  Ce montant sera ajouté à votre solde après validation
                </p>
              </div>
            )}

            {/* Submit */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting || !selectedPaymentMethod || !amount || (amount as number) < MINIMUM_RECHARGE}
                loading={isSubmitting}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600"
              >
                {isSubmitting ? 'Envoi en cours...' : 'Soumettre la demande'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </KYCBlocker>
  );
}
