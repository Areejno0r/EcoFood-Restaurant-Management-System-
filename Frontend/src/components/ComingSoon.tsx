import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  ArrowLeft, 
  Bell, 
  Calendar,
  Utensils,
  Sparkles,
  Mail,
  Heart
} from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';
import './ComingSoon.css';

interface ComingSoonProps {
  feature?: string;
  description?: string;
}

export default function ComingSoon({ 
  feature = "This Feature", 
  description = "We're working hard to bring you amazing new functionality!" 
}: ComingSoonProps) {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="coming-soon-page">
      <Navbar />
      
      <div className="coming-soon-container">
        <div className="coming-soon-content">
          {/* Animated Icons */}
          <div className="feature-icons">
            <div className="icon-float">
              <Clock size={32} />
            </div>
            <div className="icon-float delay-1">
              <Calendar size={28} />
            </div>
            <div className="icon-float delay-2">
              <Utensils size={30} />
            </div>
            <div className="icon-float delay-3">
              <Sparkles size={26} />
            </div>
          </div>

          {/* Main Content */}
          <div className="coming-soon-main">
            <div className="status-badge">
              <Bell size={16} />
              <span>Coming Soon</span>
            </div>
            
            <h1>{feature} is Almost Ready!</h1>
            
            <p className="description">
              {description}
            </p>
            
            <div className="feature-highlights">
              <div className="highlight-item">
                <Heart size={20} />
                <span>Crafted with Love</span>
              </div>
              <div className="highlight-item">
                <Sparkles size={20} />
                <span>Amazing Experience</span>
              </div>
              <div className="highlight-item">
                <Utensils size={20} />
                <span>Delicious Results</span>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="progress-section">
              <div className="progress-label">
                <span>Development Progress</span>
                <span>85%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>
            </div>

            {/* Notification Signup */}
            <div className="notification-signup">
              <div className="signup-content">
                <Mail size={20} />
                <div>
                  <h3>Get Notified</h3>
                  <p>Be the first to know when this feature launches!</p>
                </div>
              </div>
              <div className="signup-form">
                <input 
                  type="email" 
                  placeholder="Enter your email address"
                  className="email-input"
                />
                <button className="notify-btn">
                  <Bell size={16} />
                  Notify Me
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button onClick={handleGoBack} className="btn btn-outline">
                <ArrowLeft size={16} />
                Go Back
              </button>
              <button onClick={handleGoHome} className="btn btn-primary">
                <Utensils size={16} />
                Explore Menu
              </button>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="decorative-elements">
            <div className="floating-emoji delay-0">🍽️</div>
            <div className="floating-emoji delay-1">✨</div>
            <div className="floating-emoji delay-2">🍕</div>
            <div className="floating-emoji delay-3">🍝</div>
            <div className="floating-emoji delay-4">🥗</div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
} 