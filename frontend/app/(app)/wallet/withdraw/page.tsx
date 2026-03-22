'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
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
  type PaymentMethodField
} from '@/lib/data/withdrawalMethods';
import type { Wallet } from '@/lib/types/api';

export default function WithdrawPage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState('EUR');
  const [amount, setAmount] = useState('');
  
  // Country and payment method selection
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<Record<string, string>>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const MINIMUM_WITHDRAWAL = 10;
  const WITHDRAWAL_FEE_PERCENTAGE = 0; // 0% fee for now

  const supportedCountries = getSupportedCountries();

  useEffect(() => {
    if (user) {
      fetchWalletBalance();
    }
  }, [user]);

  useEffect(() => {
    // Reset payment method when country changes
    setSelectedPaymentMethod(null);
    setPaymentDetails({});
  }, [selectedCountry]);

  const fetchWalletBalance = async () => {
    try {
      const walletResponse = await apiClient.get<{ data: Wallet }>(
        API_ENDPOINTS.wallet.balance
      );
      setBalance(walletResponse.data.balance);
      setCurrency(walletResponse.data.currency);
    } catch (err) {
      const errorResponse = ErrorHandler.handle(err, locale);
      setError(errorResponse.message);
      ErrorHandler.log(err, { endpoint: 'wallet', method: 'GET' });
    }
  };

  const calculateFee = (withdrawalAmount: number) => {
    return withdrawalAmount * WITHDRAWAL_FEE_PERCENTAGE;
  };

  const calculateNetAmount = (withdrawalAmount: number) => {
    return withdrawalAmount - calculateFee(withdrawalAmount);
  };

  const handlePaymentDetailChange = (fieldName: string, value: string) => {
    setPaymentDetails(prev => ({
      ...prev,
      [fieldName]: value
    }));
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
    setSuccess(false);

    const withdrawalAmount = parseFloat(amount);
    const config = getWithdrawalConfig(selectedCountry);

    // Validation
    if (!selectedCountry || !config) {
      setError(locale === 'en' ? 'Please select a country' : 'Veuillez sélectionner un pays');
      return;
    }

    if (!selectedPaymentMethod) {
      setError(locale === 'en' ? 'Please select a payment method' : 'Veuillez sélectionner une méthode de paiement');
      return;
    }

    if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
      setError(locale === 'en' ? 'Please enter a valid amount' : 'Veuillez entrer un montant valide');
      return;
    }

    if (withdrawalAmount < MINIMUM_WITHDRAWAL) {
      setError(
        locale === 'en' 
          ? `Minimum withdrawal amount is ${MINIMUM_WITHDRAWAL} ${config.currencySymbol}`
          : `Le montant minimum de retrait est de ${MINIMUM_WITHDRAWAL} ${config.currencySymbol}`
      );
      return;
    }

    if (withdrawalAmount > balance) {
      setError(locale === 'en' ? 'Insufficient balance' : 'Solde insuffisant');
      return;
    }

    if (!validatePaymentDetails()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const requestData = {
        amount: withdrawalAmount,
        payment_method: selectedPaymentMethod.id,
        payment_details: {
          ...paymentDetails,
          country_code: selectedCountry,
          currency: config.currency,
        }
      };

      await apiClient.post(
        API_ENDPOINTS.withdrawals.create,
        requestData
      );
      
      setSuccess(true);
      
      // Show success toast notification
      setTimeout(() => {
        router.push('/wallet/withdrawals');
      }, 2000);
    } catch (err: any) {
      const errorResponse = ErrorHandler.handle(err, locale);
      setError(errorResponse.message);
      
      // Handle field-level validation errors
      if (errorResponse.fieldErrors) {
        setFieldErrors(errorResponse.fieldErrors);
      }
      
      ErrorHandler.log(err, { endpoint: 'withdrawals', method: 'POST' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <KYCBlocker action="effectuer un retrait">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('common.loading')}</p>
          </div>
        </div>
      </KYCBlocker>
    );
  }

  if (!user) {
    return null;
  }

  if (success) {
    return (
      <KYCBlocker action="effectuer un retrait">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {locale === 'en' ? 'Request submitted!' : 'Demande envoyée !'}
            </h2>
            <p className="text-gray-600 mb-6">
              {locale === 'en' 
                ? 'Your withdrawal request has been submitted successfully. An administrator will process it shortly.'
                : 'Votre demande de retrait a été soumise avec succès. Un administrateur la traitera sous peu.'}
            </p>
            <p className="text-sm text-gray-500">
              {locale === 'en' ? 'Redirecting...' : 'Redirection en cours...'}
            </p>
          </Card>
        </div>
      </KYCBlocker>
    );
  }

  const config = selectedCountry ? getWithdrawalConfig(selectedCountry) : null;

  return (
    <KYCBlocker action="effectuer un retrait">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Demander un retrait</h1>
        <p className="text-gray-600 mt-2">Retirez vos gains vers votre compte</p>
      </div>

      {/* Balance Info */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <div className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-600 mb-1">Solde disponible</p>
            <p className="text-2xl font-bold text-blue-900">
              {config ? formatAmount(balance, config.currency, config.currencySymbol) : `${balance.toFixed(2)} EUR`}
            </p>
          </div>
          <div className="text-right text-sm text-blue-600">
            <p>Minimum: {config ? formatAmount(MINIMUM_WITHDRAWAL, config.currency, config.currencySymbol) : `${MINIMUM_WITHDRAWAL} EUR`}</p>
          </div>
        </div>
      </Card>

      {/* Withdrawal Form */}
      <Card>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Country Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pays de réception</h3>
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sélectionnez le pays
                <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                id="country"
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">-- Choisir un pays --</option>
                {supportedCountries.map(country => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
            {config && (
              <p className="mt-2 text-sm text-gray-600">
                Devise: {config.currency} ({config.currencySymbol})
              </p>
            )}
          </div>

          {/* Payment Method Selection */}
          {config && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Méthode de paiement</h3>
              <div className="space-y-3">
                {config.paymentMethods.map(method => (
                  <label
                    key={method.id}
                    className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      selectedPaymentMethod?.id === method.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value={method.id}
                      checked={selectedPaymentMethod?.id === method.id}
                      onChange={() => setSelectedPaymentMethod(method)}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{method.name}</p>
                      <p className="text-sm text-gray-600">{method.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Amount Section */}
          {selectedPaymentMethod && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Montant du retrait</h3>
              <Input
                label={`Montant (${config?.currencySymbol})`}
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

              {amount && parseFloat(amount) >= MINIMUM_WITHDRAWAL && config && (
                <div className="mt-4 bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Montant demandé</span>
                    <span className="font-medium">{formatAmount(parseFloat(amount), config.currency, config.currencySymbol)}</span>
                  </div>
                  {WITHDRAWAL_FEE_PERCENTAGE > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Frais ({WITHDRAWAL_FEE_PERCENTAGE * 100}%)</span>
                      <span className="font-medium text-red-600">
                        -{formatAmount(calculateFee(parseFloat(amount)), config.currency, config.currencySymbol)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                    <span className="font-semibold text-gray-900">Montant net</span>
                    <span className="font-semibold text-green-600">
                      {formatAmount(calculateNetAmount(parseFloat(amount)), config.currency, config.currencySymbol)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payment Details Fields */}
          {selectedPaymentMethod && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de paiement</h3>
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
                    />
                    {field.helpText && (
                      <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Info Message */}
          {selectedPaymentMethod && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
              <p className="font-medium mb-1">À savoir :</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Votre demande sera traitée par un administrateur</li>
                <li>Le délai de traitement est généralement de 2-5 jours ouvrés</li>
                <li>Vous recevrez une notification une fois votre demande traitée</li>
              </ul>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={isSubmitting || !selectedPaymentMethod}
            >
              {isSubmitting ? 'Envoi en cours...' : 'Soumettre la demande'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
    </KYCBlocker>
  );
}
