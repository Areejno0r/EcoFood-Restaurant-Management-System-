import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useCart, type CartItem } from './contexts/CartContext';
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, ArrowLeft } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import './Cart.css';

export default function CartPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { cart, removeFromCart, updateQuantity, clearCart, getCartTotal } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    removeFromCart(itemId);
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your entire cart?')) {
      clearCart();
    }
  };

  const handleContinueShopping = () => {
    navigate('/menu');
  };

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      // Redirect to login page with return URL
      navigate('/sign-up', { state: { returnTo: '/cart' } });
      return;
    }
    
    setIsProcessing(true);
    // Navigate to checkout page
    navigate('/checkout');
  };

  // Empty cart state
  if (cart.items.length === 0) {
    return (
      <div className="cart-page">
        <Navbar />
        <div className="cart-container">
          <div className="empty-cart">
            <ShoppingCart size={64} />
            <h2>Your Cart is Empty</h2>
            <p>Looks like you haven't added any delicious items to your cart yet.</p>
            <button 
              onClick={handleContinueShopping}
              className="btn btn-primary"
            >
              <ArrowLeft size={16} />
              Continue Shopping
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="cart-page">
      <Navbar />
      
      <div className="cart-container">
        <div className="cart-header">
          <h1>Your Cart</h1>
          <p>{cart.totalItems} item{cart.totalItems !== 1 ? 's' : ''} in your cart</p>
        </div>

        <div className="cart-content">
          <div className="cart-items">
            {cart.items.map((item: CartItem) => (
              <div key={item.id} className="cart-item">
                <div className="item-image">
                  <img
                    src={item.menuItem.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=150'}
                    alt={item.menuItem.name}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=150';
                    }}
                  />
                </div>
                
                <div className="item-details">
                  <h3>{item.menuItem.name}</h3>
                  <p className="item-category">{item.menuItem.category}</p>
                  
                  {item.selectedIngredients.length > 0 && (
                    <div className="selected-ingredients">
                      <span className="ingredients-label">Added ingredients:</span>
                      <div className="ingredients-list">
                        {item.selectedIngredients.map(ingredient => (
                          <span key={ingredient.ingredient_id} className="ingredient-tag">
                            {ingredient.name}
                            {ingredient.is_allergen && <span className="allergen-indicator">⚠️</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="item-price">
                    <span className="unit-price">SYP {item.unitPrice.toLocaleString()} each</span>
                  </div>
                </div>
                
                <div className="item-controls">
                  <div className="quantity-controls">
                    <button 
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      className="quantity-btn"
                      disabled={item.quantity <= 1}
                    >
                      <Minus size={16} />
                    </button>
                    <span className="quantity">{item.quantity}</span>
                    <button 
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      className="quantity-btn"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  
                  <div className="item-total">
                    SYP {item.totalPrice.toLocaleString()}
                  </div>
                  
                  <button 
                    onClick={() => handleRemoveItem(item.id)}
                    className="remove-btn"
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="cart-sidebar">
            <div className="cart-summary">
              <h3>Order Summary</h3>
              
              <div className="summary-line">
                <span>Items ({cart.totalItems})</span>
                <span>SYP {getCartTotal().toLocaleString()}</span>
              </div>
              
              <div className="summary-line">
                <span>Delivery Fee</span>
                <span>Free</span>
              </div>
              
              <hr />
              
              <div className="summary-line total">
                <span>Total</span>
                <span>SYP {getCartTotal().toLocaleString()}</span>
              </div>
              
              <div className="cart-actions">
                <button 
                  onClick={handleProceedToCheckout}
                  className="btn btn-primary btn-lg"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Proceed to Checkout'}
                  <ArrowRight size={16} />
                </button>
                
                <button 
                  onClick={handleContinueShopping}
                  className="btn btn-outline-secondary"
                >
                  <ArrowLeft size={16} />
                  Continue Shopping
                </button>
                
                <button 
                  onClick={handleClearCart}
                  className="btn btn-outline-danger"
                >
                  Clear Cart
                </button>
              </div>
            </div>
            
            {!isAuthenticated && (
              <div className="auth-notice">
                <p>
                  <strong>Sign in to proceed</strong><br />
                  You'll need to sign in to complete your order.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
} 