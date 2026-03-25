import { NextRequest, NextResponse } from 'next/server';
import { makeAdminRequest } from '@/lib/api/adminApiHelper';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;

    const response = await makeAdminRequest(
      request,
      `/api/admin/shipments/${params.id}`,
      { method: 'GET' }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    const raw = data.data;
    const s = raw.shipment;

    const transformed = {
      data: {
        shipment: {
          id: s.id,
          tracking_number: s.tracking_number,
          sender: s.sender ?? null,
          delivery_city: s.delivery_city,
          delivery_country: s.delivery_country,
          delivery_address: s.delivery_address,
          pickup_city: s.pickup_city,
          pickup_country: s.pickup_country,
          pickup_address: s.pickup_address,
          package_description: s.package_description,
          package_weight: parseFloat(s.package_weight ?? '0'),
          package_length: s.package_length,
          package_width: s.package_width,
          package_height: s.package_height,
          trip: s.trip ?? null,
          payment_amount: parseFloat(s.payment_amount ?? '0'),
          payment_status: s.payment_status,
          payment: s.payment ?? null,
          status: s.status,
          created_at: s.created_at,
          updated_at: s.updated_at,
        },
        status_history: raw.status_history ?? [],
        analytics: raw.analytics ?? null,
      },
    };

    return NextResponse.json(transformed);
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Shipment not found' },
      { status: error.message?.includes('Unauthorized') ? 401 : 404 }
    );
  }
}
