import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { apiService } from './services/api.service';
import type { Order, OrderWithDetails } from './types/api.types';
import { isOrder, isPaginatedResponse, validateOrderArray } from './types/api.types';
import { 
  Clock, 
  ChefHat, 
  CheckCircle, 
  XCircle, 
  Package,
  Eye,
  ArrowLeft,
  Calendar,
  DollarSign,
  CreditCard,
  Banknote
} from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import './OrderHistory.css';

const ORDER_STATUS_CONFIG = {
  pending: {
    label: 'Order Placed',
    icon: Clock,
    color: '#ffc107',
    description: 'Your order has been received and is being processed'
  },
  preparing: {
    label: 'Preparing',
    icon: ChefHat,
    color: '#17a2b8',
    description: 'Our chefs are preparing your delicious meal'
  },
  delivered: {
    label: 'Delivered',
    icon: CheckCircle,
    color: '#28a745',
    description: 'Your order has been delivered successfully'
  },
  canceled: {
    label: 'Canceled',
    icon: XCircle,
    color: '#dc3545',
    description: 'This order has been canceled'
  }
} as const;

export default function OrderHistory() {
  const navigate = useNavigate();
  const { customer, isAuthenticated, isLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth loading to complete before checking authentication
    if (isLoading) return;
    
    if (!isAuthenticated) {
      navigate('/sign-up');
      return;
    }
    fetchOrders();
  }, [isAuthenticated, isLoading, navigate]);

  const fetchOrders = async () => {
    try {
      setIsLoadingOrders(true);
      setError(null);
      const response = await apiService.getOrders();
      
      // Validate response structure
      if (!isPaginatedResponse(response)) {
        throw new Error('Invalid response format from server');
      }
      
      // Validate and filter orders
      const validOrders = validateOrderArray(response.results);
      
      // Filter orders for current customer
      const customerOrders = validOrders.filter(
        (order) => order.customer && order.customer.customer_id === customer?.customer_id
      );
      
      setOrders(customerOrders.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (err: any) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to load order history. Please try again.');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const fetchOrderDetails = async (orderId: number) => {
    try {
      setIsLoadingDetails(true);
      const orderDetails = await apiService.getOrder(orderId);
      
      // Validate order details
      if (!isOrder(orderDetails)) {
        throw new Error('Invalid order data received from server');
      }
      
      setSelectedOrder(orderDetails as OrderWithDetails);
    } catch (err: any) {
      console.error('Failed to fetch order details:', err);
      setError('Failed to load order details. Please try again.');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleViewOrder = (orderId: number) => {
    fetchOrderDetails(orderId);
  };

  const handleBackToOrders = () => {
    setSelectedOrder(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusProgress = (status: 'pending' | 'preparing' | 'delivered' | 'canceled') => {
    const statuses = ['pending', 'preparing', 'delivered'] as const;
    if (status === 'canceled') return -1;
    const currentIndex = statuses.indexOf(status as 'pending' | 'preparing' | 'delivered');
    return currentIndex;
  };

  if (!isAuthenticated) {
    return null;
  }

  // Order Details View
  if (selectedOrder) {
    const statusConfig = ORDER_STATUS_CONFIG[selectedOrder.state];
    const StatusIcon = statusConfig.icon;

    return (
      <div className="order-history-page">
        <Navbar />
        
        <div className="order-history-container">
          <div className="order-header">
            <button onClick={handleBackToOrders} className="back-btn">
              <ArrowLeft size={16} />
              Back to Orders
            </button>
            <h1>Order Details</h1>
          </div>

          {error && (
            <div className="error-message">
              <XCircle size={16} />
              {error}
            </div>
          )}

          {isLoadingDetails ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading order details...</p>
            </div>
          ) : (
            <div className="order-details">
              <div className="order-details-header">
                <div className="order-info">
                  <h2>Order #{selectedOrder.order_id}</h2>
                  <p className="order-date">
                    <Calendar size={16} />
                    {formatDate(selectedOrder.created_at)}
                  </p>
                </div>
                
                <div className="order-status-badge" style={{ backgroundColor: statusConfig.color }}>
                  <StatusIcon size={20} />
                  {statusConfig.label}
                </div>
              </div>

              {/* Order Progress */}
              {selectedOrder.state !== 'canceled' && (
                <div className="order-progress">
                  <div className="progress-steps">
                    {(['pending', 'preparing', 'delivered'] as const).map((status, index) => {
                      const config = ORDER_STATUS_CONFIG[status];
                      const Icon = config.icon;
                      const isCompleted = getStatusProgress(selectedOrder.state) >= index;
                      const isCurrent = selectedOrder.state === status;
                      
                      return (
                        <div 
                          key={status}
                          className={`progress-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                        >
                          <div className="step-icon">
                            <Icon size={20} />
                          </div>
                          <div className="step-info">
                            <h4>{config.label}</h4>
                            <p>{config.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div className="order-section">
                <h3>Order Items</h3>
                <div className="order-items-list">
                  {selectedOrder.order_items?.map((item) => (
                    <div key={item.order_item_id} className="order-item-detail">
                      <div className="item-image">
                        <img
                          src={item.menu_item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100'}
                          alt={item.menu_item.name}
                        />
                      </div>
                      <div className="item-info">
                        <h4>{item.menu_item.name}</h4>
                        <p>Quantity: {item.quantity}</p>
                        {item.ingredients && item.ingredients.length > 0 && (
                          <div className="item-ingredients">
                            <span>Added ingredients: </span>
                            {item.ingredients.map(ing => ing.name).join(', ')}
                          </div>
                        )}
                      </div>
                      <div className="item-price">
                        SYP {parseFloat(item.price).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment & Total */}
              <div className="order-section">
                <h3>Payment Information</h3>
                <div className="payment-summary">
                  <div className="payment-method">
                    {selectedOrder.payment?.payment_method?.method === 'credit_card' ? (
                      <CreditCard size={20} />
                    ) : (
                      <Banknote size={20} />
                    )}
                    <span>
                      {selectedOrder.payment?.payment_method?.method === 'credit_card' 
                        ? 'Credit Card' 
                        : 'Cash on Delivery'}
                    </span>
                    <span className={`payment-status ${selectedOrder.payment?.status || 'pending'}`}>
                      {(() => {
                        const paymentMethod = selectedOrder.payment?.payment_method?.method;
                        const paymentStatus = selectedOrder.payment?.status;
                        const orderState = selectedOrder.state;
                        
                        if (paymentMethod === 'credit_card') {
                          // Credit card: immediate status
                          return paymentStatus === 'success' ? 'PAID' : 
                                 paymentStatus === 'failed' ? 'FAILED' : 'PROCESSING';
                        } else if (paymentMethod === 'cash') {
                          // Cash: depends on delivery status
                          if (orderState === 'delivered' && paymentStatus === 'success') {
                            return 'PAID';
                          } else if (orderState === 'delivered' && paymentStatus === 'pending') {
                            return 'PAYMENT DUE';
                          } else {
                            return 'PAY ON DELIVERY';
                          }
                        }
                        
                        return paymentStatus?.toUpperCase() || 'PENDING';
                      })()}
                    </span>
                  </div>
                  
                  <div className="total-amount">
                    <DollarSign size={20} />
                    <span>Total: SYP {parseFloat(selectedOrder.total_amount).toLocaleString()}</span>
                  </div>

                  {/* Payment Help Text */}
                  {selectedOrder.payment?.payment_method?.method === 'cash' && 
                   selectedOrder.state !== 'delivered' && (
                    <div className="payment-help-text">
                      <p>💡 Payment will be collected upon delivery</p>
                    </div>
                  )}
                  
                  {selectedOrder.payment?.payment_method?.method === 'credit_card' && 
                   selectedOrder.payment?.status === 'success' && (
                    <div className="payment-help-text">
                      <p>✅ Payment processed successfully</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <Footer />
      </div>
    );
  }

  // Orders List View
  return (
    <div className="order-history-page">
      <Navbar />
      
      <div className="order-history-container">
        <div className="page-header">
          <h1>Order History</h1>
          <p>Track your orders and view your meal history</p>
        </div>

        {error && (
          <div className="error-message">
            <XCircle size={16} />
            {error}
          </div>
        )}

        {isLoadingOrders ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <Package size={64} />
            <h2>No Orders Yet</h2>
            <p>You haven't placed any orders yet. Start by browsing our delicious menu!</p>
            <button 
              onClick={() => navigate('/menu')} 
              className="btn btn-primary"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <div className="orders-grid">
            {orders.map((order) => {
              const statusConfig = ORDER_STATUS_CONFIG[order.state];
              const StatusIcon = statusConfig.icon;
              
              return (
                <div key={order.order_id} className="order-card">
                  <div className="order-card-header">
                    <div className="order-number">
                      <h3>Order #{order.order_id}</h3>
                      <span className="order-date">{formatDate(order.created_at)}</span>
                    </div>
                    <div 
                      className="order-status" 
                      style={{ backgroundColor: statusConfig.color }}
                    >
                      <StatusIcon size={16} />
                      {statusConfig.label}
                    </div>
                  </div>
                  
                  <div className="order-card-body">
                    <div className="order-summary">
                      <p>
                        {order.order_items?.length || 0} item{(order.order_items?.length || 0) !== 1 ? 's' : ''}
                      </p>
                      <p className="order-total">
                        Total: SYP {parseFloat(order.total_amount).toLocaleString()}
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => handleViewOrder(order.order_id)}
                      className="btn btn-outline-primary btn-sm"
                    >
                      <Eye size={14} />
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
} 