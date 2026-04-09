import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useCart } from './contexts/CartContext';
import { apiService } from './services/api.service';
import type { CreateOrderData, CreateOrderItemData } from './types/api.types';
import { 
  ArrowLeft, 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  DollarSign, 
  Lock,
  Truck,
  Clock,
  MapPin,
  Phone,
  Mail,
  Shield,
  Star,
  ChevronRight,
  Eye,
  Search,
  ChefHat,
  Sparkles
} from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import DiscountInput from './components/DiscountInput';
import './Checkout.css';

interface DeliveryInfo {
  address: string;
  phone: string;
  notes: string;
}

// Add processing stages for the order placement animation
interface ProcessingStage {
  id: string;
  title: string;
  message: string;
  duration: number;
  icon: React.ComponentType<any>;
  animation: string;
}

const PROCESSING_STAGES: ProcessingStage[] = [
  {
    id: 'validating',
    title: 'Validating Order',
    message: 'Checking item availability and pricing...',
    duration: 1500,
    icon: Search,
    animation: 'searching-icon'
  },
  {
    id: 'payment',
    title: 'Processing Payment',
    message: 'Securely processing your payment...',
    duration: 2000,
    icon: CreditCard,
    animation: 'card-processing'
  },
  {
    id: 'creating',
    title: 'Creating Order',
    message: 'Sending your order to our kitchen...',
    duration: 1500,
    icon: ChefHat,
    animation: 'order-creation'
  },
  {
    id: 'finalizing',
    title: 'Finalizing',
    message: 'Getting everything ready for you...',
    duration: 1000,
    icon: Sparkles,
    animation: 'finalizing-animation'
  }
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { customer } = useAuth();
  const { cart, clearCart, getCartTotal } = useCart();
  
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit_card'>('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentProcessingStage, setCurrentProcessingStage] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Review, 2: Payment, 3: Confirmation
  
  // Delivery information
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    address: customer?.address || '',
    phone: customer?.phone || '',
    notes: ''
  });

  // Card information (for UI purposes)
  const [cardInfo, setCardInfo] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });

  const [cardErrors, setCardErrors] = useState<Partial<{ cardNumber: string; expiryDate: string; cvv: string; cardholderName: string }>>({});

  // Discount state
  const [appliedDiscount, setAppliedDiscount] = useState<{
    discount: any;
    discount_amount: number;
    final_total: number;
  } | null>(null);

  const deliveryFee = 0;
  const baseTotal = getCartTotal();
  
  // Calculate totals with discount consideration
  const totalAmount = appliedDiscount ? appliedDiscount.final_total + deliveryFee : baseTotal + deliveryFee;

  const validateCardInfo = () => {
    const errors: Partial<{ cardNumber: string; expiryDate: string; cvv: string; cardholderName: string }> = {};
    
    if (!cardInfo.cardNumber || cardInfo.cardNumber.replace(/\s/g, '').length < 16) {
      errors.cardNumber = 'Please enter a valid card number';
    }
    
    if (!cardInfo.expiryDate || !/^\d{2}\/\d{2}$/.test(cardInfo.expiryDate)) {
      errors.expiryDate = 'Please enter expiry in MM/YY format';
    }
    
    if (!cardInfo.cvv || cardInfo.cvv.length < 3) {
      errors.cvv = 'Please enter a valid CVV';
    }
    
    if (!cardInfo.cardholderName.trim()) {
      errors.cardholderName = 'Please enter cardholder name';
    }

    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  const handleCardInfoChange = (field: keyof typeof cardInfo, value: string) => {
    let formattedValue = value;
    
    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (field === 'expiryDate') {
      formattedValue = formatExpiryDate(value);
    } else if (field === 'cvv') {
      formattedValue = value.replace(/[^0-9]/g, '').slice(0, 4);
    }
    
    setCardInfo(prev => ({ ...prev, [field]: formattedValue }));
    
    // Clear error when user starts typing
    if (cardErrors[field]) {
      setCardErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleDeliveryInfoChange = (field: keyof DeliveryInfo, value: string) => {
    setDeliveryInfo(prev => ({ ...prev, [field]: value }));
  };

  const handlePaymentMethodChange = (method: 'cash' | 'credit_card') => {
    setPaymentMethod(method);
    setError(null);
  };

  const handleProceedToPayment = () => {
    if (cart.items.length === 0) {
      setError('Your cart is empty');
      return;
    }
    
    if (paymentMethod === 'credit_card') {
      // Clear previous card errors
      setCardErrors({});
    }
    
    setCurrentStep(2);
    setError(null);
  };

  const handlePlaceOrder = async () => {
    if (!customer) {
      setError('User not authenticated');
      return;
    }

    if (cart.items.length === 0) {
      setError('Cart is empty');
      return;
    }

    if (paymentMethod === 'credit_card') {
      if (!validateCardInfo()) {
        setError('Please check your card information');
        return;
      }
    }

    setIsProcessing(true);
    setCurrentProcessingStage(0);
    setProcessingProgress(0);
    setError(null);

    try {
      // Simulate processing stages with animations
      for (let i = 0; i < PROCESSING_STAGES.length; i++) {
        setCurrentProcessingStage(i);
        const stage = PROCESSING_STAGES[i];
        
        // Animate progress bar for this stage
        const stageProgress = ((i + 1) / PROCESSING_STAGES.length) * 100;
        
        // Gradually increase progress during this stage
        const progressInterval = setInterval(() => {
          setProcessingProgress(prev => {
            const increment = (stageProgress - prev) / (stage.duration / 100);
            return Math.min(prev + increment, stageProgress);
          });
        }, 100);
        
        // Wait for stage duration
        await new Promise(resolve => setTimeout(resolve, stage.duration));
        
        clearInterval(progressInterval);
        setProcessingProgress(stageProgress);
      }

      // Prepare order items data
      const orderItems: CreateOrderItemData[] = cart.items.map(item => ({
        menu_item_id: item.menuItem.menu_item_id,
        quantity: item.quantity,
        price: item.totalPrice.toFixed(2),
        ingredients_ids: item.selectedIngredients.length > 0 
          ? item.selectedIngredients.map(ing => ing.ingredient_id)
          : undefined
      }));

      // Prepare order data
      const orderData: CreateOrderData = {
        customer_id: customer.customer_id,
        total_amount: totalAmount.toFixed(2),
        payment_method: paymentMethod,
        items: orderItems,
        discount_id: appliedDiscount?.discount.discount_id
      };

      console.log('Creating order with data:', orderData);

      // Create the order
      const createdOrder = await apiService.createOrder(orderData);
      
      console.log('Order created successfully:', createdOrder);
      
      // Record discount usage if a discount was applied
      if (appliedDiscount && customer) {
        try {
          await apiService.recordDiscountUsage(
            customer.customer_id,
            appliedDiscount.discount.discount_id,
            createdOrder.order_id
          );
        } catch (discountErr) {
          console.error('Failed to record discount usage:', discountErr);
          // Don't fail the order for this
        }
      }
      
      // Clear the cart
      clearCart();
      
      // Show success animation for a moment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(true);
      setCurrentStep(3);
      
    } catch (err: any) {
      console.error('Order creation failed:', err);
      
      // Enhanced error handling for payment failures
      let errorMessage;
      const responseData = err.response?.data;
      
      if (responseData?.detail) {
        // Check if it's a payment-related error
        if (responseData.detail.includes('Payment failed') || responseData.detail.includes('Credit card payment declined')) {
          errorMessage = `💳 ${responseData.detail}`;
          
          // If it's a credit card payment, suggest alternatives
          if (paymentMethod === 'credit_card') {
            errorMessage += '\n\n💡 Suggestion: Try using Cash on Delivery or contact your bank to ensure your card is activated for online transactions.';
          }
        } else {
          errorMessage = responseData.detail;
        }
      } else if (responseData?.message) {
        errorMessage = responseData.message;
      } else if (err.message) {
        errorMessage = err.message;
      } else {
        errorMessage = 'Failed to place order. Please try again.';
      }
      
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
      setCurrentProcessingStage(0);
      setProcessingProgress(0);
    }
  };

  const handleBackToCart = () => {
    navigate('/cart');
  };

  const handleBackToReview = () => {
    setCurrentStep(1);
    setError(null);
  };

  // Render processing overlay
  const renderProcessingOverlay = () => {
    if (!isProcessing) return null;

    const currentStage = PROCESSING_STAGES[currentProcessingStage];
    const CurrentIcon = currentStage.icon;

    return (
      <div className="order-placement-overlay">
        <div className="placement-modal">
          <div className="placement-animation">
            <div className="stage-animation">
              {currentStage.id === 'validating' && (
                <>
                  <CurrentIcon className="searching-icon" size={48} />
                  <div className="dots-loader">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </>
              )}
              
              {currentStage.id === 'payment' && (
                <div className="card-processing">
                  <CurrentIcon className="card-icon" size={48} />
                  <div className="processing-waves">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
              
              {currentStage.id === 'creating' && (
                <div className="order-creation">
                  <CurrentIcon className="chef-hat" size={48} />
                  <div className="typing-animation">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
              
              {currentStage.id === 'finalizing' && (
                <div className="finalizing-animation">
                  <div className="success-ring">
                    <CurrentIcon className="check-icon" size={48} />
                    <div className="sparkles">
                      <span>✨</span>
                      <span>⭐</span>
                      <span>✨</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <h2 className="placement-title">{currentStage.title}</h2>
          <p className="placement-message">{currentStage.message}</p>
          
          <div className="placement-progress">
            <div 
              className="progress-bar" 
              style={{ width: `${processingProgress}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  // Success state
  if (success && currentStep === 3) {
    return (
      <div className="checkout-page">
        <Navbar />
        <div className="checkout-container">
          <div className="success-state">
            <div className="success-animation">
              <CheckCircle size={80} />
            </div>
            <h2>Order Confirmed!</h2>
            <p>Thank you for your order. We're preparing your delicious meal!</p>
            <div className="success-details">
              <div className="success-item">
                <Clock size={16} />
                <span>Estimated delivery: 25-35 minutes</span>
              </div>
              <div className="success-item">
                <Truck size={16} />
                <span>Your order is being prepared</span>
              </div>
              <div className="success-item">
                <Phone size={16} />
                <span>We'll call you when ready</span>
              </div>
            </div>
            
            <div className="success-actions">
              <button 
                onClick={() => navigate('/orders')}
                className="btn btn-primary"
              >
                <Eye size={16} />
                Track Your Order
              </button>
              <button 
                onClick={() => navigate('/menu')}
                className="btn btn-outline-secondary"
              >
                <ArrowLeft size={16} />
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <Navbar />
      
      <div className="checkout-container">
        {/* Progress Steps */}
        <div className="checkout-progress">
          <div className={`progress-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <span>Review Order</span>
          </div>
          <div className={`progress-step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <span>Payment</span>
          </div>
          <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <span>Confirmation</span>
          </div>
        </div>

        <div className="checkout-header">
          <button onClick={currentStep === 1 ? handleBackToCart : handleBackToReview} className="back-btn">
            <ArrowLeft size={16} />
            {currentStep === 1 ? 'Back to Cart' : 'Back to Review'}
          </button>
          <h1>
            {currentStep === 1 ? 'Review Your Order' : 
             currentStep === 2 ? 'Payment Details' : 'Order Confirmation'}
          </h1>
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={16} />
            <div className="error-content">
              {error.split('\n').map((line, index) => (
                <div key={index} className={index === 0 ? 'error-main' : 'error-suggestion'}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="checkout-content">
          <div className="checkout-main">
            {currentStep === 1 && (
              <>
                {/* Delivery Information */}
                <div className="section">
                  <h3>
                    <MapPin size={20} />
                    Delivery Information
                  </h3>
                  <div className="delivery-form">
                    <div className="form-group">
                      <label>Delivery Address *</label>
                      <textarea
                        value={deliveryInfo.address}
                        onChange={(e) => handleDeliveryInfoChange('address', e.target.value)}
                        placeholder="Enter your full delivery address"
                        rows={3}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Contact Phone *</label>
                      <input
                        type="tel"
                        value={deliveryInfo.phone}
                        onChange={(e) => handleDeliveryInfoChange('phone', e.target.value)}
                        placeholder="Enter your phone number"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Delivery Notes (Optional)</label>
                      <input
                        type="text"
                        value={deliveryInfo.notes}
                        onChange={(e) => handleDeliveryInfoChange('notes', e.target.value)}
                        placeholder="Special instructions for delivery"
                      />
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="section">
                  <h3>Order Summary</h3>
                  <div className="order-items">
                    {cart.items.map(item => (
                      <div key={item.id} className="order-item">
                        <div className="item-image">
                          <img
                            src={item.menuItem.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100'}
                            alt={item.menuItem.name}
                          />
                        </div>
                        <div className="item-info">
                          <h4>{item.menuItem.name}</h4>
                          <p>Quantity: {item.quantity}</p>
                          {item.selectedIngredients.length > 0 && (
                            <div className="item-ingredients">
                              <span>Added ingredients: </span>
                              {item.selectedIngredients.map(ing => ing.name).join(', ')}
                            </div>
                          )}
                        </div>
                        <div className="item-price">
                          SYP {item.totalPrice.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {currentStep === 2 && (
              <div className="section">
                <h3>
                  <Lock size={20} />
                  Payment Method
                </h3>
                <div className="payment-methods">
                  <label className={`payment-option ${paymentMethod === 'cash' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="cash"
                      checked={paymentMethod === 'cash'}
                      onChange={() => handlePaymentMethodChange('cash')}
                    />
                    <div className="payment-card">
                      <div className="payment-header">
                        <DollarSign size={24} />
                        <div>
                          <strong>Cash on Delivery</strong>
                          <p>Pay when your order arrives</p>
                        </div>
                        <div className="payment-badge recommended">Recommended</div>
                      </div>
                      <div className="payment-features">
                        <div className="feature">
                          <CheckCircle size={14} />
                          <span>No additional fees</span>
                        </div>
                        <div className="feature">
                          <CheckCircle size={14} />
                          <span>Secure and convenient</span>
                        </div>
                      </div>
                    </div>
                  </label>

                  <label className={`payment-option ${paymentMethod === 'credit_card' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="payment"
                      value="credit_card"
                      checked={paymentMethod === 'credit_card'}
                      onChange={() => handlePaymentMethodChange('credit_card')}
                    />
                    <div className="payment-card">
                      <div className="payment-header">
                        <CreditCard size={24} />
                        <div>
                          <strong>Credit/Debit Card</strong>
                          <p>Pay securely with your card</p>
                        </div>
                      </div>
                      <div className="payment-features">
                        <div className="feature">
                          <Shield size={14} />
                          <span>256-bit SSL encryption</span>
                        </div>
                        <div className="feature">
                          <Star size={14} />
                          <span>Faster checkout next time</span>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>

                {paymentMethod === 'credit_card' && (
                  <div className="card-form">
                    <h4>Card Information</h4>
                    <div className="card-inputs">
                      <div className="form-group">
                        <label>Card Number</label>
                        <input
                          type="text"
                          value={cardInfo.cardNumber}
                          onChange={(e) => handleCardInfoChange('cardNumber', e.target.value)}
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                          className={cardErrors.cardNumber ? 'error' : ''}
                        />
                        {cardErrors.cardNumber && <span className="error-text">{cardErrors.cardNumber}</span>}
                      </div>
                      
                      <div className="form-row">
                        <div className="form-group">
                          <label>Expiry Date</label>
                          <input
                            type="text"
                            value={cardInfo.expiryDate}
                            onChange={(e) => handleCardInfoChange('expiryDate', e.target.value)}
                            placeholder="MM/YY"
                            maxLength={5}
                            className={cardErrors.expiryDate ? 'error' : ''}
                          />
                          {cardErrors.expiryDate && <span className="error-text">{cardErrors.expiryDate}</span>}
                        </div>
                        
                        <div className="form-group">
                          <label>CVV</label>
                          <input
                            type="text"
                            value={cardInfo.cvv}
                            onChange={(e) => handleCardInfoChange('cvv', e.target.value)}
                            placeholder="123"
                            maxLength={4}
                            className={cardErrors.cvv ? 'error' : ''}
                          />
                          {cardErrors.cvv && <span className="error-text">{cardErrors.cvv}</span>}
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label>Cardholder Name</label>
                        <input
                          type="text"
                          value={cardInfo.cardholderName}
                          onChange={(e) => handleCardInfoChange('cardholderName', e.target.value)}
                          placeholder="John Doe"
                          className={cardErrors.cardholderName ? 'error' : ''}
                        />
                        {cardErrors.cardholderName && <span className="error-text">{cardErrors.cardholderName}</span>}
                      </div>
                    </div>
                    
                    <div className="security-info">
                      <Shield size={16} />
                      <span>Your payment information is encrypted and secure</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="checkout-sidebar">
            <div className="order-summary">
              <h3>Order Summary</h3>
              
              <div className="summary-line">
                <span>Subtotal ({cart.totalItems} items)</span>
                <span>SYP {baseTotal.toLocaleString()}</span>
              </div>
              
              {appliedDiscount && (
                <div className="summary-line discount">
                  <span>Discount ({appliedDiscount.discount.code})</span>
                  <span className="discount-amount">-SYP {appliedDiscount.discount_amount.toLocaleString()}</span>
                </div>
              )}
              

              
              <div className="summary-line">
                <span>Delivery Fee</span>
                <span className="free">Free</span>
              </div>
              
              {/* Discount Input Component */}
              <DiscountInput
                orderTotal={baseTotal}
                customerId={customer?.customer_id}
                onDiscountApplied={setAppliedDiscount}
                appliedDiscount={appliedDiscount}
              />
              
              <hr />
              
              <div className="summary-line total">
                <span>Total</span>
                <span>SYP {totalAmount.toLocaleString()}</span>
              </div>
              
              <div className="delivery-estimate">
                <Clock size={16} />
                <span>Estimated delivery: 25-35 mins</span>
              </div>
              
              {currentStep === 1 && (
                <button 
                  onClick={handleProceedToPayment}
                  className="proceed-btn"
                >
                  Proceed to Payment
                  <ChevronRight size={16} />
                </button>
              )}
              
              {currentStep === 2 && (
                <button 
                  onClick={handlePlaceOrder}
                  className="place-order-btn"
                  disabled={isProcessing || cart.items.length === 0}
                >
                  {isProcessing ? 'Processing...' : `Place Order • SYP ${totalAmount.toLocaleString()}`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {renderProcessingOverlay()}
      <Footer />
    </div>
  );
} 