import { User } from './user';
import { Trip } from './trip';

export interface Shipment {
  id: string;
  sender_id: string;
  sender?: User;
  traveler_id?: string;
  traveler?: User;
  trip_id?: string;
  trip?: Trip;
  package_description: string;
  package_weight: number;
  package_length?: number;
  package_width?: number;
  package_height?: number;
  pickup_city: string;
  pickup_country: string;
  pickup_address: string;
  delivery_city: string;
  delivery_country: string;
  delivery_address: string;
  status: 'pending' | 'accepted' | 'paid' | 'in_transit' | 'delivered' | 'cancelled';
  payment_amount: number;
  price: number; // Alias for payment_amount
  currency_code: string;
  
  // Currency conversion fields
  price_converted?: number;
  price_formatted?: string;
  price_original: number;
  price_original_currency: string;
  
  payment_status: string;
  created_at: string;
  updated_at: string;
}
