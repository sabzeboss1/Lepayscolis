import { NextRequest, NextResponse } from 'next/server';
import { mockShipments } from '@/lib/api/mockData';

// In-memory storage (shared with main shipments route)
const allShipments = [...mockShipments];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const shipment = allShipments.find(s => s.id === id);

    if (!shipment) {
      return NextResponse.json(
        { message: 'Shipment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      shipment,
    });
  } catch (error) {
    console.error('Get shipment error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const shipmentIndex = allShipments.findIndex(s => s.id === id);

    if (shipmentIndex === -1) {
      return NextResponse.json(
        { message: 'Shipment not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      package: pkg,
      pickup,
      delivery,
      status,
      payment,
    } = body;

    // Update shipment
    const updatedShipment = {
      ...allShipments[shipmentIndex],
      ...(pkg && { package: pkg }),
      ...(pickup && { pickup }),
      ...(delivery && { delivery }),
      ...(status && { status }),
      ...(payment && { payment }),
    };

    allShipments[shipmentIndex] = updatedShipment;

    return NextResponse.json({
      shipment: updatedShipment,
    });
  } catch (error) {
    console.error('Update shipment error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
