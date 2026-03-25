export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  avatar: string | null;
  rating: number;
  completed_deliveries: number;
  is_recommended: boolean;
  kyc_status: 'pending' | 'approved' | 'rejected' | 'not_submitted';
  role: 'user' | 'admin' | 'super_admin';
  locale: 'fr' | 'en';
  currency_code: string;
  created_at: string;
  updated_at: string;
}
