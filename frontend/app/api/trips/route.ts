import { NextRequest, NextResponse } from 'next/server';
import { mockTrips, generateMockTrip } from '@/lib/api/mockData';

// In-memory storage for new trips
const allTrips = [...mockTrips];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get filter parameters
    const departure = searchParams.get('departure');
    const arrival = searchParams.get('arrival');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const minCapacity = searchParams.get('minCapacity');

    // Filter trips
    let filteredTrips = allTrips.filter(trip => trip.status === 'active');

    if (departure) {
      filteredTrips = filteredTrips.filter(trip => 
        trip.departure.city.toLowerCase().includes(departure.toLowerCase())
      );
    }

    if (arrival) {
      filteredTrips = filteredTrips.filter(trip => 
        trip.arrival.city.toLowerCase().includes(arrival.toLowerCase())
      );
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filteredTrips = filteredTrips.filter(trip => 
        new Date(trip.departure.date) >= fromDate
      );
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      filteredTrips = filteredTrips.filter(trip => 
        new Date(trip.departure.date) <= toDate
      );
    }

    if (minCapacity) {
      const capacity = parseFloat(minCapacity);
      filteredTrips = filteredTrips.filter(trip => 
        trip.availableCapacity >= capacity
      );
    }

    return NextResponse.json({
      trips: filteredTrips,
      total: filteredTrips.length,
    });
  } catch (error) {
    console.error('Get trips error:', error);
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

    // Récupérer le FormData
    const formData = await request.formData();
    
    // Extraire les données
    const departureCity = formData.get('departure_city') as string;
    const departureCountry = formData.get('departure_country') as string;
    const departureDate = formData.get('departure_date') as string;
    const arrivalCity = formData.get('arrival_city') as string;
    const arrivalCountry = formData.get('arrival_country') as string;
    const arrivalDate = formData.get('arrival_date') as string;
    const availableCapacity = parseFloat(formData.get('available_capacity') as string);
    const pricePerKg = parseFloat(formData.get('price_per_kg') as string);
    const pickupAddress = formData.get('pickup_address') as string;
    const deliveryAddress = formData.get('delivery_address') as string;
    
    // Extraire les types de colis (array)
    const acceptedPackageTypes: string[] = [];
    let index = 0;
    while (formData.has(`accepted_package_types[${index}]`)) {
      acceptedPackageTypes.push(formData.get(`accepted_package_types[${index}]`) as string);
      index++;
    }

    // Validate required fields
    if (!departureCity || !departureCountry || !departureDate) {
      return NextResponse.json(
        { message: 'Departure information is required' },
        { status: 400 }
      );
    }

    if (!arrivalCity || !arrivalCountry || !arrivalDate) {
      return NextResponse.json(
        { message: 'Arrival information is required' },
        { status: 400 }
      );
    }

    if (!availableCapacity || availableCapacity <= 0) {
      return NextResponse.json(
        { message: 'Available capacity must be positive' },
        { status: 400 }
      );
    }

    if (!pricePerKg || pricePerKg <= 0) {
      return NextResponse.json(
        { message: 'Price per kg must be positive' },
        { status: 400 }
      );
    }

    if (!acceptedPackageTypes || acceptedPackageTypes.length === 0) {
      return NextResponse.json(
        { message: 'At least one package type must be selected' },
        { status: 400 }
      );
    }

    if (!pickupAddress || pickupAddress.length < 5) {
      return NextResponse.json(
        { message: 'Pickup address is required' },
        { status: 400 }
      );
    }

    if (!deliveryAddress || deliveryAddress.length < 5) {
      return NextResponse.json(
        { message: 'Delivery address is required' },
        { status: 400 }
      );
    }

    // Validate dates
    const departureDateObj = new Date(departureDate);
    const arrivalDateObj = new Date(arrivalDate);

    if (departureDateObj >= arrivalDateObj) {
      return NextResponse.json(
        { message: 'Departure date must be before arrival date' },
        { status: 400 }
      );
    }

    // Create new trip (mock data for now)
    const newTrip = generateMockTrip({
      departure: {
        city: departureCity,
        country: departureCountry,
        date: departureDateObj,
      },
      arrival: {
        city: arrivalCity,
        country: arrivalCountry,
        date: arrivalDateObj,
      },
      availableCapacity,
      pricePerKg,
      acceptedPackageTypes,
      pickupAddress,
      deliveryAddress,
      travelProofUrl: formData.has('travel_proof') ? 'mock-travel-proof-url.pdf' : undefined,
      status: 'active',
      createdAt: new Date(),
    });

    allTrips.push(newTrip);

    return NextResponse.json({
      trip: newTrip,
    }, { status: 201 });
  } catch (error) {
    console.error('Create trip error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
