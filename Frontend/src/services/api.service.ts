import axios, { AxiosInstance, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG, API_ENDPOINTS } from '../config/api.config';
import {
  SignupData,
  LoginCredentials,
  AuthResponse,
  MenuItem,
  CreateMenuItemData,
  Order,
  CreateOrderData,
  OrderItem,
  CreateOrderItemData,
  Customer,
  Ingredient,
  CreateIngredientData,
  Payment,
  CreatePaymentData,
  Discount,
  CreateDiscountData,
  CreateOrderModificationData,
  OrderItemModification,
  ApiResponse,
  PaginatedResponse,
  Table,
  CreateTableData,
  TableAvailabilityRequest,
  AvailabilityResponse,
  TablesLayoutResponse,
  TableSchedule,
  Reservation,
  CreateReservationData,
  UpdateReservationData,
  ReservationLookupData,
  ReservationAvailabilityRequest,
  ReservationResponse,
  ReservationStatusUpdate
} from '../types/api.types';

// Token storage keys - consistent across the app
const TOKEN_STORAGE_KEYS = {
  ACCESS_TOKEN: 'ecofood_access_token',
  REFRESH_TOKEN: 'ecofood_refresh_token',
  CUSTOMER_DATA: 'ecofood_customer_data',
};

// Extend axios config to include _retry flag
interface RetryAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Base API service class
class ApiService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        console.log('Making API request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          headers: config.headers,
        });
        
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log('API response received:', {
          status: response.status,
          url: response.config.url,
          data: response.data,
        });
        return response;
      },
      async (error: AxiosError) => {
        console.error('API error:', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message,
          data: error.response?.data,
        });

        const originalRequest = error.config as RetryAxiosRequestConfig;

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Try to refresh token
            const refreshToken = localStorage.getItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN);
            if (refreshToken) {
              const response = await axios.post(
                `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TOKEN_REFRESH}`,
                { refresh: refreshToken }
              );

              const newAccessToken = response.data.access;
              if (newAccessToken) {
                localStorage.setItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return this.axiosInstance(originalRequest);
              }
            }
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            this.clearAuthToken();
            console.error('Token refresh failed:', refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Token management methods
  setAuthToken(token: string): void {
    localStorage.setItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN, token);
    this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearAuthToken(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(TOKEN_STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(TOKEN_STORAGE_KEYS.CUSTOMER_DATA);
    delete this.axiosInstance.defaults.headers.common['Authorization'];
  }

  // Test connection to backend
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.get('/api/restaurant/menu-items/');
      return response.status === 200;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  // Generic GET request
  async get<T>(url: string): Promise<T> {
    const response = await this.axiosInstance.get<T>(url);
    return response.data;
  }

  // Generic POST request
  async post<T, D = any>(url: string, data?: D): Promise<T> {
    const response = await this.axiosInstance.post<T>(url, data);
    return response.data;
  }

  // Generic PUT request
  async put<T, D = any>(url: string, data?: D): Promise<T> {
    const response = await this.axiosInstance.put<T>(url, data);
    return response.data;
  }

  // Generic DELETE request
  async delete<T>(url: string): Promise<T> {
    const response = await this.axiosInstance.delete<T>(url);
    return response.data;
  }

  // Authentication methods
  async signup(userData: SignupData): Promise<AuthResponse> {
    return this.post<AuthResponse, SignupData>(API_ENDPOINTS.auth.signup(), userData);
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return this.post<AuthResponse, LoginCredentials>(API_ENDPOINTS.auth.login(), credentials);
  }

  // Menu methods
  async getMenuItems(): Promise<ApiResponse<MenuItem>> {
    return this.get<ApiResponse<MenuItem>>(API_ENDPOINTS.menuItems.list());
  }

  async getMenuItem(id: number): Promise<MenuItem> {
    return this.get<MenuItem>(API_ENDPOINTS.menuItems.detail(id));
  }

  async createMenuItem(menuItemData: CreateMenuItemData): Promise<MenuItem> {
    return this.post<MenuItem, CreateMenuItemData>(API_ENDPOINTS.menuItems.create(), menuItemData);
  }

  // Order methods
  async getOrders(): Promise<ApiResponse<Order[]>> {
    return this.get<ApiResponse<Order[]>>(API_ENDPOINTS.orders.list());
  }

  async getOrder(id: number): Promise<Order> {
    return this.get<Order>(API_ENDPOINTS.orders.detail(id));
  }

  async createOrder(orderData: CreateOrderData): Promise<Order> {
    return this.post<Order, CreateOrderData>(API_ENDPOINTS.orders.create(), orderData);
  }

  // Order Item methods
  async getOrderItems(): Promise<ApiResponse<OrderItem[]>> {
    return this.get<ApiResponse<OrderItem[]>>(API_ENDPOINTS.orderItems.list());
  }

  async createOrderItem(orderItemData: CreateOrderItemData): Promise<OrderItem> {
    return this.post<OrderItem, CreateOrderItemData>(API_ENDPOINTS.orderItems.create(), orderItemData);
  }

  // Order Modification methods
  async getOrderModifications(): Promise<ApiResponse<OrderItemModification[]>> {
    return this.get<ApiResponse<OrderItemModification[]>>(API_ENDPOINTS.orderModifications.list());
  }

  async createOrderModification(modificationData: CreateOrderModificationData): Promise<OrderItemModification> {
    return this.post<OrderItemModification, CreateOrderModificationData>(
      API_ENDPOINTS.orderModifications.create(), 
      modificationData
    );
  }

  // Customer methods
  async getCustomers(): Promise<ApiResponse<Customer[]>> {
    return this.get<ApiResponse<Customer[]>>(API_ENDPOINTS.customers.list());
  }

  async getCustomer(id: number): Promise<Customer> {
    return this.get<Customer>(API_ENDPOINTS.customers.detail(id));
  }

  // Ingredient methods
  async getIngredients(): Promise<ApiResponse<Ingredient>> {
    return this.get<ApiResponse<Ingredient>>(API_ENDPOINTS.ingredients.list());
  }

  async getIngredient(id: number): Promise<Ingredient> {
    return this.get<Ingredient>(API_ENDPOINTS.ingredients.detail(id));
  }

  async createIngredient(ingredientData: CreateIngredientData): Promise<Ingredient> {
    return this.post<Ingredient, CreateIngredientData>(API_ENDPOINTS.ingredients.create(), ingredientData);
  }

  // Payment methods
  async getPayments(): Promise<ApiResponse<Payment[]>> {
    return this.get<ApiResponse<Payment[]>>(API_ENDPOINTS.payments.list());
  }

  async getPayment(id: number): Promise<Payment> {
    return this.get<Payment>(API_ENDPOINTS.payments.detail(id));
  }

  async createPayment(paymentData: CreatePaymentData): Promise<Payment> {
    return this.post<Payment, CreatePaymentData>(API_ENDPOINTS.payments.create(), paymentData);
  }

  // Discount methods
  async getDiscounts(): Promise<ApiResponse<Discount[]>> {
    return this.get<ApiResponse<Discount[]>>(API_ENDPOINTS.discounts.list());
  }

  async getDiscount(id: number): Promise<Discount> {
    return this.get<Discount>(API_ENDPOINTS.discounts.detail(id));
  }

  async createDiscount(discountData: CreateDiscountData): Promise<Discount> {
    return this.post<Discount, CreateDiscountData>(API_ENDPOINTS.discounts.create(), discountData);
  }

  async applyDiscount(discountCode: string, orderTotal: number, customerId?: number): Promise<{
    success: boolean;
    discount?: Discount;
    discount_amount?: number;
    final_total?: number;
    message: string;
  }> {
    return this.post('/api/restaurant/discounts/apply/', {
      discount_code: discountCode,
      order_total: orderTotal,
      customer_id: customerId
    });
  }

  async getActiveDiscounts(customerId?: number): Promise<{
    success: boolean;
    discounts: Discount[];
    count: number;
    message: string;
  }> {
    const params = customerId ? `?customer_id=${customerId}` : '';
    return this.get(`/api/restaurant/discounts/active/${params}`);
  }

  async recordDiscountUsage(customerId: number, discountId: number, orderId?: number): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.post('/api/restaurant/discounts/record-usage/', {
      customer_id: customerId,
      discount_id: discountId,
      order_id: orderId
    });
  }

  // Table methods
  async getTables(): Promise<ApiResponse<Table[]>> {
    return this.get<ApiResponse<Table[]>>('/api/restaurant/tables/');
  }

  async getTable(id: number): Promise<Table> {
    return this.get<Table>(`/api/restaurant/tables/${id}/`);
  }

  async createTable(tableData: CreateTableData): Promise<Table> {
    return this.post<Table, CreateTableData>('/api/restaurant/tables/', tableData);
  }

  async checkTableAvailability(availabilityData: TableAvailabilityRequest): Promise<AvailabilityResponse> {
    return this.post<AvailabilityResponse, TableAvailabilityRequest>(
      '/api/restaurant/tables/check-availability/', 
      availabilityData
    );
  }

  async getTablesLayout(): Promise<TablesLayoutResponse> {
    return this.get<TablesLayoutResponse>('/api/restaurant/tables/layout/');
  }

  async getTableSchedule(tableId: number, date?: string): Promise<TableSchedule> {
    const url = date 
      ? `/api/restaurant/tables/${tableId}/schedule/?date=${date}`
      : `/api/restaurant/tables/${tableId}/schedule/`;
    return this.get<TableSchedule>(url);
  }

  // Reservation methods
  async getReservations(filters?: {
    customer_id?: number;
    status?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<ApiResponse<Reservation>> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const url = queryParams.toString() 
      ? `/api/restaurant/reservations/?${queryParams.toString()}`
      : '/api/restaurant/reservations/';
    
    return this.get<ApiResponse<Reservation>>(url);
  }

  async getReservation(id: number): Promise<Reservation> {
    return this.get<Reservation>(`/api/restaurant/reservations/${id}/`);
  }

  async createReservation(reservationData: CreateReservationData): Promise<ReservationResponse> {
    return this.post<ReservationResponse, CreateReservationData>(
      '/api/restaurant/reservations/', 
      reservationData
    );
  }

  async updateReservation(id: number, reservationData: UpdateReservationData): Promise<ReservationResponse> {
    return this.post<ReservationResponse, UpdateReservationData>(
      `/api/restaurant/reservations/${id}/modify/`, 
      reservationData
    );
  }

  async cancelReservation(id: number, confirmCancellation: boolean = false): Promise<ReservationResponse> {
    return this.post<ReservationResponse, { confirm_cancellation: boolean }>(
      `/api/restaurant/reservations/${id}/cancel/`, 
      { confirm_cancellation: confirmCancellation }
    );
  }

  async lookupReservation(lookupData: ReservationLookupData): Promise<ReservationResponse> {
    return this.post<ReservationResponse, ReservationLookupData>(
      '/api/restaurant/reservations/lookup/', 
      lookupData
    );
  }

  async checkReservationAvailability(availabilityData: ReservationAvailabilityRequest): Promise<AvailabilityResponse> {
    return this.post<AvailabilityResponse, ReservationAvailabilityRequest>(
      '/api/restaurant/reservations/check-availability/', 
      availabilityData
    );
  }

  async getUpcomingReservations(): Promise<{ 
    success: boolean; 
    reservations_by_date: { [key: string]: Reservation[] }; 
    total_count: number; 
  }> {
    return this.get('/api/restaurant/reservations/upcoming/');
  }

  async updateReservationStatus(id: number, statusUpdate: ReservationStatusUpdate): Promise<ReservationResponse> {
    return this.post<ReservationResponse, ReservationStatusUpdate>(
      `/api/restaurant/reservations/${id}/status/`, 
      statusUpdate
    );
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService; 