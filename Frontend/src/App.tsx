import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import Homepage from './HomePage';
import Menu from './menu';
import Contact from './contact';
import Signup from './sign-up'; 
import Reservations from './Reservations';
import CustomizeDishPage from './Customizedish';
import CartPage from './Cart';
import CheckoutPage from './Checkout';
import OrderHistory from './OrderHistory';
import Payment from './Payment';
import ReservationManagement from './components/ReservationManagement';


function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/sign-up" element={<Signup />} />
            <Route path="/contact" element={<Contact />} /> 
            <Route path="/reservations" element={<Reservations />} />
            <Route path="/my-reservations" element={<ReservationManagement />} />
            <Route path="/customizedish/:id" element={<CustomizeDishPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/orders" element={<OrderHistory />} />
            <Route path="/payment" element={<Payment />} />
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;