'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Package,
  ArrowRight,
  Plus,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  CircleDot,
  PackageOpen,
  Weight,
  MapPin,
} from 'lucide-react';
import type { Shipment } from '@/lib/types/api';

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; bg: string; text: string; border: string }> = {
  pending: {
    label: 'En attente',
    icon: <Clock className="w-3 h-3" />,
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  accepted: {
    label: 'Accepté',
    icon: <CircleDot className="w-3 h-3" />,
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  in_transit: {
    label: 'En transit',
    icon: <Truck className="w-3 h-3" />,
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  delivered: {
    label: 'Livré',
    icon: <CheckCircle2 className="w-3 h-3" />,
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  cancelled: {
    label: 'Annulé',
    icon: <XCircle className="w-3 h-3" />,
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    icon: <CircleDot className="w-3 h-3" />,
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

function ShipmentCard({ shipment, onClick }: { shipment: Shipment; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left group"
      aria-label={`Voir expédition de ${shipment.pickup_city} à ${shipment.delivery_city}`}
    >
      <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-orange-300 hover:shadow-md transition-all duration-200 group-hover:-translate-y-0.5">
        <div className="flex items-start justify-between gap-4">
          {/* Route */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={shipment.status} />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                <span className="font-semibold text-slate-900 text-sm truncate">
                  {shipment.pickup_city ?? '—'}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="font-semibold text-slate-900 text-sm truncate">
                  {shipment.delivery_city ?? '—'}
                </span>
              </div>
            </div>
            {shipment.description && (
              <p className="text-xs text-slate-500 mt-1.5 truncate">{shipment.description}</p>
            )}
          </div>

          {/* Right side */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className="text-lg font-bold text-orange-500">
              {shipment.price?.toFixed(2) ?? '—'}€
            </span>
            {shipment.weight && (
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Weight className="w-3.5 h-3.5" />
                <span>{shipment.weight} kg</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-slate-100 rounded-full w-24" />
          <div className="h-4 bg-slate-100 rounded w-2/3" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
        </div>
        <div className="space-y-2">
          <div className="h-6 bg-slate-100 rounded w-16" />
          <div className="h-3 bg-slate-100 rounded w-12" />
        </div>
      </div>
    </div>
  );
}

export default function ShipmentsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const response = await fetch('/api/shipments');
        if (response.ok) {
          const data = await response.json();
          setShipments(data.shipments || []);
        }
      } catch (error) {
        console.error('Error fetching shipments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchShipments();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 font-heading">Expéditions</h1>
                <p className="text-sm text-slate-500">Gérez vos envois de colis</p>
              </div>
            </div>
            <Button
              variant="primary"
              onClick={() => router.push('/shipments/new')}
              className="shrink-0"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Nouvelle expédition
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : shipments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <PackageOpen className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Aucune expédition</h3>
            <p className="text-slate-500 mb-6 max-w-xs">
              Vous n'avez pas encore d'expédition. Créez-en une pour commencer à envoyer vos colis.
            </p>
            <Button variant="primary" onClick={() => router.push('/shipments/new')}>
              <Plus className="w-4 h-4 mr-1.5" />
              Créer une expédition
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {shipments.slice(0, 10).map((shipment) => (
              <ShipmentCard
                key={shipment.id}
                shipment={shipment}
                onClick={() => router.push(`/shipments/${shipment.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
