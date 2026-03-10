/**
 * API Types and Interfaces for Le Pays Express Colis
 * These types match the Laravel backend API responses
 */

// ============================================================================
// User Types
// ============================================================================

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  avatar_url?: string;
  kyc_status: 'pending' | 'approved' | 'rejected' | 'not_submitted';
  rating: number;
  total_ratings: number;
  is_verified: boolean;
  role?: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Trip Types
// ============================================================================

export interface Trip {
  id: string;
  user_id: string;
  user: User;
  departure_country: string;
  departure_city: string;
  departure_date: string;
  arrival_country: string;
  arrival_city: string;
  arrival_date: string;
  available_weight: number;
  price_per_kg: number;
  status: 'active' | 'completed' | 'cancelled';
  package_types: string[];
  travel_proof_url?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Shipment Types
// ============================================================================

export interface Shipment {
  id: string;
  sender_id: string;
  sender: User;
  traveler_id?: string;
  traveler?: User;
  trip_id?: string;
  trip?: Trip;
  pickup_country: string;
  pickup_city: string;
  pickup_address: string;
  delivery_country: string;
  delivery_city: string;
  delivery_address: string;
  recipient_name: string;
  recipient_phone: string;
  package_type: string;
  weight: number;
  description: string;
  value: number;
  photo_urls: string[];
  status: 'pending' | 'accepted' | 'paid' | 'in_transit' | 'delivered' | 'cancelled';
  price: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Message Types
// ============================================================================

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender: User;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  participants: User[];
  last_message?: Message;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Payment Types
// ============================================================================

export interface Payment {
  id: string;
  shipment_id: string;
  shipment: Shipment;
  payer_id: string;
  payer: User;
  payee_id?: string;
  payee?: User;
  amount: number;
  currency: string;
  status: 'pending' | 'held' | 'released' | 'refunded' | 'failed';
  stripe_payment_intent_id?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Wallet Types
// ============================================================================

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  reference_type?: string;
  reference_id?: string;
  created_at: string;
}

// ============================================================================
// Withdrawal Types
// ============================================================================

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  user: User;
  amount: number;
  currency: string;
  payment_method: string;
  payment_details: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  admin_notes?: string;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// KYC Types
// ============================================================================

export interface KYCDocument {
  id: string;
  user_id: string;
  document_type: 'passport' | 'id_card' | 'driver_license' | 'proof_of_address';
  document_url: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  submitted_at: string;
  reviewed_at?: string;
}

// ============================================================================
// Rating Types
// ============================================================================

export interface Rating {
  id: string;
  shipment_id: string;
  rater_id: string;
  rater: User;
  rated_id: string;
  rated: User;
  score: number;
  comment?: string;
  created_at: string;
}

// ============================================================================
// Notification Types
// ============================================================================

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

export interface ValidationError {
  message: string;
  errors: Record<string, string[]>;
}

// ============================================================================
// Request Types
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  country: string;
}

export interface CreateTripRequest {
  departure_country: string;
  departure_city: string;
  departure_date: string;
  arrival_country: string;
  arrival_city: string;
  arrival_date: string;
  available_weight: number;
  price_per_kg: number;
  package_types: string[];
}

export interface CreateShipmentRequest {
  pickup_country: string;
  pickup_city: string;
  pickup_address: string;
  delivery_country: string;
  delivery_city: string;
  delivery_address: string;
  recipient_name: string;
  recipient_phone: string;
  package_type: string;
  weight: number;
  description: string;
  value: number;
  photo_urls: string[];
}

export interface SendMessageRequest {
  recipient_id: string;
  content: string;
  shipment_id?: string;
}

export interface SubmitRatingRequest {
  shipment_id: string;
  rated_id: string;
  score: number;
  comment?: string;
}

export interface CreateWithdrawalRequest {
  amount: number;
  payment_method: string;
  payment_details: Record<string, any>;
}
