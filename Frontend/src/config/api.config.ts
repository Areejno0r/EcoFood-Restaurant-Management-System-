// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8000',
  VERSION: 'v1',
  ENDPOINTS: {
    // Authentication
    SIGNUP: '/api/restaurant/signup/',
    LOGIN: '/api/restaurant/login/',
    TOKEN_REFRESH: '/api/token/refresh/',
    
    // Customers
    CUSTOMERS: '/api/restaurant/customers/',
    CUSTOMER_DETAIL: (id: number) => `/api/restaurant/customers/${id}/`,
    
    // Menu Items
    MENU_ITEMS: '/api/restaurant/menu-items/',
    MENU_ITEM_DETAIL: (id: number) => `/api/restaurant/menu-items/${id}/`,
    
    // Orders
    ORDERS: '/api/restaurant/orders/',
    ORDER_DETAIL: (id: number) => `/api/restaurant/orders/${id}/`,
    
    // Order Items
    ORDER_ITEMS: '/api/restaurant/order-items/',
    ORDER_ITEM_DETAIL: (id: number) => `/api/restaurant/order-items/${id}/`,
    
    // Order Modifications
    ORDER_MODIFICATIONS: '/api/restaurant/order-item-modifications/',
    ORDER_MODIFICATION_DETAIL: (id: number) => `/api/restaurant/order-item-modifications/${id}/`,
    
    // Ingredients
    INGREDIENTS: '/api/restaurant/ingredients/',
    INGREDIENT_DETAIL: (id: number) => `/api/restaurant/ingredients/${id}/`,
    
    // Payments
    PAYMENTS: '/api/restaurant/payments/',
    PAYMENT_DETAIL: (id: number) => `/api/restaurant/payments/${id}/`,
    
    // Discounts
    DISCOUNTS: '/api/restaurant/discounts/',
    DISCOUNT_DETAIL: (id: number) => `/api/restaurant/discounts/${id}/`,
  },
  TIMEOUT: 10000, // 10 seconds
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
} as const;

// API Response Configuration
export const API_RESPONSE_CONFIG = {
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100
  }
} as const;

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Export individual endpoint builders
export const API_ENDPOINTS = {
  auth: {
    signup: () => buildApiUrl(API_CONFIG.ENDPOINTS.SIGNUP),
    login: () => buildApiUrl(API_CONFIG.ENDPOINTS.LOGIN),
  },
  customers: {
    list: () => buildApiUrl(API_CONFIG.ENDPOINTS.CUSTOMERS),
    create: () => buildApiUrl(API_CONFIG.ENDPOINTS.CUSTOMERS),
    detail: (id: number) => buildApiUrl(API_CONFIG.ENDPOINTS.CUSTOMER_DETAIL(id)),
  },
  menuItems: {
    list: () => buildApiUrl(API_CONFIG.ENDPOINTS.MENU_ITEMS),
    create: () => buildApiUrl(API_CONFIG.ENDPOINTS.MENU_ITEMS),
    detail: (id: number) => buildApiUrl(API_CONFIG.ENDPOINTS.MENU_ITEM_DETAIL(id)),
  },
  orders: {
    list: () => buildApiUrl(API_CONFIG.ENDPOINTS.ORDERS),
    create: () => buildApiUrl(API_CONFIG.ENDPOINTS.ORDERS),
    detail: (id: number) => buildApiUrl(API_CONFIG.ENDPOINTS.ORDER_DETAIL(id)),
  },
  orderItems: {
    list: () => buildApiUrl(API_CONFIG.ENDPOINTS.ORDER_ITEMS),
    create: () => buildApiUrl(API_CONFIG.ENDPOINTS.ORDER_ITEMS),
    detail: (id: number) => buildApiUrl(API_CONFIG.ENDPOINTS.ORDER_ITEM_DETAIL(id)),
  },
  orderModifications: {
    list: () => buildApiUrl(API_CONFIG.ENDPOINTS.ORDER_MODIFICATIONS),
    create: () => buildApiUrl(API_CONFIG.ENDPOINTS.ORDER_MODIFICATIONS),
    detail: (id: number) => buildApiUrl(API_CONFIG.ENDPOINTS.ORDER_MODIFICATION_DETAIL(id)),
  },
  ingredients: {
    list: () => buildApiUrl(API_CONFIG.ENDPOINTS.INGREDIENTS),
    create: () => buildApiUrl(API_CONFIG.ENDPOINTS.INGREDIENTS),
    detail: (id: number) => buildApiUrl(API_CONFIG.ENDPOINTS.INGREDIENT_DETAIL(id)),
  },
  payments: {
    list: () => buildApiUrl(API_CONFIG.ENDPOINTS.PAYMENTS),
    create: () => buildApiUrl(API_CONFIG.ENDPOINTS.PAYMENTS),
    detail: (id: number) => buildApiUrl(API_CONFIG.ENDPOINTS.PAYMENT_DETAIL(id)),
  },
  discounts: {
    list: () => buildApiUrl(API_CONFIG.ENDPOINTS.DISCOUNTS),
    create: () => buildApiUrl(API_CONFIG.ENDPOINTS.DISCOUNTS),
    detail: (id: number) => buildApiUrl(API_CONFIG.ENDPOINTS.DISCOUNT_DETAIL(id)),
  },
}; 