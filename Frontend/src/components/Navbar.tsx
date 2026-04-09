import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Utensils, Clock, Users, ShoppingCart, Package, Calendar } from 'lucide-react';

export default function Navbar() {
  const { isAuthenticated, customer, logout } = useAuth();
  const { getCartItemCount, clearCartFromStorage } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Optional: Ask user if they want to keep their cart
    // For now, we'll preserve the cart for better UX
    logout();
    // Navigate to home page after logout
    navigate('/');
  };

  const cartItemCount = getCartItemCount();

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-brand">
          <Link to="/" className="logo-link">
            <span className="logo">EcoFood</span>
            <span className="tagline">Sustainable Dining</span>
          </Link>
        </div>
        <div className="nav-links">
          <Link to="/" className="nav-link">
            <Utensils size={18} />
            Home
          </Link>
          <Link to="/menu" className="nav-link">
            <Utensils size={18} />
            Menu
          </Link>
          <Link to="/reservations" className="nav-link">
            <Calendar size={20} />
            Reservations
          </Link>
          <Link to="/cart" className="nav-link cart-link">
            <div className="cart-icon-container">
              <ShoppingCart size={18} />
              {cartItemCount > 0 && (
                <span className="cart-badge">{cartItemCount}</span>
              )}
            </div>
            Cart
          </Link>
          {isAuthenticated && (
            <Link to="/orders" className="nav-link">
              <Package size={18} />
              Orders
            </Link>
          )}
          {isAuthenticated ? (
            <div className="user-menu">
              <span className="user-greeting">Hello, {customer?.full_name}</span>
              <button onClick={handleLogout} className="nav-link logout-btn">
                Sign Out
              </button>
            </div>
          ) : (
            <Link to="/sign-up" className="nav-link auth-link">
              <Users size={18} />
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
} 