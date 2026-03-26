'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { KYCBlocker } from '@/components/features/KYCBlocker';
import { ArrowLeft, CreditCard, Wallet, AlertCircle } from 'lucide-react';

const PRESET_AMOUNTS = [10, 20, 50, 100, 200, 500];

export default function RechargeWalletPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [amount, setAmount] = useState<number | ''>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePresetClick = (value: number) => {
    setAmount(value);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || amount < 5) {
      setError('Le montant minimum est de 5€');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // TODO: Intégrer Stripe ou autre système de paiement
      // Pour l'instant, on simule juste
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert(`Recharge de ${amount}€ en cours de traitement. Cette fonctionnalité sera bientôt disponible avec Stripe.`);
      router.push('/wallet');
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsProcessing(false);
    }
  };

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
                <Wallet className="w-5 h-5 text-emerald-600" />
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

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">
            
            {/* Info banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">Paiement sécurisé</p>
                <p className="text-blue-700">
                  Vos paiements sont traités de manière sécurisée. Le montant minimum est de 5€.
                </p>
              </div>
            </div>

            {/* Amount selection */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Montant à recharger</h3>
              
              {/* Preset amounts */}
              <div className="grid grid-cols-3 gap-3 mb-5">
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
                    {preset}€
                  </button>
                ))}
              </div>

              {/* Custom amount */}
              <div>
                <Input
                  type="number"
                  label="Ou entrez un montant personnalisé"
                  value={amount.toString()}
                  onChange={(e) => {
                    setAmount(e.target.value ? parseFloat(e.target.value) : '');
                    setError(null);
                  }}
                  placeholder="0.00"
                  min={5}
                  step={0.01}
                />
              </div>
            </div>

            {/* Payment method */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Méthode de paiement</h3>
              
              <div className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-lg bg-slate-50">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200">
                  <CreditCard className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Carte bancaire</p>
                  <p className="text-xs text-slate-500">Visa, Mastercard, American Express</p>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Summary */}
            {amount && amount >= 5 && (
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Montant à payer</span>
                  <span className="text-2xl font-bold text-slate-900">{amount}€</span>
                </div>
                <p className="text-xs text-slate-500">
                  Ce montant sera ajouté à votre solde disponible
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isProcessing}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!amount || amount < 5 || isProcessing}
                loading={isProcessing}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600"
              >
                Continuer
              </Button>
            </div>
          </div>
        </form>
      </div>
    </KYCBlocker>
  );
}
