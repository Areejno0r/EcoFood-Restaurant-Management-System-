import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Footer() {
  const { isAuthenticated, customer, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>EcoFood</h3>
            <p>Sustainable dining for a better tomorrow</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Quick Links</h4>
              <Link to="/">Home</Link>
              <Link to="/menu">Menu</Link>
              <Link to="/reservations">Reservations</Link>
              <Link to="/contact">Contact</Link>
            </div>
            <div className="footer-column">
              <h4>Account</h4>
              {isAuthenticated ? (
                <>
                  <span>Welcome, {customer?.full_name}</span>
                  <button onClick={handleLogout} className="footer-link-btn">Sign Out</button>
                </>
              ) : (
                <>
                  <Link to="/sign-up">Sign In</Link>
                  <Link to="/sign-up">Create Account</Link>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 EcoFood. All rights reserved. | Designed with ❤️ for the planet</p>
        </div>
      </div>
    </footer>
  );
} 