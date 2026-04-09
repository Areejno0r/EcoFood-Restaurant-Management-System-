import React, { useEffect, useState } from 'react';
import './HomePage.css'; 
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ArrowRight, Users, Utensils, Clock, Award, Leaf, Check } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

function Homepage() {
  const { isAuthenticated, customer } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavigation = (path: string) => {
    setIsLoading(true);
    navigate(path);
    setTimeout(() => setIsLoading(false), 500);
  };

  return (
    <div className="homepage">
      {/* Enhanced Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-badge">
            <Leaf size={16} />
            <span>Farm to Table Excellence</span>
          </div>
          <h1 className="hero-title">Welcome to EcoFood</h1>
          <p className="hero-text">
            Savor healthy, delicious meals crafted with fresh, sustainable ingredients. 
            Every dish tells a story of environmental consciousness and culinary excellence.
          </p>
          <div className="hero-actions">
            <button 
              onClick={() => handleNavigation('/reservations')} 
              className="hero-button primary"
              disabled={isLoading}
            >
              <Clock size={20} />
              Book a Table
              <ArrowRight size={16} />
            </button>
            <button 
              onClick={() => handleNavigation('/menu')} 
              className="hero-button secondary"
              disabled={isLoading}
            >
              <Utensils size={20} />
              View Menu
            </button>
          </div>
          {isAuthenticated && (
            <div className="welcome-message">
              <p>Welcome back, {customer?.full_name}! Ready to order something delicious?</p>
            </div>
          )}
        </div>
        <div className="hero-stats">
          <div className="stat">
            <span className="stat-number">500+</span>
            <span className="stat-label">Happy Customers</span>
          </div>
          <div className="stat">
            <span className="stat-number">50+</span>
            <span className="stat-label">Organic Dishes</span>
          </div>
          <div className="stat">
            <span className="stat-number">100%</span>
            <span className="stat-label">Sustainable</span>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Our Story</span>
            <h2 className="section-title">Nourishing Bodies, Caring for Earth</h2>
            <p className="section-description">
              EcoFood is dedicated to promoting healthy eating with a menu designed to nourish your body and soul. 
              Our dishes are made from locally-sourced, organic ingredients, ensuring every bite is both flavorful and nutritious.
            </p>
          </div>
          
          <div className="about-content">
            <div className="about-image-container">
              <img
                src="https://images.unsplash.com/photo-1555244162-803834f70033?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80"
                alt="Restaurant Interior"
                className="about-image"
              />
              <div className="image-overlay">
                <div className="overlay-content">
                  <Award size={24} />
                  <span>Award-Winning Sustainable Restaurant 2024</span>
                </div>
              </div>
            </div>
            
            <div className="about-features">
              <div className="feature-list">
                <div className="feature-item">
                  <Check size={20} />
                  <span>100% Organic & Locally Sourced</span>
                </div>
                <div className="feature-item">
                  <Check size={20} />
                  <span>Zero Waste Kitchen Practices</span>
                </div>
                <div className="feature-item">
                  <Check size={20} />
                  <span>Seasonal Menu Changes</span>
                </div>
                <div className="feature-item">
                  <Check size={20} />
                  <span>Nutritional Information Available</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <div className="section-header">
            <span className="section-badge">Why Choose EcoFood?</span>
            <h2 className="section-title">Experience the Difference</h2>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <Utensils size={32} />
              </div>
              <h3 className="feature-title">Nutritious Meals</h3>
              <p className="feature-description">
                Customize your dishes with detailed nutritional information. 
                Every meal is crafted to provide optimal nutrition and taste.
              </p>
              <Link to="/menu" className="feature-link">
                Explore Menu <ArrowRight size={16} />
              </Link>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <Clock size={32} />
              </div>
              <h3 className="feature-title">Easy Reservations</h3>
              <p className="feature-description">
                Book your table in seconds with our intuitive reservation system. 
                Choose your preferred time and dining experience.
              </p>
              <Link to="/reservations" className="feature-link">
                Book Now <ArrowRight size={16} />
              </Link>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <Leaf size={32} />
              </div>
              <h3 className="feature-title">Sustainable Practices</h3>
              <p className="feature-description">
                We prioritize eco-friendly ingredients and processes. 
                Our commitment to sustainability helps protect our planet.
              </p>
              <a href="#about" className="feature-link">
                Learn More <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Start Your Healthy Journey?</h2>
            <p className="cta-description">
              Join thousands of customers who have chosen EcoFood for their sustainable dining experience.
            </p>
            <div className="cta-actions">
              {isAuthenticated ? (
                <button 
                  onClick={() => handleNavigation('/menu')} 
                  className="cta-button primary"
                  disabled={isLoading}
                >
                  Order Now <ArrowRight size={20} />
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => handleNavigation('/sign-up')} 
                    className="cta-button primary"
                    disabled={isLoading}
                  >
                    Get Started <ArrowRight size={20} />
                  </button>
                  <button 
                    onClick={() => handleNavigation('/menu')} 
                    className="cta-button secondary"
                    disabled={isLoading}
                  >
                    View Menu
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default Homepage; 