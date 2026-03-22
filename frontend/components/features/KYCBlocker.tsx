'use client';

import { useRouter } from 'next/navigation';
import { Shield, AlertCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useKYCCheck } from '@/lib/hooks/useKYCCheck';

interface KYCBlockerProps {
  action: string; // e.g., "publier un voyage", "envoyer un colis"
  children?: React.ReactNode;
}

export function KYCBlocker({ action, children }: KYCBlockerProps) {
  const router = useRouter();
  const { isKYCApproved, isKYCPending, isKYCRejected } = useKYCCheck();

  // If KYC is approved, render children
  if (isKYCApproved) {
    return <>{children}</>;
  }

  // Otherwise, show blocking message
  const getStatusInfo = () => {
    if (isKYCPending) {
      return {
        icon: Clock,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        title: 'Vérification en cours',
        message: `Votre document KYC est en cours de vérification. Vous pourrez ${action} une fois votre identité approuvée.`,
        buttonText: 'Voir le statut KYC',
        buttonVariant: 'outline' as const
      };
    }

    if (isKYCRejected) {
      return {
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        title: 'Vérification rejetée',
        message: `Votre document KYC a été rejeté. Veuillez soumettre à nouveau vos documents pour ${action}.`,
        buttonText: 'Soumettre à nouveau',
        buttonVariant: 'primary' as const
      };
    }

    // Not submitted
    return {
      icon: Shield,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      title: 'Vérification KYC requise',
      message: `Pour ${action}, vous devez d'abord compléter votre vérification d'identité (KYC). Cette étape est obligatoire pour garantir la sécurité de tous les utilisateurs.`,
      buttonText: 'Compléter la vérification',
      buttonVariant: 'primary' as const
    };
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className={`${statusInfo.bgColor} border-2 ${statusInfo.borderColor}`}>
        <div className="text-center py-12">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${statusInfo.bgColor} mb-4`}>
            <StatusIcon className={`w-8 h-8 ${statusInfo.color}`} />
          </div>
          
          <h2 className={`text-2xl font-bold ${statusInfo.color} mb-3`}>
            {statusInfo.title}
          </h2>
          
          <p className="text-gray-700 mb-6 max-w-md mx-auto">
            {statusInfo.message}
          </p>

          {!isKYCPending && (
            <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200 mb-6 text-left max-w-md mx-auto">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-1">Pourquoi la vérification KYC ?</p>
                <p className="text-gray-600">
                  La vérification d'identité nous permet de créer un environnement sûr et de confiance pour tous les utilisateurs de la plateforme.
                </p>
              </div>
            </div>
          )}
          
          <div className="flex gap-3 justify-center">
            <Button
              variant={statusInfo.buttonVariant}
              onClick={() => router.push('/kyc')}
            >
              {statusInfo.buttonText}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              Retour
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
