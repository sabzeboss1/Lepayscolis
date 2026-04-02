/**
 * API Endpoints mapping for Le Pays Express Colis
 * Centralized endpoint definitions for type safety and maintainability
 */

export const API_ENDPOINTS = {
  // ============================================================================
  // Authentication Endpoints
  // ============================================================================
  auth: {
    csrf: '/sanctum/csrf-cookie',
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    me: '/api/auth/me',
    updateProfile: '/api/users/profile',
    uploadAvatar: '/api/users/avatar',
  },

  // ============================================================================
  // KYC Endpoints
  // ============================================================================
  kyc: {
    submit: '/api/kyc',
    status: '/api/kyc/status',
  },

  // ============================================================================
  // Trip Endpoints
  // ============================================================================
  trips: {
    list: '/api/trips',
    create: '/api/trips',
    show: (id: string) => `/api/trips/${id}`,
    update: (id: string) => `/api/trips/${id}`,
    delete: (id: string) => `/api/trips/${id}`,
    my: '/api/trips/my',
    search: '/api/trips/search',
  },

  // ============================================================================
  // Shipment Endpoints
  // ============================================================================
  shipments: {
    list: '/api/shipments',
    create: '/api/shipments',
    show: (id: string) => `/api/shipments/${id}`,
    update: (id: string) => `/api/shipments/${id}`,
    my: '/api/shipments/my',
    accept: (id: string) => `/api/shipments/${id}/accept`,
    cancel: (id: string) => `/api/shipments/${id}/cancel`,
    updateStatus: (id: string) => `/api/shipments/${id}/status`,
  },

  // ============================================================================
  // Message Endpoints
  // ============================================================================
  messages: {
    conversations: '/api/messages/conversations',
    list: '/api/messages',
    send: '/api/messages',
    markRead: (id: string) => `/api/messages/${id}/read`,
  },

  // ============================================================================
  // Payment Endpoints
  // ============================================================================
  payments: {
    createCheckout: '/api/payments/create-checkout',
    webhook: '/api/webhooks/stripe',
  },

  // ============================================================================
  // Wallet Endpoints
  // ============================================================================
  wallet: {
    balance: '/api/wallet',
    transactions: '/api/wallet/transactions',
  },

  // ============================================================================
  // Withdrawal Endpoints
  // ============================================================================
  withdrawals: {
    create: '/api/withdrawals',
    list: '/api/withdrawals',
    show: (id: string) => `/api/withdrawals/${id}`,
  },

  // ============================================================================
  // Rating Endpoints
  // ============================================================================
  ratings: {
    submit: '/api/ratings',
    list: (userId: string) => `/api/users/${userId}/ratings`,
  },

  // ============================================================================
  // Notification Endpoints
  // ============================================================================
  notifications: {
    list: '/api/notifications',
    markRead: (id: string) => `/api/notifications/${id}/read`,
    markAllRead: '/api/notifications/read-all',
  },

  // ============================================================================
  // Currency Endpoints (public)
  // ============================================================================
  currencies: {
    list: '/api/currencies',
  },

  // ============================================================================
  // Country & City Endpoints (public)
  // ============================================================================
  countries: {
    list: '/api/countries',
    cities: (id: number) => `/api/countries/${id}/cities`,
  },

  // ============================================================================
  // Admin Endpoints
  // ============================================================================
  admin: {
    me: '/api/admin/me',
    dashboard: {
      metrics: '/api/admin/dashboard/metrics',
      charts: '/api/admin/dashboard/charts',
      activity: '/api/admin/dashboard/activity',
    },
    
    users: {
      list: '/api/admin/users',
      create: '/api/admin/users',
      show: (id: string) => `/api/admin/users/${id}`,
      update: (id: string) => `/api/admin/users/${id}`,
      delete: (id: string) => `/api/admin/users/${id}`,
      suspend: (id: string) => `/api/admin/users/${id}/suspend`,
      activate: (id: string) => `/api/admin/users/${id}/activate`,
      bulkSuspend: '/api/admin/users/bulk-suspend',
      bulkActivate: '/api/admin/users/bulk-activate',
      banMessaging: (id: string) => `/api/admin/users/${id}/ban-messaging`,
      unbanMessaging: (id: string) => `/api/admin/users/${id}/unban-messaging`,
      assignAdmin: (id: string) => `/api/admin/users/${id}/assign-admin`,
    },
    
    kyc: {
      list: '/api/admin/kyc',
      show: (id: string) => `/api/admin/kyc/${id}`,
      approve: (id: string) => `/api/admin/kyc/${id}/approve`,
      reject: (id: string) => `/api/admin/kyc/${id}/reject`,
    },
    
    withdrawals: {
      list: '/api/admin/withdrawals',
      show: (id: string) => `/api/admin/withdrawals/${id}`,
      approve: (id: string) => `/api/admin/withdrawals/${id}/approve`,
      reject: (id: string) => `/api/admin/withdrawals/${id}/reject`,
      processing: (id: string) => `/api/admin/withdrawals/${id}/processing`,
      complete: (id: string) => `/api/admin/withdrawals/${id}/complete`,
    },
    
    trips: {
      list: '/api/admin/trips',
      show: (id: string) => `/api/admin/trips/${id}`,
      cancel: (id: string) => `/api/admin/trips/${id}/cancel`,
      verify: (id: string) => `/api/admin/trips/${id}/verify`,
      reject: (id: string) => `/api/admin/trips/${id}/reject`,
      update: (id: string) => `/api/admin/trips/${id}`,
    },
    
    shipments: {
      list: '/api/admin/shipments',
      show: (id: string) => `/api/admin/shipments/${id}`,
      cancel: (id: string) => `/api/admin/shipments/${id}/cancel`,
    },
    
    shipmentRequests: {
      list: '/api/admin/shipment-requests',
      show: (id: string) => `/api/admin/shipment-requests/${id}`,
      pending: '/api/admin/shipment-requests/pending',
      approve: (id: string) => `/api/admin/shipment-requests/${id}/approve`,
      reject: (id: string) => `/api/admin/shipment-requests/${id}/reject`,
      delete: (id: string) => `/api/admin/shipment-requests/${id}`,
      analytics: '/api/admin/shipment-requests/analytics',
    },
    
    payments: {
      list: '/api/admin/payments',
      show: (id: string) => `/api/admin/payments/${id}`,
      refund: (id: string) => `/api/admin/payments/${id}/refund`,
      analytics: '/api/admin/payments/analytics',
    },
    
    messages: {
      list: '/api/admin/messages/conversations',
      show: (id: string) => `/api/admin/messages/conversations/${id}`,
      delete: (id: string) => `/api/admin/messages/${id}`,
    },

    ratings: {
      list: '/api/admin/ratings',
      show: (id: string) => `/api/admin/ratings/${id}`,
      delete: (id: string) => `/api/admin/ratings/${id}`,
      statistics: '/api/admin/ratings/statistics',
    },
    
    analytics: {
      index: '/api/admin/analytics',
      export: '/api/admin/analytics/export',
    },
    
    settings: {
      get: '/api/admin/settings',
      update: '/api/admin/settings',
    },
    
    notifications: {
      history: '/api/admin/notifications/history',
      send: '/api/admin/notifications/send',
    },

    admins: {
      list: '/api/admin/admins',
      create: '/api/admin/admins',
      updateRole: (id: number) => `/api/admin/admins/${id}/role`,
      remove: (id: number) => `/api/admin/admins/${id}`,
      activity: (id: number) => `/api/admin/admins/${id}/activity`,
    },

    auditLogs: {
      list: '/api/admin/audit-logs',
      show: (id: string) => `/api/admin/audit-logs/${id}`,
      export: '/api/admin/audit-logs/export',
    },

    currencies: {
      list: '/api/admin/currencies',
      store: '/api/admin/currencies',
      update: (code: string) => `/api/admin/currencies/${code}`,
      updateRate: (code: string) => `/api/admin/currencies/${code}/rate`,
      toggle: (code: string) => `/api/admin/currencies/${code}/toggle`,
      delete: (code: string) => `/api/admin/currencies/${code}`,
    },

    countries: {
      list: '/api/admin/countries',
      store: '/api/admin/countries',
      update: (id: number) => `/api/admin/countries/${id}`,
      toggle: (id: number) => `/api/admin/countries/${id}/toggle`,
      delete: (id: number) => `/api/admin/countries/${id}`,
    },

    cities: {
      list: '/api/admin/cities',
      store: '/api/admin/cities',
      update: (id: number) => `/api/admin/cities/${id}`,
      toggle: (id: number) => `/api/admin/cities/${id}/toggle`,
      delete: (id: number) => `/api/admin/cities/${id}`,
    },

    wallets: {
      list: '/api/admin/wallets',
      show: (userId: string) => `/api/admin/wallets/${userId}`,
      adjust: (userId: string) => `/api/admin/wallets/${userId}/adjust`,
    },
  },
} as const;

/**
 * Helper type to extract endpoint paths
 */
export type EndpointPath = string | ((id: string) => string);

/**
 * Helper function to build endpoint with parameters
 */
export function buildEndpoint(endpoint: EndpointPath, id?: string): string {
  if (typeof endpoint === 'function') {
    if (!id) {
      throw new Error('ID parameter is required for this endpoint');
    }
    return endpoint(id);
  }
  return endpoint;
}
