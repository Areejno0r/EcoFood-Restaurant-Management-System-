import React from 'react';
import './reservation.css';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

function Reservation() {
  const navigate = useNavigate();

  return (
    <div>
      <nav className="navbar">
        <div className="container">
          <h1 className="logo">EcoFood</h1>
          <div className="nav-links">
            <Link className="nav-link" to="/#home">Home</Link>
            <Link className="nav-link" to="/#menu">Menu</Link>
            <Link className="nav-link" to="/#Sign-up">Sign up</Link>
          </div>
        </div>
      </nav>
      {/* Hero Section */}
      <section className="hero-section">
        <style>
          {`
            .hero-section {
              background-image: url(https://static.vecteezy.com/system/resources/previews/008/168/371/non_2x/table-served-with-luxury-glasses-cutlery-flowers-green-chairs-around-in-cozy-restaurant-nobody-in-shot-decorated-table-for-festive-event-free-photo.jpg);
            }
          `}
        </style>
        <div className="hero-content">
          <h1>Book Your Table Now</h1>
          <p>Enjoy a unique dining experience in a wonderful atmosphere</p>
        </div>
      </section>

      {/* Booking Form Container */}
      <div className="container">
        <div className="booking-form">
          <h2 className="form-title">Table Reservation</h2>

          <div className="form-info">
            <h3>Important Information:</h3>
            <p>• Please make a reservation at least 24 hours in advance</p>
            <p>• Working hours: Daily from 12:00 PM to 11:00 PM</p>
            <p>• For large groups (more than 8 people), please contact us directly</p>
          </div>

          <form id="booking-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input type="text" id="name" className="form-control" placeholder="Enter your full name" required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input type="tel" id="phone" className="form-control" placeholder="09xxxxxxxx" required />
              </div>
    
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="date">Reservation Date</label>
                <input type="date" id="date" className="form-control" required />
              </div>
              <div className="form-group">
                <label htmlFor="time">Reservation Time</label>
                <select id="time" className="form-control" required>
                  <option value="">Select Time</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="12:30">12:30 PM</option>
                  <option value="13:00">01:00 PM</option>
                  <option value="13:30">01:30 PM</option>
                  <option value="14:00">02:00 PM</option>
                  <option value="14:30">02:30 PM</option>
                  <option value="15:00">03:00 PM</option>
                  <option value="15:30">03:30 PM</option>
                  <option value="16:00">04:00 PM</option>
                  <option value="16:30">04:30 PM</option>
                  <option value="17:00">05:00 PM</option>
                  <option value="17:30">05:30 PM</option>
                  <option value="18:00">06:00 PM</option>
                  <option value="18:30">06:30 PM</option>
                  <option value="19:00">07:00 PM</option>
                  <option value="19:30">07:30 PM</option>
                  <option value="20:00">08:00 PM</option>
                  <option value="20:30">08:30 PM</option>
                  <option value="21:00">09:00 PM</option>
                  <option value="21:30">09:30 PM</option>
                  <option value="22:00">10:00 PM</option>
                  <option value="22:30">10:30 PM</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="guests">Number of Guests</label>
                <select id="guests" className="form-control" required>
                  <option value="">Select Number of Guests</option>
                  <option value="1">One Person</option>
                  <option value="2">Two Persons</option>
                  <option value="3">Three Persons</option>
                  <option value="4">Four Persons</option>
                  <option value="5">Five Persons</option>
                  <option value="6">Six Persons</option>
                  <option value="7">Seven Persons</option>
                  <option value="8">Eight Persons</option>
                  <option value="more">More than 8 Persons</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="occasion">Occasion Type</label>
                <select id="occasion" className="form-control">
                  <option value="">Select Occasion Type (Optional)</option>
                  <option value="birthday">Birthday</option>
                  <option value="anniversary">Anniversary</option>
                  <option value="business">Business Dinner</option>
                  <option value="romantic">Romantic Date</option>
                  <option value="family">Family Gathering</option>
                  <option value="celebration">Celebration</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="special-requests">Special Requests</label>
              <textarea
                id="special-requests"
                className="form-control special-requests"
                placeholder="Any special requests or notes (e.g., table location, preferred food type, food allergies, etc.)"
                rows={4}
              ></textarea>
            </div>

            <button type="button" className="btn-submit" onClick={() => navigate('/sign-up')}>
              Book Now
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; 2024 EcoFood. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Reservation;
