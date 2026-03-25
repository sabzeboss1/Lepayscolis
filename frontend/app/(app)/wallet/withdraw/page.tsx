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
import {
  getWithdrawalConfig,
  getSupportedCountries,
  formatAmount,
  type PaymentMethod,
  type PaymentMethodField,
} from '@/lib/data/withdrawalMethods';
import type { Wallet } from '@/lib/types/api';
import {
  ArrowLeft,
  Banknote,
  Globe,
  CheckCircle2,
  AlertCircle,
  Info,
  ChevronDown,
} from 'lucide-react';

const MINIMUM_WITHDRAWAL = 10;
const WITHDRAWAL_FEE_PERCENTAGE = 0;

export default function WithdrawPage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState('EUR');
  const [amount, setAmount] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const supportedCountries = getSupportedCountries();

  useEffect(() => {
    if (user) {
      fetchWalletBalance();
      if ((user as any).country) setSelectedCountry((user as any).country);
    }
  }, [user]);

  useEffect(() => {
    setSelectedPaymentMethod(null);
    setPaymentDetails({});
  }, [selectedCountry]);

  const fetchWalletBalance = async () => {
    try {
      const walletResponse = await apiClient.get<{ data: Wallet }>(API_ENDPOINTS.wallet.balance);
      setBalance(walletResponse.data.balance);
      setCurrency(walletResponse.data.currency);
    } catch (err) {
      const errorResponse = ErrorHandler.handle(err, locale);
      setError(errorResponse.message);
    }
  };

  const calculateFee = (n: number) => n * WITHDRAWAL_FEE_PERCENTAGE;
  const calculateNetAmount = (n: number) => n - calculateFee(n);

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
      if (value && field.pattern) {
        const regex = new RegExp(field.pattern);
        if (!regex.test(value)) {
          setError(`Le format du champ "${field.label}" est invalide`);
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const withdrawalAmount = parseFloat(amount);
    const config = getWithdrawalConfig(selectedCountry);

    if (!selectedCountry || !config) {
      setError('Veuillez sélectionner un pays');
      return;
    }
    if (!selectedPaymentMethod) {
      setError('Veuillez sélectionner une méthode de paiement');
      return;
    }
    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      setError('Veuillez entrer un montant valide');
      return;
    }
    if (withdrawalAmount < MINIMUM_WITHDRAWAL) {
      setError(`Le montant minimum de retrait est de ${MINIMUM_WITHDRAWAL} ${config.currencySymbol}`);
      return;
    }
    if (withdrawalAmount > balance) {
      setError('Solde insuffisant');
      return;
    }
    if (!validatePaymentDetails()) return;

    setIsSubmitting(true);
    try {
      await apiClient.post(API_ENDPOINTS.withdrawals.create, {
        amount: withdrawalAmount,
        payment_method: selectedPaymentMethod.id,
        payment_details: {
          ...paymentDetails,
          country_code: selectedCountry,
          currency: config.currency,
        },
      });
      setSuccess(true);
      setTimeout(() => router.push('/wallet/withdrawals'), 2500);
    } catch (err: any) {
      const errorResponse = ErrorHandler.handle(err, locale);
      setError(errorResponse.message);
      if (errorResponse.fieldErrors) setFieldErrors(errorResponse.fieldErrors);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <KYCBlocker action="effectuer un retrait">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-orange-500 border-t-transparent" />
        </div>
      </KYCBlocker>
    );
  }

  if (!user) return null;

  if (success) {
    return (
      <KYCBlocker action="effectuer un retrait">
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center max-w-md w-full">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-9 h-9 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Demande envoyée !</h2>
            <p className="text-sm text-slate-500 mb-1">
              Votre demande de retrait a été soumise avec succès.
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

  const config = selectedCountry ? getWithdrawalConfig(selectedCountry) : null;
  const parsedAmount = parseFloat(amount);
  const validAmount = !isNaN(parsedAmount) && parsedAmount >= MINIMUM_WITHDRAWAL;

  return (
    <KYCBlocker action="effectuer un retrait">
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
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Banknote className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 font-heading">
                  Demander un retrait
                </h1>
                <p className="text-sm text-slate-500">Retirez vos gains vers votre compte</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">
          {/* Balance banner */}
          <div className="bg-gradient-to-r from-slate-900 to-blue-950 rounded-xl p-4 flex items-center justify-between text-white">
            <div>
              <p className="text-xs text-blue-300 mb-0.5">Solde disponible</p>
              <p className="text-2xl font-bold">
                {config
                  ? formatAmount(balance, config.currency, config.currencySymbol)
                  : `${balance.toFixed(2)} EUR`}
              </p>
            </div>
            <div className="text-right text-xs text-blue-300">
              <p>Minimum :</p>
              <p className="font-medium text-white">
                {config
                  ? formatAmount(MINIMUM_WITHDRAWAL, config.currency, config.currencySymbol)
                  : `${MINIMUM_WITHDRAWAL} EUR`}
              </p>
            </div>
          </div>

          {/* Form card */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Country selection */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-4 h-4 text-orange-500" />
                <h3 className="font-semibold text-slate-900">Pays de réception</h3>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Sélectionnez le pays
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    required
                    className="w-full appearance-none px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white pr-10"
                  >
                    <option value="">-- Choisir un pays --</option>
                    {supportedCountries.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                {config && (
                  <p className="mt-2 text-xs text-slate-500">
                    Devise : <span className="font-medium">{config.currency}</span> ({config.currencySymbol})
                  </p>
                )}
              </div>
            </div>

            {/* Payment method */}
            {config && (
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="font-semibold text-slate-900 mb-4">Méthode de paiement</h3>
                <div className="space-y-2.5">
                  {config.paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        selectedPaymentMethod?.id === method.id
                          ? 'border-orange-400 bg-orange-50'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment_method"
                        value={method.id}
                        checked={selectedPaymentMethod?.id === method.id}
                        onChange={() => setSelectedPaymentMethod(method)}
                        className="mt-0.5 accent-orange-500"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{method.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{method.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Amount */}
            {selectedPaymentMethod && config && (
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="font-semibold text-slate-900 mb-4">Montant du retrait</h3>
                <Input
                  label={`Montant (${config.currencySymbol})`}
                  id="amount"
                  type="number"
                  step="0.01"
                  min={MINIMUM_WITHDRAWAL}
                  max={balance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Minimum ${MINIMUM_WITHDRAWAL}`}
                  required
                />

                {validAmount && (
                  <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Montant demandé</span>
                      <span className="font-medium text-slate-900">
                        {formatAmount(parsedAmount, config.currency, config.currencySymbol)}
                      </span>
                    </div>
                    {WITHDRAWAL_FEE_PERCENTAGE > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Frais ({WITHDRAWAL_FEE_PERCENTAGE * 100}%)</span>
                        <span className="font-medium text-red-500">
                          -{formatAmount(calculateFee(parsedAmount), config.currency, config.currencySymbol)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                      <span className="font-semibold text-slate-900">Montant net</span>
                      <span className="font-bold text-emerald-600">
                        {formatAmount(calculateNetAmount(parsedAmount), config.currency, config.currencySymbol)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Payment details fields */}
            {selectedPaymentMethod && (
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h3 className="font-semibold text-slate-900 mb-4">Informations de paiement</h3>
                <div className="space-y-4">
                  {selectedPaymentMethod.fields.map((field: PaymentMethodField) => (
                    <div key={field.name}>
                      <Input
                        label={field.label}
                        id={field.name}
                        type={field.type}
                        value={paymentDetails[field.name] || ''}
                        onChange={(e) => handlePaymentDetailChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                        pattern={field.pattern}
                        error={fieldErrors[field.name]}
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
                      <li>Le délai de traitement est généralement de 2–5 jours ouvrés</li>
                      <li>Vous recevrez une notification une fois votre demande traitée</li>
                    </ul>
                  </div>
                </div>
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
                disabled={isSubmitting || !selectedPaymentMethod}
                loading={isSubmitting}
                className="flex-1"
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
