import { User } from './user';

export interface Trip {
  id: string;
  travelerId: string;
  traveler: User;
  departure: {
    city: string;
    country: string;
    date: Date;
  };
  arrival: {
    city: string;
    country: string;
    date: Date;
  };
  availableCapacity: number; // in kg
  pricePerKg: number;
  acceptedPackageTypes: string[]; // Types de colis acceptés
  pickupAddress: string; // Adresse de ramassage
  deliveryAddress: string; // Adresse de livraison
  travelProofUrl?: string; // URL de la preuve de voyage (optionnel)
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
}
