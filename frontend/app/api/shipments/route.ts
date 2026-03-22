import { NextRequest, NextResponse } from 'next/server';
import { mockShipments, generateMockShipment } from '@/lib/api/mockData';

// In-memory storage for shipments
const allShipments = [...mockShipments];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get filter parameters
    const status = searchParams.get('status');
    const senderId = searchParams.get('senderId');
    const travelerId = searchParams.get('travelerId');
    const pickupCity = searchParams.get('pickupCity');
    const deliveryCity = searchParams.get('deliveryCity');

    // Filter shipments
    let filteredShipments = [...allShipments];

    if (status) {
      filteredShipments = filteredShipments.filter(shipment => 
        shipment.status === status
      );
    }

    if (senderId) {
      filteredShipments = filteredShipments.filter(shipment =>
        shipment.sender_id === senderId
      );
    }

    if (travelerId) {
      filteredShipments = filteredShipments.filter(shipment =>
        shipment.traveler_id === travelerId
      );
    }

    if (pickupCity) {
      filteredShipments = filteredShipments.filter(shipment =>
        shipment.pickup_city.toLowerCase().includes(pickupCity.toLowerCase())
      );
    }

    if (deliveryCity) {
      filteredShipments = filteredShipments.filter(shipment =>
        shipment.delivery_city.toLowerCase().includes(deliveryCity.toLowerCase())
      );
    }

    return NextResponse.json({
      shipments: filteredShipments,
      total: filteredShipments.length,
    });
  } catch (error) {
    console.error('Get shipments error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      package: pkg,
      pickup,
      delivery,
    } = body;

    // Validate package information
    if (!pkg?.description || !pkg?.weight || !pkg?.dimensions) {
      return NextResponse.json(
        { message: 'Package information is required' },
        { status: 400 }
      );
    }

    if (pkg.weight <= 0) {
      return NextResponse.json(
        { message: 'Package weight must be positive' },
        { status: 400 }
      );
    }

    if (pkg.dimensions.length <= 0 || pkg.dimensions.width <= 0 || pkg.dimensions.height <= 0) {
      return NextResponse.json(
        { message: 'Package dimensions must be positive' },
        { status: 400 }
      );
    }

    // Validate pickup location
    if (!pickup?.city || !pickup?.country || !pickup?.address) {
      return NextResponse.json(
        { message: 'Pickup location is required' },
        { status: 400 }
      );
    }

    // Validate delivery location
    if (!delivery?.city || !delivery?.country || !delivery?.address) {
      return NextResponse.json(
        { message: 'Delivery location is required' },
        { status: 400 }
      );
    }

    // Create new shipment
    const newShipment = generateMockShipment({
      package_description: pkg.description,
      package_weight: pkg.weight,
      package_length: pkg.dimensions?.length,
      package_width: pkg.dimensions?.width,
      package_height: pkg.dimensions?.height,
      pickup_city: pickup.city,
      pickup_country: pickup.country,
      pickup_address: pickup.address,
      delivery_city: delivery.city,
      delivery_country: delivery.country,
      delivery_address: delivery.address,
      status: 'pending',
      payment_amount: pkg.weight * 20,
      payment_status: 'pending',
      created_at: new Date().toISOString(),
    });

    allShipments.push(newShipment);

    return NextResponse.json({
      shipment: newShipment,
    }, { status: 201 });
  } catch (error) {
    console.error('Create shipment error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
