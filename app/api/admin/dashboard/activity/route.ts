import { NextResponse } from 'next/server';

export async function GET() {
  // Mock data - replace with actual API call to Laravel backend
  const now = new Date();
  
  const activities = [
    {
      id: '1',
      type: 'user_registered' as const,
      description: 'registered a new account',
      user: {
        name: 'Marie Dubois',
        avatar: undefined
      },
      timestamp: new Date(now.getTime() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
      metadata: {}
    },
    {
      id: '2',
      type: 'trip_created' as const,
      description: 'created a new trip from Paris to Lyon',
      user: {
        name: 'Jean Martin',
        avatar: undefined
      },
      timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
      metadata: {
        origin: 'Paris',
        destination: 'Lyon'
      }
    },
    {
      id: '3',
      type: 'shipment_booked' as const,
      description: 'booked a shipment',
      user: {
        name: 'Sophie Bernard',
        avatar: undefined
      },
      timestamp: new Date(now.getTime() - 32 * 60 * 1000).toISOString(), // 32 minutes ago
      metadata: {}
    },
    {
      id: '4',
      type: 'payment_received' as const,
      description: 'completed a payment of €45.00',
      user: {
        name: 'Pierre Lefebvre',
        avatar: undefined
      },
      timestamp: new Date(now.getTime() - 47 * 60 * 1000).toISOString(), // 47 minutes ago
      metadata: {
        amount: 45.00
      }
    },
    {
      id: '5',
      type: 'kyc_submitted' as const,
      description: 'submitted KYC documents for verification',
      user: {
        name: 'Claire Moreau',
        avatar: undefined
      },
      timestamp: new Date(now.getTime() - 65 * 60 * 1000).toISOString(), // 1 hour 5 minutes ago
      metadata: {}
    },
    {
      id: '6',
      type: 'user_registered' as const,
      description: 'registered a new account',
      user: {
        name: 'Thomas Petit',
        avatar: undefined
      },
      timestamp: new Date(now.getTime() - 92 * 60 * 1000).toISOString(), // 1 hour 32 minutes ago
      metadata: {}
    },
    {
      id: '7',
      type: 'trip_created' as const,
      description: 'created a new trip from Marseille to Nice',
      user: {
        name: 'Isabelle Roux',
        avatar: undefined
      },
      timestamp: new Date(now.getTime() - 118 * 60 * 1000).toISOString(), // 1 hour 58 minutes ago
      metadata: {
        origin: 'Marseille',
        destination: 'Nice'
      }
    },
    {
      id: '8',
      type: 'shipment_booked' as const,
      description: 'booked a shipment',
      user: {
        name: 'Luc Garnier',
        avatar: undefined
      },
      timestamp: new Date(now.getTime() - 145 * 60 * 1000).toISOString(), // 2 hours 25 minutes ago
      metadata: {}
    },
    {
      id: '9',
      type: 'payment_received' as const,
      description: 'completed a payment of €78.50',
      user: {
        name: 'Nathalie Blanc',
        avatar: undefined
      },
      timestamp: new Date(now.getTime() - 172 * 60 * 1000).toISOString(), // 2 hours 52 minutes ago
      metadata: {
        amount: 78.50
      }
    },
    {
      id: '10',
      type: 'kyc_submitted' as const,
      description: 'submitted KYC documents for verification',
      user: {
        name: 'Antoine Faure',
        avatar: undefined
      },
      timestamp: new Date(now.getTime() - 198 * 60 * 1000).toISOString(), // 3 hours 18 minutes ago
      metadata: {}
    },
    {
      id: '11',
      type: 'user_registered' as const,
      description: 'registered a new account',
      user: {
        name: 'Camille Girard',
        avatar: undefined
      },
      timestamp: new Date(now.getTime() - 225 * 60 * 1000).toISOString(), // 3 hours 45 minutes ago
      metadata: {}
    },
    {
      id: '12',
      type: 'trip_created' as const,
      description: 'created a new trip from Toulouse to Bordeaux',
      user: {
        name: 'Julien Bonnet',
        avatar: undefined
      },
      timestamp: new Date(now.getTime() - 251 * 60 * 1000).toISOString(), // 4 hours 11 minutes ago
      metadata: {
        origin: 'Toulouse',
        destination: 'Bordeaux'
      }
    },
    {
      id: '13',
      type: 'shipment_booked' as const,
      description: 'booked a shipment',
      user: {
        name: 'Émilie Lambert',
        avatar: undefined
      },
      timestamp: new Date(now.getTime() - 278 * 60 * 1000).toISOString(), // 4 hours 38 minutes ago
      metadata: {}
    },
    {
      id: '14',
      type: 'payment_received' as const,
      description: 'completed a payment of €62.00',
      user: {
        name: 'Maxime Fontaine',
        avatar: undefined
      },
      timestamp: new Date(now.getTime() - 305 * 60 * 1000).toISOString(), // 5 hours 5 minutes ago
      metadata: {
        amount: 62.00
      }
    },
    {
      id: '15',
      type: 'kyc_submitted' as const,
      description: 'submitted KYC documents for verification',
      user: {
        name: 'Laura Chevalier',
        avatar: undefined
      },
      timestamp: new Date(now.getTime() - 332 * 60 * 1000).toISOString(), // 5 hours 32 minutes ago
      metadata: {}
    },
    {
      id: '16',
      type: 'user_registered' as const,
      description: 'registered a new account',
      user: {
        name: 'Nicolas Gauthier',
        avatar: undefined
      },
      timestamp: new Date(now.getTime() - 358 * 60 * 1000).toISOString(), // 5 hours 58 minutes ago
      metadata: {}
    },
    {
      id: '17',
      type: 'trip_created' as const,
      description: 'created a new trip from Lille to Strasbourg',
      user: {
        name: 'Aurélie Perrin',
        avatar: undefined
      },
      timestamp: new Date(now.getTime() - 385 * 60 * 1000).toISOString(), // 6 hours 25 minutes ago
      metadata: {
        origin: 'Lille',
        destination: 'Strasbourg'
      }
    },
    {
      id: '18',
      type: 'shipment_booked' as const,
      description: 'booked a shipment',
      user: {
        name: 'Sébastien Morel',
        avatar: undefined
      },
      timestamp: new Date(now.getTime() - 412 * 60 * 1000).toISOString(), // 6 hours 52 minutes ago
      metadata: {}
    },
    {
      id: '19',
      type: 'payment_received' as const,
      description: 'completed a payment of €91.25',
      user: {
        name: 'Valérie Simon',
        avatar: undefined
      },
      timestamp: new Date(now.getTime() - 438 * 60 * 1000).toISOString(), // 7 hours 18 minutes ago
      metadata: {
        amount: 91.25
      }
    },
    {
      id: '20',
      type: 'kyc_submitted' as const,
      description: 'submitted KYC documents for verification',
      user: {
        name: 'Olivier Michel',
        avatar: undefined
      },
      timestamp: new Date(now.getTime() - 465 * 60 * 1000).toISOString(), // 7 hours 45 minutes ago
      metadata: {}
    }
  ];

  return NextResponse.json({
    data: activities,
    meta: {
      total: activities.length,
      cached_at: new Date().toISOString(),
      cache_ttl: 60 // 1 minute
    }
  });
}
