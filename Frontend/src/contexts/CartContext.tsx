import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { MenuItem, Ingredient } from '../types/api.types';

// Cart Item Type
export interface CartItem {
  id: string; // Unique identifier for cart item
  menuItem: MenuItem;
  quantity: number;
  selectedIngredients: Ingredient[];
  unitPrice: number;
  totalPrice: number;
}

// Cart State Type
interface CartState {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
}

// Cart Actions
type CartAction =
  | { type: 'ADD_ITEM'; payload: { menuItem: MenuItem; quantity: number; selectedIngredients: Ingredient[] } }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartState };

// Cart Context Type
interface CartContextType {
  cart: CartState;
  addToCart: (menuItem: MenuItem, quantity: number, selectedIngredients: Ingredient[]) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  clearCartFromStorage: () => void;
  getCartItemCount: () => number;
  getCartTotal: () => number;
}

// Initial state
const initialState: CartState = {
  items: [],
  totalItems: 0,
  totalAmount: 0,
};

// Helper function to calculate totals
const calculateTotals = (items: CartItem[]): { totalItems: number; totalAmount: number } => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
  return { totalItems, totalAmount };
};

// Helper function to calculate item price (matches backend logic)
const calculateItemPrice = (menuItem: MenuItem, quantity: number, selectedIngredients: Ingredient[]): { unitPrice: number; totalPrice: number } => {
  // Base price of the menu item
  const basePrice = parseFloat(menuItem.price);
  
  // Add costs of additional ingredients
  const ingredientCost = selectedIngredients.reduce((sum, ingredient) => {
    return sum + parseFloat(ingredient.price_per_unit);
  }, 0);
  
  // Calculate unit price (base + ingredients)
  const unitPrice = basePrice + ingredientCost;
  
  // Calculate total price for the quantity
  const totalPrice = unitPrice * quantity;
  
  return { unitPrice, totalPrice };
};

// Cart Reducer
const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { menuItem, quantity, selectedIngredients } = action.payload;
      
      // Generate unique ID based on menu item and selected ingredients
      const ingredientIds = selectedIngredients.map(ing => ing.ingredient_id).sort().join(',');
      const itemId = `${menuItem.menu_item_id}-${ingredientIds}`;
      
      // Check if item already exists in cart
      const existingItemIndex = state.items.findIndex(item => item.id === itemId);
      
      let newItems: CartItem[];
      
      if (existingItemIndex >= 0) {
        // Update existing item quantity
        newItems = state.items.map((item, index) => {
          if (index === existingItemIndex) {
            const newQuantity = item.quantity + quantity;
            const { unitPrice, totalPrice } = calculateItemPrice(menuItem, newQuantity, selectedIngredients);
            return { ...item, quantity: newQuantity, unitPrice, totalPrice };
          }
          return item;
        });
      } else {
        // Add new item
        const { unitPrice, totalPrice } = calculateItemPrice(menuItem, quantity, selectedIngredients);
        
        const newItem: CartItem = {
          id: itemId,
          menuItem,
          quantity,
          selectedIngredients,
          unitPrice,
          totalPrice,
        };
        
        newItems = [...state.items, newItem];
      }
      
      const { totalItems, totalAmount } = calculateTotals(newItems);
      
      return {
        items: newItems,
        totalItems,
        totalAmount,
      };
    }
    
    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.id !== action.payload.id);
      const { totalItems, totalAmount } = calculateTotals(newItems);
      
      return {
        items: newItems,
        totalItems,
        totalAmount,
      };
    }
    
    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload;
      
      if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        const newItems = state.items.filter(item => item.id !== id);
        const { totalItems, totalAmount } = calculateTotals(newItems);
        
        return {
          items: newItems,
          totalItems,
          totalAmount,
        };
      }
      
      const newItems = state.items.map(item => {
        if (item.id === id) {
          const { unitPrice, totalPrice } = calculateItemPrice(item.menuItem, quantity, item.selectedIngredients);
          return { ...item, quantity, unitPrice, totalPrice };
        }
        return item;
      });
      
      const { totalItems, totalAmount } = calculateTotals(newItems);
      
      return {
        items: newItems,
        totalItems,
        totalAmount,
      };
    }
    
    case 'CLEAR_CART':
      return initialState;
    
    case 'LOAD_CART':
      return action.payload;
    
    default:
      return state;
  }
};

// Create Context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Cart Provider Component
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('ecofood_cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        // Validate the loaded cart structure
        if (parsedCart && Array.isArray(parsedCart.items)) {
          dispatch({ type: 'LOAD_CART', payload: parsedCart });
        }
      } catch (error) {
        console.error('Failed to load cart from localStorage:', error);
        // Clear invalid cart data
        localStorage.removeItem('ecofood_cart');
      }
    }
  }, []);

  // Save cart to localStorage whenever cart changes
  useEffect(() => {
    try {
      localStorage.setItem('ecofood_cart', JSON.stringify(cart));
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
    }
  }, [cart]);

  const addToCart = (menuItem: MenuItem, quantity: number, selectedIngredients: Ingredient[]) => {
    dispatch({ type: 'ADD_ITEM', payload: { menuItem, quantity, selectedIngredients } });
  };

  const removeFromCart = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { id } });
  };

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const clearCartFromStorage = () => {
    localStorage.removeItem('ecofood_cart');
    dispatch({ type: 'CLEAR_CART' });
  };

  const getCartItemCount = () => cart.totalItems;

  const getCartTotal = () => cart.totalAmount;

  const contextValue: CartContextType = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    clearCartFromStorage,
    getCartItemCount,
    getCartTotal,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 