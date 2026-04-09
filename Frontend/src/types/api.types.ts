// Authentication Types
export interface SignupData {
  full_name: string;
  phone: string;
  address: string;
  password: string;
}

export interface LoginCredentials {
  phone: string;
  password: string;
}

export interface AuthResponse {
  customer_id: number;
  full_name: string;
  phone: string;
  access_token?: string;
  refresh_token?: string;
}

// Customer Types
export interface Customer {
  customer_id: number;
  full_name: string;
  phone: string;
  address: string;
  date_joined: string;
}

// Menu Item Types
export interface MenuItem {
  menu_item_id: number;
  name: string;
  description?: string;
  price: string;
  calories?: number;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  is_available: boolean;
  image?: string;
}

export interface CreateMenuItemData {
  name: string;
  description?: string;
  price: string;
  calories?: number;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  is_available?: boolean;
}

// Ingredient Types
export interface Ingredient {
  ingredient_id: number;
  name: string;
  unit: string;
  is_allergen: boolean;
  stock_quantity: number;
  price_per_unit: string;
  is_available: boolean;
}

export interface CreateIngredientData {
  name: string;
  unit: string;
  is_allergen?: boolean;
  stock_quantity: number;
  price_per_unit: string;
}

// Order Types
export interface OrderItem {
  order_item_id: number;
  menu_item: MenuItem;
  quantity: number;
  price: string;
  ingredients?: Ingredient[];
}

export interface Order {
  order_id: number;
  customer: Customer;
  order_date: string;
  state: 'pending' | 'preparing' | 'delivered' | 'canceled';
  discount?: Discount;
  total_amount: string;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
  payment?: Payment;
}

export interface CreateOrderData {
  customer_id: number;
  total_amount: string;
  payment_method?: string;
  discount_id?: number;
  items?: CreateOrderItemData[];
}

export interface CreateOrderItemData {
  menu_item_id: number;
  quantity: number;
  price: string;
  ingredients_ids?: number[];
}

// Order Modification Types
export interface OrderItemModification {
  modification_id: number;
  order_item: OrderItem;
  ingredient: Ingredient;
  modification_type: 'add' | 'remove' | 'extra';
  quantity: number;
  price_adjustment: string;
}

export interface CreateOrderModificationData {
  order_item_id: number;
  ingredient_id: number;
  modification_type: 'add' | 'remove' | 'extra';
  quantity: number;
  price_adjustment: string;
}

// Payment Types
export interface Payment {
  payment_id: number;
  order: Order;
  amount: string;
  payment_method: PaymentMethod;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  transaction_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  payment_method_id: number;
  method: string;
  is_active: boolean;
}

export interface CreatePaymentData {
  order_id: number;
  amount: string;
  payment_method: string;
  payment_details?: {
    card_number?: string;
    card_holder_name?: string;
    expiry_date?: string;
    cvv?: string;
    [key: string]: any;
  };
}

// Discount Types
export interface Discount {
  discount_id: number;
  description: string;
  percentage: string;
  valid_from: string;
  valid_to: string;
  code?: string;
  is_active: boolean;
}

export interface CreateDiscountData {
  description: string;
  percentage: string;
  valid_from: string;
  valid_to: string;
  code?: string;
  is_active?: boolean;
}

export interface ApplyDiscountData {
  discount_code: string;
  order_total: number;
}

// API Response Types
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiError {
  detail?: string;
  message?: string;
  errors?: { [key: string]: string[] };
  status?: number;
}

// Generic API Response
export type ApiResponse<T> = PaginatedResponse<T>;

export interface OrderStatus {
  pending: 'Pending';
  preparing: 'Preparing';
  delivered: 'Delivered';
  canceled: 'Canceled';
}

export interface OrderWithDetails extends Order {
  order_items: OrderItem[];
  payment?: Payment;
  discount?: Discount;
  customer: Customer;
}

export interface OrderStatusUpdate {
  order_id: number;
  new_status: 'pending' | 'preparing' | 'delivered' | 'canceled';
}

// Payment tracking types
export interface PaymentWithDetails extends Payment {
  payment_method: PaymentMethod;
  order: Order;
}

// Type Guards for Runtime Validation
export const isOrder = (obj: any): obj is Order => {
  return obj && 
    typeof obj.order_id === 'number' &&
    typeof obj.state === 'string' &&
    ['pending', 'preparing', 'delivered', 'canceled'].includes(obj.state) &&
    obj.customer &&
    typeof obj.customer.customer_id === 'number' &&
    typeof obj.total_amount === 'string';
};

export const isMenuItem = (obj: any): obj is MenuItem => {
  return obj &&
    typeof obj.menu_item_id === 'number' &&
    typeof obj.name === 'string' &&
    typeof obj.price === 'string' &&
    typeof obj.is_available === 'boolean' &&
    ['breakfast', 'lunch', 'dinner', 'snack'].includes(obj.category);
};

export const isCustomer = (obj: any): obj is Customer => {
  return obj &&
    typeof obj.customer_id === 'number' &&
    typeof obj.full_name === 'string' &&
    typeof obj.phone === 'string';
};

export const isIngredient = (obj: any): obj is Ingredient => {
  return obj &&
    typeof obj.ingredient_id === 'number' &&
    typeof obj.name === 'string' &&
    typeof obj.unit === 'string' &&
    typeof obj.stock_quantity === 'number';
};

export const isOrderItem = (obj: any): obj is OrderItem => {
  return obj &&
    typeof obj.order_item_id === 'number' &&
    obj.menu_item &&
    isMenuItem(obj.menu_item) &&
    typeof obj.quantity === 'number' &&
    typeof obj.price === 'string';
};

export const isPaginatedResponse = <T>(obj: any): obj is PaginatedResponse<T> => {
  return obj &&
    typeof obj.count === 'number' &&
    Array.isArray(obj.results) &&
    (obj.next === null || typeof obj.next === 'string') &&
    (obj.previous === null || typeof obj.previous === 'string');
};

export const isPayment = (obj: any): obj is Payment => {
  return obj &&
    typeof obj.payment_id === 'number' &&
    obj.payment_method &&
    typeof obj.payment_method.method === 'string' &&
    typeof obj.amount === 'string' &&
    ['pending', 'success', 'failed', 'refunded'].includes(obj.status);
};

// Validation helpers
export const validateOrderArray = (data: any[]): Order[] => {
  return data.filter(isOrder);
};

export const validateMenuItemArray = (data: any[]): MenuItem[] => {
  return data.filter(isMenuItem);
};

export const validateIngredientArray = (data: any[]): Ingredient[] => {
  return data.filter(isIngredient);
};

// Table and Reservation Types
export interface Table {
  table_id: number;
  table_number: number;
  capacity: number;
  location: 'indoor' | 'outdoor' | 'window' | 'private';
  location_display: string;
  is_available: boolean;
  description?: string;
  current_availability: 'available' | 'occupied';
  created_at: string;
  updated_at: string;
}

export interface CreateTableData {
  table_number: number;
  capacity: number;
  location: 'indoor' | 'outdoor' | 'window' | 'private';
  is_available?: boolean;
  description?: string;
}

export interface Reservation {
  reservation_id: number;
  customer: Customer;
  table: Table;
  reservation_date: string;
  start_time: string;
  end_time: string;
  guest_count: number;
  status: 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'no_show';
  status_display: string;
  special_requests?: string;
  notes?: string;
  contact_name: string;
  contact_phone: string;
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  checked_in_at?: string;
  duration_hours: number;
  is_upcoming: boolean;
  is_today: boolean;
  time_until_reservation?: string;
}

export interface CreateReservationData {
  customer_id: number;
  table_id: number;
  reservation_date: string;
  start_time: string;
  end_time: string;
  guest_count: number;
  special_requests?: string;
  contact_name: string;
  contact_phone: string;
}

export interface UpdateReservationData {
  reservation_date?: string;
  start_time?: string;
  end_time?: string;
  guest_count?: number;
  special_requests?: string;
  contact_name?: string;
  contact_phone?: string;
  notes?: string;
}

export interface ReservationLookupData {
  reservation_id?: number;
  phone_number?: string;
}

export interface ReservationStatusUpdate {
  action: 'confirm' | 'check_in' | 'complete' | 'cancel' | 'no_show';
  notes?: string;
}

export interface TableAvailabilityRequest {
  date: string;
  start_time: string;
  end_time: string;
  guest_count: number;
}

export interface ReservationAvailabilityRequest {
  date: string;
  start_time: string;
  end_time: string;
  guest_count: number;
  location_preference?: 'any' | 'indoor' | 'outdoor' | 'window' | 'private';
}

export interface AvailabilityResponse {
  success: boolean;
  available_tables: Table[];
  alternative_times?: AlternativeTimeSlot[];
  search_criteria: {
    date: string;
    start_time: string;
    end_time: string;
    guest_count: number;
    location_preference?: string;
  };
  message: string;
}

export interface AlternativeTimeSlot {
  start_time: string;
  end_time: string;
  available_tables_count: number;
}

export interface TablesLayoutResponse {
  success: boolean;
  tables: Table[];
  tables_by_location: { [key: string]: Table[] };
  locations: LocationOption[];
}

export interface LocationOption {
  value: string;
  label: string;
}

export interface TableSchedule {
  success: boolean;
  table: Table;
  date: string;
  schedule: ScheduleSlot[];
}

export interface ScheduleSlot {
  start_time: string;
  end_time: string;
  status: string;
  guest_count: number;
  contact_name: string;
  reservation_id: number;
}

export interface ReservationResponse {
  success: boolean;
  reservation?: Reservation;
  reservations?: Reservation[];
  sms_sent?: boolean;
  message: string;
  errors?: { [key: string]: string[] };
  error_messages?: string[];
  requires_confirmation?: boolean;
}

// Type Guards for Reservation Types
export const isTable = (obj: any): obj is Table => {
  return obj &&
    typeof obj.table_id === 'number' &&
    typeof obj.table_number === 'number' &&
    typeof obj.capacity === 'number' &&
    ['indoor', 'outdoor', 'window', 'private'].includes(obj.location) &&
    typeof obj.is_available === 'boolean';
};

export const isReservation = (obj: any): obj is Reservation => {
  return obj &&
    typeof obj.reservation_id === 'number' &&
    obj.customer &&
    isCustomer(obj.customer) &&
    obj.table &&
    isTable(obj.table) &&
    typeof obj.reservation_date === 'string' &&
    typeof obj.start_time === 'string' &&
    typeof obj.end_time === 'string' &&
    typeof obj.guest_count === 'number' &&
    ['pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show'].includes(obj.status) &&
    typeof obj.contact_name === 'string' &&
    typeof obj.contact_phone === 'string';
};

export const validateTableArray = (data: any[]): Table[] => {
  return data.filter(isTable);
};

export const validateReservationArray = (data: any[]): Reservation[] => {
  return data.filter(isReservation);
};