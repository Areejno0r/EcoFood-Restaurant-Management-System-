import React, { useState, useEffect } from 'react';
import './menu.css'
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { apiService } from './services/api.service';
import type { MenuItem, ApiResponse } from './types/api.types';
import { ArrowRight, Users, Utensils, Clock, Leaf, ShoppingCart, Star } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

function DishCard({ dish }: { dish: MenuItem }) {
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();
  
  const imageUrl = dish.image && !imageError 
    ? dish.image 
    : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200';

  const handleCustomizeClick = () => {
    navigate(`/customizedish/${dish.menu_item_id}`);
  };

  return (
    <div className="dish-card">
      <div className="dish-image-container">
        <img 
          src={imageUrl} 
          alt={dish.name}
          onError={() => setImageError(true)}
          className="dish-image"
        />
        <div className="availability-badge">
          {dish.is_available ? (
            <span className="available">Available</span>
          ) : (
            <span className="unavailable">Sold Out</span>
          )}
        </div>
      </div>
      <div className="dish-content">
        <h3 className="dish-title">{dish.name}</h3>
        <p className="dish-description">{dish.description || 'Delicious and healthy meal'}</p>
        
        <div className="dish-details">
          <div className="calories">
            <Leaf size={16} />
            <span>{dish.calories || 'N/A'} calories</span>
          </div>
          <div className="rating">
            <Star size={16} fill="currentColor" />
            <span>4.5</span>
          </div>
        </div>
        
        <div className="dish-footer">
          <div className="price-container">
            <span className="price">SYP {dish.price}</span>
          </div>
          <div className="button-container">
            <button 
              onClick={handleCustomizeClick} 
              disabled={!dish.is_available}
              className={`btn add-to-cart-btn-card ${dish.is_available ? 'btn-primary' : 'btn-disabled'}`}
            >
              <ShoppingCart size={16} />
              {dish.is_available ? 'Customize & Add' : 'Not Available'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuSection({ dishes, title, description }: { 
  dishes: MenuItem[]; 
  title: string;
  description?: string;
}) {
  if (dishes.length === 0) {
    return null;
  }

  return (
    <section className="menu-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">{title}</h2>
          {description && <p className="section-description">{description}</p>}
        </div>
        <div className="menu-grid">
          {dishes.map(dish => (
            <DishCard key={dish.menu_item_id} dish={dish} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Menu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setLoading(true);
        setError('');
        const menuResponse: ApiResponse<MenuItem> = await apiService.getMenuItems();
        setMenuItems(menuResponse.results);
      } catch (err: any) {
        console.error('Error fetching menu items:', err);
        setError('Failed to load menu items. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  // Group items by category
  const breakfastItems = menuItems.filter(item => item.category === 'breakfast');
  const lunchItems = menuItems.filter(item => item.category === 'lunch');
  const dinnerItems = menuItems.filter(item => item.category === 'dinner');
  const snackItems = menuItems.filter(item => item.category === 'snack');

  if (loading) {
    return (
      <div className="menu-page">
        <Navbar />
        <main className="loading-container">
          <div className="loading-content">
            <div className="spinner"></div>
            <h2>Loading our delicious menu...</h2>
            <p>Please wait while we prepare something amazing for you</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="menu-page">
        <Navbar />
        <main className="error-container">
          <div className="error-content">
            <h2>Oops! Something went wrong</h2>
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="retry-btn"
            >
              <ArrowRight size={16} />
              Try Again
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="menu-page">
      <Navbar />
      
      <main>
        <section className="hero">
          <div className="hero-overlay"></div>
          <div className="container">
            <div className="hero-content">
              <div className="hero-badge">
                <Leaf size={16} />
                <span>Fresh & Organic</span>
              </div>
              <h1 className="hero-title">Our Healthy Menu</h1>
              <p className="hero-text">
                Fresh, organic, and delicious meals crafted for your wellness. 
                Every dish is prepared with love and sustainable ingredients.
              </p>
            </div>
          </div>
        </section>

        <MenuSection 
          dishes={breakfastItems} 
          title="Healthy Breakfast" 
          description="Start your day right with our nutritious breakfast options"
        />
        <MenuSection 
          dishes={lunchItems} 
          title="Nutritious Lunch" 
          description="Energizing meals to fuel your afternoon"
        />
        <MenuSection 
          dishes={dinnerItems} 
          title="Light Dinner" 
          description="Satisfying yet light evening meals for better sleep"
        />
        <MenuSection 
          dishes={snackItems} 
          title="Healthy Snacks" 
          description="Guilt-free snacks for any time of the day"
        />

        {menuItems.length === 0 && !loading && !error && (
          <section className="empty-menu">
            <div className="container">
              <div className="empty-content">
                <Utensils size={64} />
                <h2>No menu items available</h2>
                <p>We're working on our menu. Please check back later for our delicious offerings!</p>
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}