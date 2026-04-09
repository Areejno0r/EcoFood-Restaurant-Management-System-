import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './Customizedish.css';
import { apiService } from './services/api.service';
import type { MenuItem, Ingredient } from './types/api.types';
import { ArrowLeft, Plus, Minus, ShoppingCart, AlertCircle, Check } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { useCart } from './contexts/CartContext';

export default function CustomizeDishPage() {
  const navigate = useNavigate();
  const { id: menuItemIdFromParams } = useParams<{ id: string }>();
  const { addToCart } = useCart();

  const [menuItem, setMenuItem] = useState<MenuItem | null>(null);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);
  const [selectedIngredientIds, setSelectedIngredientIds] = useState<number[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAddingToCart, setIsAddingToCart] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchDishAndIngredients = async () => {
      if (!menuItemIdFromParams) {
        setError("No menu item ID provided.");
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch menu item details
        const fetchedMenuItem = await apiService.getMenuItem(Number(menuItemIdFromParams));
        setMenuItem(fetchedMenuItem);

        // Fetch available ingredients
        const ingredientsResponse = await apiService.getIngredients();
        if (ingredientsResponse && Array.isArray(ingredientsResponse.results)) {
          setAllIngredients(ingredientsResponse.results);
        } else {
          console.warn("Ingredients response format unexpected:", ingredientsResponse);
          setAllIngredients([]);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load dish details.";
        setError(errorMessage);
        console.error("Error fetching dish/ingredients:", err);
        setMenuItem(null);
        setAllIngredients([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDishAndIngredients();
  }, [menuItemIdFromParams]);

  const getSelectedIngredients = (): Ingredient[] => {
    return allIngredients.filter(ingredient => 
      selectedIngredientIds.includes(ingredient.ingredient_id)
    );
  };

  const calculateTotalPrice = useCallback(() => {
    if (!menuItem) return 0;
    
    let currentPrice = parseFloat(menuItem.price);
    
    // Add ingredient prices
    const selectedIngredients = getSelectedIngredients();
    selectedIngredients.forEach(ingredient => {
      if (ingredient.price_per_unit) {
        currentPrice += parseFloat(ingredient.price_per_unit);
      }
    });
    
    return currentPrice * quantity;
  }, [menuItem, selectedIngredientIds, allIngredients, quantity]);

  useEffect(() => {
    if (menuItem) {
      setTotalPrice(calculateTotalPrice());
    }
  }, [menuItem, selectedIngredientIds, quantity, calculateTotalPrice]);

  const handleIngredientToggle = (ingredientId: number) => {
    setSelectedIngredientIds(prev =>
      prev.includes(ingredientId)
        ? prev.filter(id => id !== ingredientId)
        : [...prev, ingredientId]
    );
  };

  const handleQuantityChange = (change: number) => {
    setQuantity(prev => Math.max(1, prev + change));
  };

  const handleAddToCart = async () => {
    if (!menuItem) {
      setError("Menu item data is incomplete.");
      return;
    }

    setIsAddingToCart(true);
    setError(null);
    setSuccess(null);
    
    try {
      const selectedIngredients = getSelectedIngredients();
      
      // Add to cart using the cart context
      addToCart(menuItem, quantity, selectedIngredients);
      
      setSuccess(`Added ${quantity} × ${menuItem.name} to your cart!`);
      
      // Remove automatic redirect - let user choose where to go next
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to add item to cart.";
      setError(errorMessage);
      console.error("Error adding item to cart:", err);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBackToMenu = () => {
    navigate('/menu');
  };

  // Loading state
  if (isLoading && !menuItem) { 
    return (
      <div className="customize-section">
        <Navbar />
        <div className="loading-container">
          <div className="spinner"></div>
          <h2>Loading dish details...</h2>
          <p>Please wait while we prepare your customization options</p>
        </div>
        <Footer />
      </div>
    );
  }

  // Error state - menu item couldn't be loaded
  if (error && !menuItem) {
    return (
      <div className="customize-section">
        <Navbar />
        <div className="error-container">
          <AlertCircle size={48} />
          <h2>Error Loading Dish</h2>
          <p>{error}</p>
          <button onClick={handleBackToMenu} className="btn btn-primary">
            <ArrowLeft size={16} />
            Back to Menu
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  // Menu item not found
  if (!menuItem) {
    return (
      <div className="customize-section">
        <Navbar />
        <div className="error-container">
          <AlertCircle size={48} />
          <h2>Dish Not Found</h2>
          <p>The requested menu item could not be found.</p>
          <button onClick={handleBackToMenu} className="btn btn-primary">
            <ArrowLeft size={16} />
            Back to Menu
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const imageUrl = menuItem.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400';

  // Main content
  return (
    <div className="customize-section">
      <Navbar />
      
      <div className="customize-dish-container">
        <button onClick={handleBackToMenu} className="btn-outline-secondary mb-3">
          <ArrowLeft size={16} />
          Back to Menu
        </button>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <Check size={16} />
            {success}
            <div className="success-actions mt-3">
              <button 
                onClick={() => navigate('/cart')} 
                className="btn btn-primary btn-sm me-2"
              >
                <ShoppingCart size={14} />
                View Cart
              </button>
              <button 
                onClick={() => navigate('/menu')} 
                className="btn btn-outline-secondary btn-sm me-2"
              >
                Continue Shopping
              </button>
              <button 
                onClick={() => setSuccess('')} 
                className="btn btn-outline-light btn-sm"
              >
                Stay Here
              </button>
            </div>
          </div>
        )}

        <div className="row">
          <div className="col-md-6">
            <img
              src={imageUrl}
              alt={menuItem.name}
              className="dish-image-large img-fluid rounded shadow-sm"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400';
              }}
            />
          </div>
          
          <div className="col-md-6">
            <h1>{menuItem.name}</h1>
            <p className="text-muted">{menuItem.category}</p>
            <p>{menuItem.description || 'A delicious and healthy meal prepared with care.'}</p>
            <p className="base-price">Base Price: <strong>SYP {parseFloat(menuItem.price).toLocaleString()}</strong></p>
            {menuItem.calories && <p><small>Calories: {menuItem.calories} kcal</small></p>}

            <hr />

            <h4>Customize Ingredients:</h4>
            {allIngredients.length === 0 ? (
              <p>No additional ingredients available for customization.</p>
            ) : (
              <div className="ingredients-list">
                {allIngredients.map(ingredient => (
                  <div key={ingredient.ingredient_id} className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`ingredient-${ingredient.ingredient_id}`}
                      checked={selectedIngredientIds.includes(ingredient.ingredient_id)}
                      onChange={() => handleIngredientToggle(ingredient.ingredient_id)}
                      disabled={!ingredient.is_available}
                    />
                    <label 
                      className={`form-check-label ${!ingredient.is_available ? 'text-muted' : ''}`} 
                      htmlFor={`ingredient-${ingredient.ingredient_id}`}
                    >
                      {ingredient.name} (+SYP {parseFloat(ingredient.price_per_unit).toLocaleString()})
                      {ingredient.is_allergen && <span className="badge bg-danger ms-2">Allergen</span>}
                      {!ingredient.is_available && <span className="badge bg-secondary ms-2">Not Available</span>}
                    </label>
                  </div>
                ))}
              </div>
            )}

            <hr />

            <div className="quantity-controls">
              <h4>Quantity:</h4>
              <button 
                onClick={() => handleQuantityChange(-1)} 
                className="btn btn-secondary btn-sm" 
                disabled={quantity <= 1}
              >
                <Minus size={16} />
              </button>
              <span className="quantity-display">{quantity}</span>
              <button 
                onClick={() => handleQuantityChange(1)} 
                className="btn btn-secondary btn-sm"
              >
                <Plus size={16} />
              </button>
            </div>

            <hr />

            <div className="total-price">
              Total: SYP {totalPrice.toLocaleString()}
            </div>
            
            <button 
              onClick={handleAddToCart} 
              className="btn btn-primary btn-lg w-100" 
              disabled={isAddingToCart || !menuItem.is_available}
            >
              <ShoppingCart size={18} />
              {isAddingToCart ? 'Adding to Cart...' : (menuItem.is_available ? 'Add to Cart' : 'Item Unavailable')}
            </button>
            
            {!menuItem.is_available && (
              <p className="text-danger mt-2">This item is currently not available.</p>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}