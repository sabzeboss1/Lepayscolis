import { describe, it, expect } from 'vitest';
import type { User, Trip, Shipment, Message, Rating } from '../index';

describe('Type definitions', () => {
  it('should have User type with required properties', () => {
    const user: User = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      avatar: '/avatar.jpg',
      phone: '+1234567890',
      rating: 4.5,
      completedDeliveries: 10,
      isRecommended: true,
      kycStatus: 'approved',
      createdAt: new Date(),
      locale: 'fr',
    };

    expect(user.id).toBe('1');
    expect(user.email).toBe('test@example.com');
    expect(user.kycStatus).toBe('approved');
  });

  it('should have Trip type with required properties', () => {
    const trip: Trip = {
      id: '1',
      travelerId: 'user1',
      traveler: {} as User,
      departure: {
        city: 'Moscow',
        country: 'Russia',
        date: new Date(),
      },
      arrival: {
        city: 'Lagos',
        country: 'Nigeria',
        date: new Date(),
      },
      availableCapacity: 10,
      pricePerKg: 50,
      status: 'active',
      createdAt: new Date(),
    };

    expect(trip.departure.city).toBe('Moscow');
    expect(trip.arrival.city).toBe('Lagos');
    expect(trip.status).toBe('active');
  });

  it('should have Shipment type with required properties', () => {
    const shipment: Shipment = {
      id: '1',
      senderId: 'user1',
      sender: {} as User,
      package: {
        description: 'Electronics',
        weight: 5,
        dimensions: {
          length: 30,
          width: 20,
          height: 10,
        },
      },
      pickup: {
        city: 'Moscow',
        country: 'Russia',
        address: '123 Main St',
      },
      delivery: {
        city: 'Lagos',
        country: 'Nigeria',
        address: '456 Oak Ave',
      },
      status: 'pending',
      payment: {
        amount: 250,
        status: 'pending',
      },
      createdAt: new Date(),
    };

    expect(shipment.package.weight).toBe(5);
    expect(shipment.status).toBe('pending');
    expect(shipment.payment.status).toBe('pending');
  });

  it('should have Message type with required properties', () => {
    const message: Message = {
      id: '1',
      conversationId: 'conv1',
      senderId: 'user1',
      recipientId: 'user2',
      content: 'Hello',
      read: false,
      createdAt: new Date(),
    };

    expect(message.content).toBe('Hello');
    expect(message.read).toBe(false);
  });

  it('should have Rating type with required properties', () => {
    const rating: Rating = {
      id: '1',
      fromUserId: 'user1',
      toUserId: 'user2',
      shipmentId: 'shipment1',
      rating: 5,
      comment: 'Great service!',
      createdAt: new Date(),
    };

    expect(rating.rating).toBe(5);
    expect(rating.comment).toBe('Great service!');
  });
});
