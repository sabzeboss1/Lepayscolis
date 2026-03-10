'use client';

import { useCallback } from 'react';
import {
  useShipmentStatusUpdates,
  useTripStatusUpdates,
  usePaymentStatusUpdates,
} from '@/lib/websocket/hooks';
import { useAuth } from '@/lib/auth';

interface StatusUpdateData {
  id: string;
  status: string;
  updated_at?: string;
}

/**
 * Hook to listen to real-time shipment status updates
 */
export function useRealtimeShipmentStatus(
  shipmentId: string | null,
  onStatusUpdate?: (data: StatusUpdateData) => void
) {
  useShipmentStatusUpdates(
    shipmentId,
    useCallback(
      (data: { shipment_id: string; status: string }) => {
        if (onStatusUpdate) {
          onStatusUpdate({
            id: data.shipment_id,
            status: data.status,
          });
        }
      },
      [onStatusUpdate]
    )
  );
}

/**
 * Hook to listen to real-time trip status updates
 */
export function useRealtimeTripStatus(
  tripId: string | null,
  onStatusUpdate?: (data: StatusUpdateData) => void
) {
  useTripStatusUpdates(
    tripId,
    useCallback(
      (data: { trip_id: string; status: string }) => {
        if (onStatusUpdate) {
          onStatusUpdate({
            id: data.trip_id,
            status: data.status,
          });
        }
      },
      [onStatusUpdate]
    )
  );
}

/**
 * Hook to listen to real-time payment status updates
 */
export function useRealtimePaymentStatus(
  onStatusUpdate?: (data: StatusUpdateData) => void
) {
  const { user } = useAuth();

  usePaymentStatusUpdates(
    user?.id || null,
    useCallback(
      (data: { payment_id: string; status: string }) => {
        if (onStatusUpdate) {
          onStatusUpdate({
            id: data.payment_id,
            status: data.status,
          });
        }
      },
      [onStatusUpdate]
    )
  );
}

/**
 * Combined hook to listen to all status updates for a user
 */
export function useRealtimeAllStatusUpdates(callbacks: {
  onShipmentUpdate?: (data: StatusUpdateData) => void;
  onTripUpdate?: (data: StatusUpdateData) => void;
  onPaymentUpdate?: (data: StatusUpdateData) => void;
}) {
  // This would require subscribing to a general user channel
  // For now, individual hooks should be used per resource
  useRealtimePaymentStatus(callbacks.onPaymentUpdate);
}
