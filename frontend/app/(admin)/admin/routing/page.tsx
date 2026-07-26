'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useAdminCurrency } from '@/lib/hooks/useAdminCurrency';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { Button } from '@/components/ui/Button';
import {
  Package,
  Plane,
  MapPin,
  Weight,
  Calendar,
  User,
  ArrowRight,
  Plus,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface Trip {
  id: string;
  traveler: { id: string; name: string; email: string; avatar?: string };
  departure_city: string;
  departure_country: string;
  arrival_city: string;
  arrival_country: string;
  departure_date: string;
  arrival_date: string;
  available_capacity: number;
  price_per_kg: number;
  currency_code: string;
  status: string;
  verification_status: string;
  shipments_count: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  rating: number;
  completed_deliveries: number;
  role: string;
  kyc_status: string;
  active_trips_count: number;
  pending_shipments_count: number;
}

interface Shipment {
  id: string;
  sender: { id: string; name: string; email: string };
  title: string;
  package_weight: number;
  pickup_city: string;
  pickup_country: string;
  delivery_city: string;
  delivery_country: string;
  payment_amount: number;
  currency_code: string;
  status: string;
  created_at: string;
}

interface ShipmentRequest {
  id: string;
  sender: { id: string; name: string; email: string };
  title: string;
  weight: number;
  pickup_city: { name: string };
  pickup_country: { name: string };
  delivery_city: { name: string };
  delivery_country: { name: string };
  max_budget: number;
  currency_code: string;
  status: string;
  verification_status: string;
  bids_count: number;
  created_at: string;
}

export default function AdminRoutingPage() {
  const { t } = useTranslation();
  const { formatCurrency } = useAdminCurrency();
  const router = useRouter();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [shipmentRequests, setShipmentRequests] = useState<ShipmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ShipmentRequest | null>(null);
  const [activeTab, setActiveTab] = useState<'shipments' | 'requests'>('shipments');
  const [leftPanelMode, setLeftPanelMode] = useState<'trips' | 'users'>('trips');
  const [routingMode, setRoutingMode] = useState<'trip-to-shipment' | 'user-to-shipment' | 'shipment-to-user'>('trip-to-shipment');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tripsRes, usersRes, shipmentsRes, requestsRes] = await Promise.all([
        apiClient.get<{ data: Trip[] }>(API_ENDPOINTS.admin.trips.list, {
          params: { status: 'active', verification_status: 'verified', per_page: 100 }
        }),
        apiClient.get<{ data: User[] }>(API_ENDPOINTS.admin.users.list, {
          params: { role: 'user', kyc_status: 'approved', per_page: 100 }
        }),
        apiClient.get<{ data: Shipment[] }>(API_ENDPOINTS.admin.shipments.list, {
          params: { status: 'pending', per_page: 100 }
        }),
        apiClient.get<{ data: ShipmentRequest[] }>(API_ENDPOINTS.admin.shipmentRequests.list, {
          params: { status: 'open', verification_status: 'verified', per_page: 100 }
        })
      ]);

      setTrips(tripsRes.data || []);
      setUsers(usersRes.data || []);
      setShipments(shipmentsRes.data || []);
      setShipmentRequests(requestsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch routing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignShipmentToTrip = async () => {
    if (!selectedTrip || !selectedShipment) return;

    // Pre-validate capacity before making the API call
    // CRITICAL: Convert to Number to handle string values from backend
    const tripCapacity = Number(selectedTrip.available_capacity);
    const shipmentWeight = Number(selectedShipment.package_weight);
    
    if (isNaN(tripCapacity) || isNaN(shipmentWeight) || tripCapacity < shipmentWeight) {
      alert(`Capacité insuffisante: Le voyage a ${tripCapacity}kg disponible mais l'expédition pèse ${shipmentWeight}kg`);
      return;
    }

    try {
      await apiClient.post(API_ENDPOINTS.admin.routing.assignShipment, {
        trip_id: selectedTrip.id,
        shipment_id: selectedShipment.id
      });
      
      alert('Expédition assignée avec succès au voyage !');
      fetchData();
      setSelectedTrip(null);
      setSelectedShipment(null);
    } catch (error: any) {
      console.error('Failed to assign shipment:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Erreur lors de l\'assignation';
      alert(`Erreur: ${errorMessage}`);
    }
  };

  const handleRecommendTravelerForRequest = async () => {
    if (!selectedRequest || !selectedTrip || !selectedTrip.traveler) return;

    try {
      await apiClient.post(API_ENDPOINTS.admin.routing.recommendTraveler, {
        shipment_request_id: selectedRequest.id,
        traveler_id: selectedTrip.traveler.id,
        trip_id: selectedTrip.id
      });
      
      alert('Voyageur recommandé avec succès pour cette demande !');
      fetchData();
      setSelectedTrip(null);
      setSelectedRequest(null);
    } catch (error: any) {
      console.error('Failed to recommend traveler:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Erreur lors de la recommandation';
      alert(`Erreur: ${errorMessage}`);
    }
  };

  const handleAssignShipmentToUser = async () => {
    if (!selectedUser || !selectedShipment) return;

    try {
      await apiClient.post(API_ENDPOINTS.admin.routing.assignShipmentToUser, {
        user_id: selectedUser.id,
        shipment_id: selectedShipment.id
      });
      
      alert('Expédition assignée avec succès à l\'utilisateur !');
      fetchData();
      setSelectedUser(null);
      setSelectedShipment(null);
    } catch (error: any) {
      console.error('Failed to assign shipment to user:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Erreur lors de l\'assignation';
      alert(`Erreur: ${errorMessage}`);
    }
  };

  const handleRecommendUserForRequest = async () => {
    if (!selectedRequest || !selectedUser) return;

    try {
      await apiClient.post(API_ENDPOINTS.admin.routing.recommendUser, {
        shipment_request_id: selectedRequest.id,
        user_id: selectedUser.id
      });
      
      alert('Utilisateur recommandé avec succès pour cette demande !');
      fetchData();
      setSelectedUser(null);
      setSelectedRequest(null);
    } catch (error: any) {
      console.error('Failed to recommend user:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Erreur lors de la recommandation';
      alert(`Erreur: ${errorMessage}`);
    }
  };

  const isUserCompatible = (user: User, item: Shipment | ShipmentRequest) => {
    // Basic compatibility check - can be enhanced with more criteria
    const hasKyc = user.kyc_status === 'approved';
    const isActive = user.role === 'user';
    
    return { compatible: hasKyc && isActive, hasKyc, isActive };
  };

  const getUserCompatibilityBadge = (user: User, item: Shipment | ShipmentRequest) => {
    const { compatible, hasKyc, isActive } = isUserCompatible(user, item);
    
    if (compatible) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Compatible
      </span>;
    } else if (!hasKyc) {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <AlertCircle className="w-3 h-3 mr-1" />
        KYC requis
      </span>;
    } else {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <AlertCircle className="w-3 h-3 mr-1" />
        Inactif
      </span>;
    }
  };

  /**
   * Helper to check if trip has sufficient capacity for item
   * CRITICAL: Converts to Number to handle string values from backend
   */
  const hasInsufficientCapacity = (trip: Trip, item: Shipment | ShipmentRequest): boolean => {
    const tripCapacity = Number(trip.available_capacity);
    const itemWeight = Number('package_weight' in item ? item.package_weight : item.weight);
    return isNaN(tripCapacity) || isNaN(itemWeight) || tripCapacity < itemWeight;
  };

  /**
   * Normalize city name for comparison (handles Moscow/Moscou, etc.)
   */
  const normalizeCityName = (cityName: string): string => {
    const normalized = cityName
      .toLowerCase()
      .trim()
      .normalize('NFD') // Decompose accents
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]/g, ''); // Remove non-alphanumeric

    // Common city name variations (add more as needed)
    const variations: Record<string, string> = {
      'moscow': 'moscow',
      'moscou': 'moscow',
      'moskva': 'moscow',
      'moskwa': 'moscow',
      'douala': 'douala',
      'yaounde': 'yaounde',
      'yaound': 'yaounde',
      'paris': 'paris',
      'saratov': 'saratov',
      'saratow': 'saratov',
    };

    return variations[normalized] || normalized;
  };

  /**
   * Check if two cities match (handles name variations)
   */
  const citiesMatch = (city1: string, city2: string): boolean => {
    const norm1 = normalizeCityName(city1);
    const norm2 = normalizeCityName(city2);
    
    // Exact match after normalization
    if (norm1 === norm2) return true;
    
    // One contains the other (for partial matches)
    if (norm1.length > 3 && norm2.length > 3) {
      return norm1.includes(norm2) || norm2.includes(norm1);
    }
    
    return false;
  };

  const isRouteCompatible = (trip: Trip, item: Shipment | ShipmentRequest) => {
    // Handle different object structures for pickup/delivery locations
    let pickupCity: string;
    let pickupCountry: string;
    let deliveryCity: string;
    let deliveryCountry: string;
    let weight: number;

    if ('package_weight' in item) {
      // This is a Shipment
      pickupCity = item.pickup_city;
      pickupCountry = item.pickup_country;
      deliveryCity = item.delivery_city;
      deliveryCountry = item.delivery_country;
      weight = item.package_weight;
    } else {
      // This is a ShipmentRequest
      pickupCity = item.pickup_city?.name ?? '';
      pickupCountry = item.pickup_country?.name ?? '';
      deliveryCity = item.delivery_city?.name ?? '';
      deliveryCountry = item.delivery_country?.name ?? '';
      weight = item.weight;
    }

    // OPTION B: Hierarchical matching - Perfect match (cities) OR Country fallback
    // Step 1: Check for perfect city match
    const pickupCityMatch = citiesMatch(trip.departure_city, pickupCity);
    const deliveryCityMatch = citiesMatch(trip.arrival_city, deliveryCity);
    const perfectMatch = pickupCityMatch && deliveryCityMatch;

    // Step 2: Check for country match (fallback)
    const pickupCountryMatch = trip.departure_country === pickupCountry;
    const deliveryCountryMatch = trip.arrival_country === deliveryCountry;
    const countryMatch = pickupCountryMatch && deliveryCountryMatch;

    // Route is compatible if perfect match OR country match
    const routeMatch = perfectMatch || countryMatch;

    // CRITICAL FIX: Convert to Number to handle string values from backend
    const tripCapacity = Number(trip.available_capacity);
    const itemWeight = Number(weight);
    const capacityMatch = !isNaN(tripCapacity) && !isNaN(itemWeight) && tripCapacity >= itemWeight;

    // Get item identifier safely for debugging
    const itemIdentifier = 'package_weight' in item 
      ? `Shipment: ${item.title}` 
      : `Request: ${item.title}`;

    // Debug log
    console.log('Route Compatibility Check (Hierarchical):', {
      trip: `${trip.traveler.name} - ${trip.departure_city}, ${trip.departure_country} → ${trip.arrival_city}, ${trip.arrival_country}`,
      item: itemIdentifier,
      itemRoute: `${pickupCity}, ${pickupCountry} → ${deliveryCity}, ${deliveryCountry}`,
      perfectMatch: perfectMatch ? '✅ Perfect (cities match)' : '❌',
      countryMatch: countryMatch ? '✅ Country match' : '❌',
      routeMatch: routeMatch ? '✅ Compatible' : '❌',
      capacityMatch: capacityMatch ? `✅ ${tripCapacity}kg >= ${itemWeight}kg` : `❌ ${tripCapacity}kg < ${itemWeight}kg`,
      finalCompatible: routeMatch && capacityMatch
    });

    return { 
      routeMatch, 
      capacityMatch, 
      compatible: routeMatch && capacityMatch,
      perfectMatch,  // NEW: for differentiated badges
      countryMatch   // NEW: for differentiated badges
    };
  };

  const getCompatibilityBadge = (trip: Trip, item: Shipment | ShipmentRequest) => {
    const { routeMatch, capacityMatch, compatible, perfectMatch, countryMatch } = isRouteCompatible(trip, item);
    
    if (compatible) {
      if (perfectMatch) {
        // Perfect match: same cities
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Compatible - Match parfait
        </span>;
      } else {
        // Country match: same country but different cities
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Compatible - Même pays
        </span>;
      }
    } else if (countryMatch && !capacityMatch) {
      // Same country but insufficient capacity
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
        <AlertCircle className="w-3 h-3 mr-1" />
        Même pays - Capacité insuffisante
      </span>;
    } else if (!countryMatch && capacityMatch) {
      // Sufficient capacity but different countries
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <AlertCircle className="w-3 h-3 mr-1" />
        Pays différents
      </span>;
    } else {
      // Completely incompatible
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <AlertCircle className="w-3 h-3 mr-1" />
        Incompatible
      </span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Routage Manuel</h1>
          <p className="text-sm text-gray-600 mt-1">
            Assignez manuellement les expéditions aux voyages et recommandez des voyageurs
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Mode de routage :</span>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => {
                setRoutingMode('trip-to-shipment');
                setLeftPanelMode('trips');
              }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                routingMode === 'trip-to-shipment'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Voyage → Expédition
            </button>
            <button
              onClick={() => {
                setRoutingMode('user-to-shipment');
                setLeftPanelMode('users');
              }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                routingMode === 'user-to-shipment'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Utilisateur → Expédition
            </button>
            <button
              onClick={() => {
                setRoutingMode('shipment-to-user');
                setLeftPanelMode('users');
              }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                routingMode === 'shipment-to-user'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Expédition → Utilisateur
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Trips or Users */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                {leftPanelMode === 'trips' ? (
                  <>
                    <Plane className="w-5 h-5 mr-2 text-blue-600" />
                    Voyages Disponibles ({trips.length})
                  </>
                ) : (
                  <>
                    <User className="w-5 h-5 mr-2 text-green-600" />
                    Utilisateurs Actifs ({users.length})
                  </>
                )}
              </h2>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setLeftPanelMode('trips')}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    leftPanelMode === 'trips'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Voyages
                </button>
                <button
                  onClick={() => setLeftPanelMode('users')}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    leftPanelMode === 'users'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Utilisateurs
                </button>
              </div>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {leftPanelMode === 'trips' ? (
              trips.map((trip) => (
                <div
                  key={trip.id}
                  onClick={() => setSelectedTrip(trip)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedTrip?.id === trip.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{trip.traveler?.name ?? 'Utilisateur supprimé'}</p>
                        <p className="text-xs text-gray-500">{trip.traveler?.email}</p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-green-600">
                      {trip.available_capacity} kg dispo
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">
                      {trip.departure_city} → {trip.arrival_city}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(trip.departure_date).toLocaleDateString()}
                    </span>
                    <span>{formatCurrency(trip.price_per_kg, trip.currency_code)}/kg</span>
                  </div>
                </div>
              ))
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedUser?.id === user.id ? 'bg-green-50 border-green-200' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-yellow-600">
                        ⭐ {user.rating ? user.rating.toFixed(1) : '0.0'}
                      </span>
                      <p className="text-xs text-gray-500">
                        {user.completed_deliveries || 0} livraisons
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>KYC: {user.kyc_status}</span>
                    <span>{user.active_trips_count} voyages actifs</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Shipments/Requests */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Package className="w-5 h-5 mr-2 text-orange-600" />
                {activeTab === 'shipments' ? 'Expéditions en Attente' : 'Demandes d\'Expédition'}
              </h2>
            </div>
            
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('shipments')}
                className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'shipments'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Expéditions ({shipments.length})
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'requests'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Demandes ({shipmentRequests.length})
              </button>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {activeTab === 'shipments' ? (
              shipments.map((shipment) => (
                <div
                  key={shipment.id}
                  onClick={() => setSelectedShipment(shipment)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedShipment?.id === shipment.id ? 'bg-orange-50 border-orange-200' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{shipment.title}</p>
                      <p className="text-xs text-gray-500">Par {shipment.sender?.name ?? 'Utilisateur supprimé'}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-orange-600">
                        {shipment.package_weight} kg
                      </span>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(shipment.payment_amount, shipment.currency_code)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">
                      {shipment.pickup_city} → {shipment.delivery_city}
                    </span>
                  </div>
                  
                  {(selectedTrip || selectedUser) && (
                    <div className="mt-2">
                      {selectedTrip && getCompatibilityBadge(selectedTrip, shipment)}
                      {selectedUser && getUserCompatibilityBadge(selectedUser, shipment)}
                    </div>
                  )}
                </div>
              ))
            ) : (
              shipmentRequests.map((request) => (
                <div
                  key={request.id}
                  onClick={() => setSelectedRequest(request)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedRequest?.id === request.id ? 'bg-orange-50 border-orange-200' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{request.title}</p>
                      <p className="text-xs text-gray-500">Par {request.sender?.name ?? 'Utilisateur supprimé'}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-orange-600">
                        {request.weight} kg
                      </span>
                      <p className="text-xs text-gray-500">
                        Budget: {formatCurrency(request.max_budget, request.currency_code)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">
                      {request.pickup_city?.name ?? '—'} → {request.delivery_city?.name ?? '—'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{request.bids_count} soumission(s)</span>
                    <span>{new Date(request.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  {(selectedTrip || selectedUser) && (
                    <div className="mt-2">
                      {selectedTrip && getCompatibilityBadge(selectedTrip, request)}
                      {selectedUser && getUserCompatibilityBadge(selectedUser, request)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Action Panel */}
      {((selectedTrip || selectedUser) && (selectedShipment || selectedRequest)) && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Action de Routage</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className={`rounded-lg p-4 ${selectedTrip ? 'bg-blue-50' : 'bg-green-50'}`}>
              <h4 className={`font-medium mb-2 ${selectedTrip ? 'text-blue-900' : 'text-green-900'}`}>
                {selectedTrip ? 'Voyage Sélectionné' : 'Utilisateur Sélectionné'}
              </h4>
              {selectedTrip && (
                <>
                  <p className="text-sm text-blue-800">{selectedTrip.traveler?.name ?? 'Utilisateur supprimé'}</p>
                  <p className="text-xs text-blue-600">
                    {selectedTrip.departure_city} → {selectedTrip.arrival_city}
                  </p>
                  <p className="text-xs text-blue-600">
                    {selectedTrip.available_capacity} kg disponible
                  </p>
                </>
              )}
              {selectedUser && (
                <>
                  <p className="text-sm text-green-800">{selectedUser.name}</p>
                  <p className="text-xs text-green-600">{selectedUser.email}</p>
                  <p className="text-xs text-green-600">
                    ⭐ {selectedUser.rating ? selectedUser.rating.toFixed(1) : '0.0'} • {selectedUser.completed_deliveries || 0} livraisons
                  </p>
                </>
              )}
            </div>
            
            <div className="flex items-center justify-center">
              <ArrowRight className="w-8 h-8 text-gray-400" />
            </div>
            
            <div className="bg-orange-50 rounded-lg p-4">
              <h4 className="font-medium text-orange-900 mb-2">
                {activeTab === 'shipments' ? 'Expédition' : 'Demande'} Sélectionnée
              </h4>
              {selectedShipment && (
                <>
                  <p className="text-sm text-orange-800">{selectedShipment.title}</p>
                  <p className="text-xs text-orange-600">
                    {selectedShipment.pickup_city} → {selectedShipment.delivery_city}
                  </p>
                  <p className="text-xs text-orange-600">
                    {selectedShipment.package_weight} kg
                  </p>
                </>
              )}
              {selectedRequest && (
                <>
                  <p className="text-sm text-orange-800">{selectedRequest.title}</p>
                  <p className="text-xs text-orange-600">
                    {selectedRequest.pickup_city?.name ?? '—'} → {selectedRequest.delivery_city?.name ?? '—'}
                  </p>
                  <p className="text-xs text-orange-600">
                    {selectedRequest.weight} kg
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Compatibility Status */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Statut de Compatibilité</h4>
            <div className="flex flex-wrap gap-2">
              {selectedTrip && selectedShipment && (
                <>
                  {getCompatibilityBadge(selectedTrip, selectedShipment)}
                  {hasInsufficientCapacity(selectedTrip, selectedShipment) && (
                    <span className="text-sm text-red-600">
                      Capacité: {Number(selectedTrip.available_capacity).toFixed(2)}kg disponible / {Number(selectedShipment.package_weight).toFixed(2)}kg requis
                    </span>
                  )}
                </>
              )}
              {selectedTrip && selectedRequest && (
                <>
                  {getCompatibilityBadge(selectedTrip, selectedRequest)}
                  {hasInsufficientCapacity(selectedTrip, selectedRequest) && (
                    <span className="text-sm text-red-600">
                      Capacité: {Number(selectedTrip.available_capacity).toFixed(2)}kg disponible / {Number(selectedRequest.weight).toFixed(2)}kg requis
                    </span>
                  )}
                </>
              )}
              {selectedUser && selectedShipment && (
                <>
                  {getUserCompatibilityBadge(selectedUser, selectedShipment)}
                  {selectedUser.kyc_status !== 'approved' && (
                    <span className="text-sm text-red-600">
                      L'utilisateur doit avoir un KYC approuvé
                    </span>
                  )}
                </>
              )}
              {selectedUser && selectedRequest && (
                <>
                  {getUserCompatibilityBadge(selectedUser, selectedRequest)}
                  {selectedUser.kyc_status !== 'approved' && (
                    <span className="text-sm text-red-600">
                      L'utilisateur doit avoir un KYC approuvé
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className="flex gap-3">
            {/* Trip-based actions */}
            {selectedTrip && selectedShipment && (
              <Button
                variant="primary"
                onClick={handleAssignShipmentToTrip}
                disabled={hasInsufficientCapacity(selectedTrip, selectedShipment)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {hasInsufficientCapacity(selectedTrip, selectedShipment)
                  ? 'Capacité insuffisante' 
                  : 'Assigner l\'Expédition au Voyage'
                }
              </Button>
            )}
            
            {selectedTrip && selectedRequest && (
              <Button
                variant="primary"
                onClick={handleRecommendTravelerForRequest}
                disabled={hasInsufficientCapacity(selectedTrip, selectedRequest)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {hasInsufficientCapacity(selectedTrip, selectedRequest)
                  ? 'Capacité insuffisante' 
                  : 'Recommander ce Voyageur'
                }
              </Button>
            )}

            {/* User-based actions */}
            {selectedUser && selectedShipment && (
              <Button
                variant="primary"
                onClick={handleAssignShipmentToUser}
                disabled={selectedUser.kyc_status !== 'approved'}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {selectedUser.kyc_status !== 'approved' 
                  ? 'KYC requis' 
                  : 'Assigner l\'Expédition à l\'Utilisateur'
                }
              </Button>
            )}
            
            {selectedUser && selectedRequest && (
              <Button
                variant="primary"
                onClick={handleRecommendUserForRequest}
                disabled={selectedUser.kyc_status !== 'approved'}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {selectedUser.kyc_status !== 'approved' 
                  ? 'KYC requis' 
                  : 'Recommander cet Utilisateur'
                }
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={() => {
                setSelectedTrip(null);
                setSelectedUser(null);
                setSelectedShipment(null);
                setSelectedRequest(null);
              }}
            >
              Annuler
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}