import { User } from './user';

export interface Shipment {
  id: string;
  senderId: string;
  sender: User;
  travelerId?: string;
  traveler?: User;
  package: {
    description: string;
    weight: number; // in kg
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
  };
  pickup: {
    city: string;
    country: string;
    address: string;
  };
  delivery: {
    city: string;
    country: string;
    address: string;
  };
  status: 'pending' | 'accepted' | 'in_transit' | 'delivered' | 'cancelled';
  payment: {
    amount: number;
    status: 'pending' | 'escrowed' | 'released' | 'refunded';
  };
  createdAt: Date;
}
