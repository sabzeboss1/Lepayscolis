export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  phone: string;
  rating: number;
  completedDeliveries: number;
  isRecommended: boolean;
  kycStatus: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  locale: 'fr' | 'en';
}
