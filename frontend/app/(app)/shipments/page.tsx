'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { Shipment } from '@/lib/types';

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

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-800',
            accepted: 'bg-blue-100 text-blue-800',
            in_transit: 'bg-purple-100 text-purple-800',
            delivered: 'bg-green-100 text-green-800',
            cancelled: 'bg-red-100 text-red-800',
        };
        return styles[status] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-4">
                <div className="max-w-4xl mx-auto">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-32 bg-gray-200 rounded"></div>
                        <div className="h-32 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">📦 {t('navigation.shipments')}</h1>
                        <p className="text-gray-500 mt-1">Gérez vos expéditions de colis</p>
                    </div>
                    <Button
                        variant="primary"
                        onClick={() => router.push('/shipments/new')}
                    >
                        + Nouvelle expédition
                    </Button>
                </div>

                {/* Shipments List */}
                {shipments.length === 0 ? (
                    <Card className="p-8 text-center">
                        <div className="text-4xl mb-4">📭</div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune expédition</h3>
                        <p className="text-gray-500 mb-4">Vous n'avez pas encore d'expédition en cours.</p>
                        <Button variant="primary" onClick={() => router.push('/shipments/new')}>
                            Créer une expédition
                        </Button>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {shipments.slice(0, 10).map((shipment) => (
                            <Card
                                key={shipment.id}
                                hoverable
                                onClick={() => router.push(`/shipments/${shipment.id}`)}
                                className="cursor-pointer"
                            >
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(shipment.status)}`}>
                                                    {shipment.status}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    {shipment.package?.weight}kg
                                                </span>
                                            </div>
                                            <h3 className="font-semibold text-gray-900">
                                                {shipment.pickup?.city} → {shipment.delivery?.city}
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {shipment.package?.description}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-blue-600">
                                                {shipment.payment?.amount?.toFixed(2)}€
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
