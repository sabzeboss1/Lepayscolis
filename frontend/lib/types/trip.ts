import { User } from './user';

export interface Trip {
  id: string;
  traveler_id: string;
  traveler?: User;
  departure_city: string;
  departure_country: string;
  departure_date: string;
  arrival_city: string;
  arrival_country: string;
  arrival_date: string;
  available_capacity: number;
  price_per_kg: number;
  currency_code?: string;
  accepted_package_types: string[];
  pickup_address: string;
  delivery_address: string;
  travel_proof_url?: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}
