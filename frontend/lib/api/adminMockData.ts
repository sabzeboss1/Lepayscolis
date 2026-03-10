import { faker } from '@faker-js/faker';

// Seed for consistent data
faker.seed(456);

// Admin Mock Data Types
export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalTrips: number;
  activeTrips: number;
  totalShipments: number;
  pendingShipments: number;
  totalRevenue: number;
  pendingWithdrawals: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin' | 'super_admin';
  kycStatus: 'pending' | 'approved' | 'rejected' | 'not_submitted';
  status: 'active' | 'suspended' | 'banned';
  rating: number;
  completedDeliveries: number;
  walletBalance: number;
  createdAt: Date;
  lastLogin: Date;
}

export interface AdminKYCSubmission {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  documentType: 'passport' | 'idCard' | 'driversLicense';
  documentNumber: string;
  documentFront: string;
  documentBack?: string;
  selfie: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface AdminTrip {
  id: string;
  travelerId: string;
  travelerName: string;
  travelerEmail: string;
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
  availableCapacity: number;
  pricePerKg: number;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
}

export interface AdminShipment {
  id: string;
  senderId: string;
  senderName: string;
  travelerId: string;
  travelerName: string;
  tripId: string;
  description: string;
  weight: number;
  amount: number;
  status: 'pending' | 'accepted' | 'in_transit' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'escrowed' | 'released' | 'refunded';
  createdAt: Date;
}

export interface AdminWallet {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
  pendingWithdrawals: number;
  lastTransaction?: Date;
}

export interface AdminWithdrawal {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  method: 'bank_transfer' | 'mobile_money' | 'paypal';
  accountDetails: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestedAt: Date;
  processedAt?: Date;
  processedBy?: string;
  rejectionReason?: string;
}

export interface AdminPayment {
  id: string;
  shipmentId: string;
  senderId: string;
  senderName: string;
  travelerId: string;
  travelerName: string;
  amount: number;
  platformFee: number;
  status: 'pending' | 'escrowed' | 'released' | 'refunded';
  paymentMethod: 'card' | 'bank_transfer' | 'mobile_money';
  createdAt: Date;
  releasedAt?: Date;
}

export interface AdminMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  content: string;
  read: boolean;
  flagged: boolean;
  createdAt: Date;
}

export interface AdminRating {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  shipmentId: string;
  rating: number;
  comment: string;
  flagged: boolean;
  createdAt: Date;
}

export interface AdminNotification {
  id: string;
  type: 'system' | 'announcement' | 'alert';
  title: string;
  message: string;
  targetAudience: 'all' | 'travelers' | 'senders' | 'specific';
  targetUserIds?: string[];
  priority: 'low' | 'medium' | 'high';
  status: 'draft' | 'scheduled' | 'sent';
  scheduledFor?: Date;
  sentAt?: Date;
  createdBy: string;
  createdAt: Date;
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  resource: string;
  resourceId: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

export interface AdminAnalytics {
  period: 'day' | 'week' | 'month' | 'year';
  userGrowth: Array<{ date: string; count: number }>;
  tripActivity: Array<{ date: string; count: number }>;
  shipmentActivity: Array<{ date: string; count: number }>;
  revenueData: Array<{ date: string; amount: number }>;
  topRoutes: Array<{ route: string; count: number }>;
  topTravelers: Array<{ name: string; trips: number; revenue: number }>;
  usersByCountry: Array<{ country: string; count: number }>;
}

export interface PlatformSettings {
  id: string;
  platformFeePercentage: number;
  minimumWithdrawal: number;
  maxShipmentWeight: number;
  kycRequired: boolean;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  supportEmail: string;
  supportPhone: string;
  updatedAt: Date;
  updatedBy: string;
}

// Generate Mock Data
function generateAdminUser(): AdminUser {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    role: faker.helpers.arrayElement(['user', 'user', 'user', 'admin']),
    kycStatus: faker.helpers.arrayElement(['pending', 'approved', 'rejected', 'not_submitted']),
    status: faker.helpers.arrayElement(['active', 'active', 'active', 'suspended']),
    rating: faker.number.float({ min: 0, max: 5, fractionDigits: 1 }),
    completedDeliveries: faker.number.int({ min: 0, max: 50 }),
    walletBalance: faker.number.float({ min: 0, max: 5000, fractionDigits: 2 }),
    createdAt: faker.date.past({ years: 2 }),
    lastLogin: faker.date.recent({ days: 30 }),
  };
}

function generateKYCSubmission(): AdminKYCSubmission {
  const status = faker.helpers.arrayElement(['pending', 'approved', 'rejected']);
  const documentType = faker.helpers.arrayElement(['passport', 'idCard', 'driversLicense']);
  return {
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    userName: faker.person.fullName(),
    userEmail: faker.internet.email(),
    userPhone: faker.phone.number(),
    documentType,
    documentNumber: faker.string.alphanumeric(10).toUpperCase(),
    documentFront: faker.image.url(),
    documentBack: documentType === 'idCard' ? faker.image.url() : undefined,
    selfie: faker.image.avatar(),
    status,
    submittedAt: faker.date.past({ days: 30 }),
    reviewedAt: status !== 'pending' ? faker.date.recent({ days: 10 }) : undefined,
    reviewedBy: status !== 'pending' ? faker.person.fullName() : undefined,
    rejectionReason: status === 'rejected' ? faker.helpers.arrayElement([
      'Document non clair ou illisible',
      'Document expiré',
      'Le selfie ne correspond pas au document',
      'Type de document invalide',
      'Informations manquantes ou incomplètes',
    ]) : undefined,
  };
}

function generateAdminTrip(): AdminTrip {
  const departureDate = faker.date.future();
  return {
    id: faker.string.uuid(),
    travelerId: faker.string.uuid(),
    travelerName: faker.person.fullName(),
    travelerEmail: faker.internet.email(),
    departure: {
      city: faker.helpers.arrayElement(['Moscow', 'Saint Petersburg', 'Kazan', 'Novosibirsk']),
      country: 'Russia',
      date: departureDate,
    },
    arrival: {
      city: faker.helpers.arrayElement(['Dakar', 'Abidjan', 'Douala', 'Lagos', 'Nairobi']),
      country: faker.helpers.arrayElement(['Senegal', 'Ivory Coast', 'Cameroon', 'Nigeria', 'Kenya']),
      date: faker.date.soon({ refDate: departureDate, days: 7 }),
    },
    availableCapacity: faker.number.int({ min: 5, max: 50 }),
    pricePerKg: faker.number.float({ min: 10, max: 50, fractionDigits: 2 }),
    status: faker.helpers.arrayElement(['active', 'completed', 'cancelled']),
    createdAt: faker.date.past({ days: 60 }),
  };
}

function generateAdminShipment(): AdminShipment {
  const weight = faker.number.float({ min: 1, max: 20, fractionDigits: 1 });
  const pricePerKg = faker.number.float({ min: 10, max: 50, fractionDigits: 2 });
  return {
    id: faker.string.uuid(),
    senderId: faker.string.uuid(),
    senderName: faker.person.fullName(),
    travelerId: faker.string.uuid(),
    travelerName: faker.person.fullName(),
    tripId: faker.string.uuid(),
    description: faker.helpers.arrayElement([
      'Electronics',
      'Documents',
      'Clothing',
      'Books',
      'Gifts',
      'Medicine',
    ]),
    weight,
    amount: weight * pricePerKg,
    status: faker.helpers.arrayElement(['pending', 'accepted', 'in_transit', 'delivered', 'cancelled']),
    paymentStatus: faker.helpers.arrayElement(['pending', 'escrowed', 'released', 'refunded']),
    createdAt: faker.date.past({ days: 90 }),
  };
}

function generateAdminWallet(): AdminWallet {
  const totalEarned = faker.number.float({ min: 0, max: 10000, fractionDigits: 2 });
  const totalWithdrawn = faker.number.float({ min: 0, max: totalEarned * 0.8, fractionDigits: 2 });
  const pendingWithdrawals = faker.number.float({ min: 0, max: 500, fractionDigits: 2 });
  return {
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    userName: faker.person.fullName(),
    userEmail: faker.internet.email(),
    balance: totalEarned - totalWithdrawn - pendingWithdrawals,
    totalEarned,
    totalWithdrawn,
    pendingWithdrawals,
    lastTransaction: faker.date.recent({ days: 30 }),
  };
}

function generateAdminWithdrawal(): AdminWithdrawal {
  const status = faker.helpers.arrayElement(['pending', 'approved', 'rejected', 'completed']);
  return {
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    userName: faker.person.fullName(),
    userEmail: faker.internet.email(),
    amount: faker.number.float({ min: 50, max: 2000, fractionDigits: 2 }),
    method: faker.helpers.arrayElement(['bank_transfer', 'mobile_money', 'paypal']),
    accountDetails: faker.finance.iban(),
    status,
    requestedAt: faker.date.past({ days: 30 }),
    processedAt: status !== 'pending' ? faker.date.recent({ days: 10 }) : undefined,
    processedBy: status !== 'pending' ? faker.person.fullName() : undefined,
    rejectionReason: status === 'rejected' ? faker.helpers.arrayElement([
      'Insufficient balance',
      'Invalid account details',
      'Suspicious activity',
      'Account verification required',
    ]) : undefined,
  };
}

function generateAdminPayment(): AdminPayment {
  const amount = faker.number.float({ min: 50, max: 1000, fractionDigits: 2 });
  const platformFee = amount * 0.05;
  return {
    id: faker.string.uuid(),
    shipmentId: faker.string.uuid(),
    senderId: faker.string.uuid(),
    senderName: faker.person.fullName(),
    travelerId: faker.string.uuid(),
    travelerName: faker.person.fullName(),
    amount,
    platformFee,
    status: faker.helpers.arrayElement(['pending', 'escrowed', 'released', 'refunded']),
    paymentMethod: faker.helpers.arrayElement(['card', 'bank_transfer', 'mobile_money']),
    createdAt: faker.date.past({ days: 90 }),
    releasedAt: faker.datatype.boolean() ? faker.date.recent({ days: 30 }) : undefined,
  };
}

function generateAdminMessage(): AdminMessage {
  return {
    id: faker.string.uuid(),
    conversationId: faker.string.uuid(),
    senderId: faker.string.uuid(),
    senderName: faker.person.fullName(),
    recipientId: faker.string.uuid(),
    recipientName: faker.person.fullName(),
    content: faker.lorem.sentence(),
    read: faker.datatype.boolean(),
    flagged: faker.datatype.boolean({ probability: 0.1 }),
    createdAt: faker.date.recent({ days: 30 }),
  };
}

function generateAdminRating(): AdminRating {
  return {
    id: faker.string.uuid(),
    fromUserId: faker.string.uuid(),
    fromUserName: faker.person.fullName(),
    toUserId: faker.string.uuid(),
    toUserName: faker.person.fullName(),
    shipmentId: faker.string.uuid(),
    rating: faker.number.int({ min: 1, max: 5 }),
    comment: faker.lorem.paragraph(),
    flagged: faker.datatype.boolean({ probability: 0.05 }),
    createdAt: faker.date.past({ days: 60 }),
  };
}

function generateAuditLog(): AdminAuditLog {
  const actions = [
    'User Created', 'User Updated', 'User Suspended', 'User Banned',
    'KYC Approved', 'KYC Rejected',
    'Withdrawal Approved', 'Withdrawal Rejected',
    'Trip Cancelled', 'Shipment Cancelled',
    'Settings Updated', 'Notification Sent',
  ];
  return {
    id: faker.string.uuid(),
    adminId: faker.string.uuid(),
    adminName: faker.person.fullName(),
    action: faker.helpers.arrayElement(actions),
    resource: faker.helpers.arrayElement(['user', 'kyc', 'trip', 'shipment', 'withdrawal', 'settings']),
    resourceId: faker.string.uuid(),
    details: faker.lorem.sentence(),
    ipAddress: faker.internet.ipv4(),
    userAgent: faker.internet.userAgent(),
    createdAt: faker.date.recent({ days: 30 }),
  };
}

// Export mock data arrays
export const mockAdminUsers: AdminUser[] = Array.from({ length: 100 }, generateAdminUser);
export const mockKYCSubmissions: AdminKYCSubmission[] = Array.from({ length: 50 }, generateKYCSubmission);
export const mockAdminTrips: AdminTrip[] = Array.from({ length: 80 }, generateAdminTrip);
export const mockAdminShipments: AdminShipment[] = Array.from({ length: 120 }, generateAdminShipment);
export const mockAdminWallets: AdminWallet[] = Array.from({ length: 100 }, generateAdminWallet);
export const mockAdminWithdrawals: AdminWithdrawal[] = Array.from({ length: 60 }, generateAdminWithdrawal);
export const mockAdminPayments: AdminPayment[] = Array.from({ length: 150 }, generateAdminPayment);
export const mockAdminMessages: AdminMessage[] = Array.from({ length: 200 }, generateAdminMessage);
export const mockAdminRatings: AdminRating[] = Array.from({ length: 100 }, generateAdminRating);
export const mockAuditLogs: AdminAuditLog[] = Array.from({ length: 500 }, generateAuditLog);

// Dashboard Stats
export const mockAdminStats: AdminStats = {
  totalUsers: mockAdminUsers.length,
  activeUsers: mockAdminUsers.filter(u => u.status === 'active').length,
  totalTrips: mockAdminTrips.length,
  activeTrips: mockAdminTrips.filter(t => t.status === 'active').length,
  totalShipments: mockAdminShipments.length,
  pendingShipments: mockAdminShipments.filter(s => s.status === 'pending').length,
  totalRevenue: mockAdminPayments.reduce((sum, p) => sum + p.platformFee, 0),
  pendingWithdrawals: mockAdminWithdrawals.filter(w => w.status === 'pending').length,
};

// Analytics Data
export const mockAnalytics: AdminAnalytics = {
  period: 'month',
  userGrowth: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(2025, 1, i + 1).toISOString().split('T')[0],
    count: faker.number.int({ min: 5, max: 25 }),
  })),
  tripActivity: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(2025, 1, i + 1).toISOString().split('T')[0],
    count: faker.number.int({ min: 2, max: 15 }),
  })),
  shipmentActivity: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(2025, 1, i + 1).toISOString().split('T')[0],
    count: faker.number.int({ min: 3, max: 20 }),
  })),
  revenueData: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(2025, 1, i + 1).toISOString().split('T')[0],
    amount: faker.number.float({ min: 100, max: 1000, fractionDigits: 2 }),
  })),
  topRoutes: [
    { route: 'Moscow → Dakar', count: 45 },
    { route: 'Saint Petersburg → Abidjan', count: 38 },
    { route: 'Kazan → Douala', count: 32 },
    { route: 'Moscow → Lagos', count: 28 },
    { route: 'Novosibirsk → Nairobi', count: 22 },
  ],
  topTravelers: Array.from({ length: 10 }, () => ({
    name: faker.person.fullName(),
    trips: faker.number.int({ min: 5, max: 30 }),
    revenue: faker.number.float({ min: 500, max: 5000, fractionDigits: 2 }),
  })),
  usersByCountry: [
    { country: 'Russia', count: 450 },
    { country: 'Senegal', count: 280 },
    { country: 'Ivory Coast', count: 220 },
    { country: 'Cameroon', count: 180 },
    { country: 'Nigeria', count: 150 },
    { country: 'Kenya', count: 120 },
  ],
};

// Platform Settings
export const mockPlatformSettings: PlatformSettings = {
  id: 'settings-1',
  platformFeePercentage: 5,
  minimumWithdrawal: 50,
  maxShipmentWeight: 50,
  kycRequired: true,
  maintenanceMode: false,
  allowRegistration: true,
  emailNotifications: true,
  smsNotifications: false,
  supportEmail: 'support@lepaysexpresscolis.com',
  supportPhone: '+33123456789',
  updatedAt: new Date(),
  updatedBy: 'Admin User',
};

// Activity Feed for Dashboard
export const mockActivityFeed = Array.from({ length: 20 }, () => {
  const activityTypes = [
    { type: 'user_registered', icon: 'UserPlus', color: 'blue' },
    { type: 'trip_created', icon: 'Plane', color: 'green' },
    { type: 'shipment_created', icon: 'Package', color: 'purple' },
    { type: 'payment_received', icon: 'DollarSign', color: 'green' },
    { type: 'withdrawal_requested', icon: 'ArrowDownCircle', color: 'orange' },
    { type: 'kyc_submitted', icon: 'FileText', color: 'blue' },
  ];
  const activity = faker.helpers.arrayElement(activityTypes);
  return {
    id: faker.string.uuid(),
    type: activity.type,
    icon: activity.icon,
    color: activity.color,
    message: faker.lorem.sentence(),
    user: faker.person.fullName(),
    timestamp: faker.date.recent({ days: 7 }),
  };
}).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
