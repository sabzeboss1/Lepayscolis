import { faker } from '@faker-js/faker';
import type { User, Trip, Shipment, Message, Rating } from '../types';

// Helper to generate consistent mock data
faker.seed(123);

export function generateMockUser(overrides?: Partial<User>): User {
  const completed_deliveries = faker.number.int({ min: 0, max: 100 });
  const rating = faker.number.float({ min: 0, max: 5, fractionDigits: 1 });
  const is_recommended = rating >= 4.5 && completed_deliveries >= 5;

  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    avatar: faker.image.avatar(),
    phone: faker.phone.number(),
    rating,
    completed_deliveries,
    is_recommended,
    kyc_status: faker.helpers.arrayElement(['pending', 'approved', 'rejected']),
    role: 'user',
    currency_code: 'EUR',
    locale: faker.helpers.arrayElement(['fr', 'en']),
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    ...overrides,
  };
}

export function generateMockTrip(overrides?: Partial<Trip>): Trip {
  const departureDate = faker.date.future();
  const arrivalDate = faker.date.soon({ refDate: departureDate, days: 7 });
  const traveler = generateMockUser({ kyc_status: 'approved' });

  return {
    id: faker.string.uuid(),
    traveler_id: traveler.id,
    traveler,
    departure_city: faker.helpers.arrayElement(['Moscow', 'Saint Petersburg', 'Kazan', 'Novosibirsk']),
    departure_country: 'Russia',
    departure_date: departureDate.toISOString(),
    arrival_city: faker.helpers.arrayElement(['Dakar', 'Abidjan', 'Douala', 'Lagos', 'Nairobi']),
    arrival_country: faker.helpers.arrayElement(['Senegal', 'Ivory Coast', 'Cameroon', 'Nigeria', 'Kenya']),
    arrival_date: arrivalDate.toISOString(),
    available_capacity: faker.number.int({ min: 5, max: 50 }),
    price_per_kg: faker.number.float({ min: 10, max: 50, fractionDigits: 2 }),
    accepted_package_types: faker.helpers.arrayElements(
      ['enveloppes', 'petits_colis', 'moyens_colis', 'grands_colis'],
      { min: 1, max: 3 }
    ),
    pickup_address: faker.location.streetAddress({ useFullAddress: true }),
    delivery_address: faker.location.streetAddress({ useFullAddress: true }),
    travel_proof_url: faker.datatype.boolean({ probability: 0.7 })
      ? faker.image.url()
      : undefined,
    status: 'active',
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    ...overrides,
  };
}

export function generateMockShipment(overrides?: Partial<Shipment>): Shipment {
  const sender = generateMockUser({ kyc_status: 'approved' });
  const traveler = generateMockUser({ kyc_status: 'approved' });
  const weight = faker.number.float({ min: 1, max: 20, fractionDigits: 1 });
  const pricePerKg = faker.number.float({ min: 10, max: 50, fractionDigits: 2 });

  return {
    id: faker.string.uuid(),
    sender_id: sender.id,
    sender,
    traveler_id: traveler.id,
    traveler,
    package_description: faker.helpers.arrayElement([
      'Electronics',
      'Documents',
      'Clothing',
      'Books',
      'Gifts',
      'Medicine',
    ]),
    package_weight: weight,
    package_length: faker.number.int({ min: 10, max: 100 }),
    package_width: faker.number.int({ min: 10, max: 100 }),
    package_height: faker.number.int({ min: 5, max: 50 }),
    pickup_city: faker.helpers.arrayElement(['Moscow', 'Saint Petersburg', 'Kazan']),
    pickup_country: 'Russia',
    pickup_address: faker.location.streetAddress(),
    delivery_city: faker.helpers.arrayElement(['Dakar', 'Abidjan', 'Douala']),
    delivery_country: faker.helpers.arrayElement(['Senegal', 'Ivory Coast', 'Cameroon']),
    delivery_address: faker.location.streetAddress(),
    status: faker.helpers.arrayElement(['pending', 'accepted', 'in_transit', 'delivered']),
    payment_amount: weight * pricePerKg,
    payment_status: faker.helpers.arrayElement(['pending', 'escrowed', 'released']),
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    ...overrides,
  };
}

export function generateMockMessage(overrides?: Partial<Message>): Message {
  return {
    id: faker.string.uuid(),
    conversation_id: faker.string.uuid(),
    sender_id: faker.string.uuid(),
    recipient_id: faker.string.uuid(),
    content: faker.lorem.sentence(),
    read: faker.datatype.boolean(),
    created_at: faker.date.recent().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    ...overrides,
  };
}

export function generateMockRating(overrides?: Partial<Rating>): Rating {
  return {
    id: faker.string.uuid(),
    from_user_id: faker.string.uuid(),
    to_user_id: faker.string.uuid(),
    shipment_id: faker.string.uuid(),
    rating: faker.number.int({ min: 1, max: 5 }),
    comment: faker.lorem.paragraph(),
    created_at: faker.date.past().toISOString(),
    ...overrides,
  };
}

// Demo users with known credentials
const demoUsers: User[] = [
  {
    id: 'demo-user-1',
    email: 'demo@lepaysexpresscolis.com',
    name: 'Marie Dubois',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marie',
    phone: '+33612345678',
    rating: 4.8,
    completed_deliveries: 12,
    is_recommended: true,
    kyc_status: 'approved',
    role: 'user',
    currency_code: 'EUR',
    locale: 'fr',
    created_at: new Date('2024-01-15').toISOString(),
    updated_at: new Date('2024-01-15').toISOString(),
  },
  {
    id: 'demo-user-2',
    email: 'traveler@lepaysexpresscolis.com',
    name: 'Ahmed Hassan',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed',
    phone: '+201234567890',
    rating: 4.9,
    completed_deliveries: 25,
    is_recommended: true,
    kyc_status: 'approved',
    role: 'user',
    currency_code: 'EUR',
    locale: 'en',
    created_at: new Date('2023-11-20').toISOString(),
    updated_at: new Date('2023-11-20').toISOString(),
  },
  {
    id: 'demo-user-3',
    email: 'sender@lepaysexpresscolis.com',
    name: 'Olga Petrova',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Olga',
    phone: '+79123456789',
    rating: 4.5,
    completed_deliveries: 5,
    is_recommended: true,
    kyc_status: 'approved',
    role: 'user',
    currency_code: 'EUR',
    locale: 'fr',
    created_at: new Date('2024-02-10').toISOString(),
    updated_at: new Date('2024-02-10').toISOString(),
  },
  {
    id: 'demo-user-4',
    email: 'newuser@lepaysexpresscolis.com',
    name: 'Jean Martin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jean',
    phone: '+33698765432',
    rating: 0,
    completed_deliveries: 0,
    is_recommended: false,
    kyc_status: 'rejected',
    role: 'user',
    currency_code: 'EUR',
    locale: 'fr',
    created_at: new Date('2025-02-01').toISOString(),
    updated_at: new Date('2025-02-01').toISOString(),
  },
];

// Generate arrays of mock data for development
export const mockUsers: User[] = [...demoUsers, ...Array.from({ length: 17 }, () => generateMockUser())];
export const mockTrips: Trip[] = Array.from({ length: 30 }, () => generateMockTrip());
export const mockShipments: Shipment[] = Array.from({ length: 25 }, () => generateMockShipment());
export const mockMessages: Message[] = Array.from({ length: 50 }, () => generateMockMessage());
export const mockRatings: Rating[] = Array.from({ length: 40 }, () => generateMockRating());

// Demo-specific data for newuser (demo-user-4)
export const demoTripsForNewUser: Trip[] = [
  {
    id: 'demo-trip-1',
    traveler_id: 'demo-user-4',
    traveler: demoUsers[3], // Jean Martin
    departure_city: 'Moscou',
    departure_country: 'Russie',
    departure_date: new Date('2025-02-15').toISOString(),
    arrival_city: 'Dakar',
    arrival_country: 'Sénégal',
    arrival_date: new Date('2025-02-16').toISOString(),
    available_capacity: 15,
    price_per_kg: 25,
    accepted_package_types: [],
    pickup_address: '',
    delivery_address: '',
    status: 'active',
    created_at: new Date('2025-02-01').toISOString(),
    updated_at: new Date('2025-02-01').toISOString(),
  },
  {
    id: 'demo-trip-2',
    traveler_id: 'demo-user-4',
    traveler: demoUsers[3],
    departure_city: 'Saint-Pétersbourg',
    departure_country: 'Russie',
    departure_date: new Date('2025-03-01').toISOString(),
    arrival_city: 'Abidjan',
    arrival_country: 'Côte d\'Ivoire',
    arrival_date: new Date('2025-03-02').toISOString(),
    available_capacity: 20,
    price_per_kg: 30,
    accepted_package_types: [],
    pickup_address: '',
    delivery_address: '',
    status: 'active',
    created_at: new Date('2025-02-02').toISOString(),
    updated_at: new Date('2025-02-02').toISOString(),
  },
];

// Demo conversations for newuser
export const demoConversations = [
  {
    id: 'conv-demo-1',
    participants: ['demo-user-4', 'demo-user-1'] as [string, string],
    otherUser: demoUsers[0], // Marie Dubois
  },
  {
    id: 'conv-demo-2',
    participants: ['demo-user-4', 'demo-user-2'] as [string, string],
    otherUser: demoUsers[1], // Ahmed Hassan
  },
];

export const demoMessagesForNewUser: Message[] = [
  // Conversation with Marie Dubois
  {
    id: 'msg-demo-1',
    conversation_id: 'conv-demo-1',
    sender_id: 'demo-user-1',
    recipient_id: 'demo-user-4',
    content: 'Bonjour Jean ! J\'ai vu votre voyage Moscou-Dakar. Avez-vous de la place pour un colis de 5kg ?',
    read: true,
    created_at: new Date('2025-02-02T10:30:00').toISOString(),
    updated_at: new Date('2025-02-02T10:30:00').toISOString(),
  },
  {
    id: 'msg-demo-2',
    conversation_id: 'conv-demo-1',
    sender_id: 'demo-user-4',
    recipient_id: 'demo-user-1',
    content: 'Bonjour Marie ! Oui, j\'ai encore 15kg de disponible. Qu\'est-ce que vous souhaitez envoyer ?',
    read: true,
    created_at: new Date('2025-02-02T10:35:00').toISOString(),
    updated_at: new Date('2025-02-02T10:35:00').toISOString(),
  },
  {
    id: 'msg-demo-3',
    conversation_id: 'conv-demo-1',
    sender_id: 'demo-user-1',
    recipient_id: 'demo-user-4',
    content: 'Ce sont des vêtements et quelques produits alimentaires pour ma famille. Quel est votre prix ?',
    read: true,
    created_at: new Date('2025-02-02T10:40:00').toISOString(),
    updated_at: new Date('2025-02-02T10:40:00').toISOString(),
  },
  {
    id: 'msg-demo-4',
    conversation_id: 'conv-demo-1',
    sender_id: 'demo-user-4',
    recipient_id: 'demo-user-1',
    content: '25€ par kg, donc 125€ pour 5kg. Le paiement est sécurisé via la plateforme.',
    read: true,
    created_at: new Date('2025-02-02T10:45:00').toISOString(),
    updated_at: new Date('2025-02-02T10:45:00').toISOString(),
  },
  {
    id: 'msg-demo-5',
    conversation_id: 'conv-demo-1',
    sender_id: 'demo-user-1',
    recipient_id: 'demo-user-4',
    content: 'Parfait ! Je crée l\'expédition. Merci beaucoup !',
    read: false,
    created_at: new Date('2025-02-02T11:00:00').toISOString(),
    updated_at: new Date('2025-02-02T11:00:00').toISOString(),
  },
  // Conversation with Ahmed Hassan
  {
    id: 'msg-demo-6',
    conversation_id: 'conv-demo-2',
    sender_id: 'demo-user-2',
    recipient_id: 'demo-user-4',
    content: 'Hello! I saw your trip to Abidjan. Do you accept electronics?',
    read: true,
    created_at: new Date('2025-02-02T14:00:00').toISOString(),
    updated_at: new Date('2025-02-02T14:00:00').toISOString(),
  },
  {
    id: 'msg-demo-7',
    conversation_id: 'conv-demo-2',
    sender_id: 'demo-user-4',
    recipient_id: 'demo-user-2',
    content: 'Hi Ahmed! Yes, but they need to be properly packaged. What do you want to send?',
    read: true,
    created_at: new Date('2025-02-02T14:15:00').toISOString(),
    updated_at: new Date('2025-02-02T14:15:00').toISOString(),
  },
  {
    id: 'msg-demo-8',
    conversation_id: 'conv-demo-2',
    sender_id: 'demo-user-2',
    recipient_id: 'demo-user-4',
    content: 'A laptop and some phone accessories for my brother. About 3kg total.',
    read: false,
    created_at: new Date('2025-02-02T14:30:00').toISOString(),
    updated_at: new Date('2025-02-02T14:30:00').toISOString(),
  },
];

// ============================================================================
// Notifications Mock Data
// ============================================================================

import type { Notification } from '../types/api';

export function generateMockNotification(overrides?: Partial<Notification>): Notification {
  const types = ['shipment_accepted', 'payment_released', 'kyc_approved', 'message_received', 'trip_update'];
  const type = faker.helpers.arrayElement(types);

  const titleMap: Record<string, string> = {
    shipment_accepted: 'Colis accepté',
    payment_released: 'Paiement libéré',
    kyc_approved: 'KYC approuvé',
    message_received: 'Nouveau message',
    trip_update: 'Mise à jour du trajet',
  };

  const messageMap: Record<string, string> = {
    shipment_accepted: 'Votre colis a été accepté par un voyageur',
    payment_released: 'Le paiement a été libéré vers votre portefeuille',
    kyc_approved: 'Votre vérification KYC a été approuvée',
    message_received: 'Vous avez reçu un nouveau message',
    trip_update: 'Le statut de votre trajet a été mis à jour',
  };

  return {
    id: faker.string.uuid(),
    user_id: faker.string.uuid(),
    type,
    title: titleMap[type],
    message: messageMap[type],
    data: {},
    is_read: faker.datatype.boolean({ probability: 0.3 }),
    created_at: faker.date.recent({ days: 7 }).toISOString(),
    ...overrides,
  };
}

export const notifications: Notification[] = Array.from({ length: 15 }, () => generateMockNotification());
