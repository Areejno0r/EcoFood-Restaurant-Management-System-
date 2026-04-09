import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Clock, Users, MapPin, Phone, User, 
  CheckCircle, AlertCircle, Search, Filter, 
  RotateCcw, Eye, Edit3, X, Star, Heart,
  Utensils, Wifi, Car, Music, TreePine, Home
} from 'lucide-react';
import apiService from './services/api.service';
import {
  Table,
  Reservation,
  CreateReservationData,
  AvailabilityResponse,
  ReservationAvailabilityRequest,
  TablesLayoutResponse,
  ReservationResponse
} from './types/api.types';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import RestaurantLayout from './components/RestaurantLayout';
import './Reservations.css';

// Helper function to get table features
const getTableFeatures = (location: string): string[] => {
  switch (location) {
    case 'indoor':
      return ['Air Conditioning', 'Comfortable Seating', 'Wi-Fi', 'Background Music', 'Privacy'];
    case 'outdoor':
      return ['Fresh Air', 'Garden View', 'Natural Light', 'Romantic Ambiance', 'Al Fresco Dining'];
    case 'window':
      return ['Street View', 'Natural Light', 'People Watching', 'Cozy Atmosphere', 'City Views'];
    case 'private':
      return ['Complete Privacy', 'Dedicated Service', 'Custom Music', 'Special Occasions', 'VIP Treatment'];
    default:
      return ['Comfortable Seating', 'Great Service', 'Perfect Ambiance'];
  }
};

interface ReservationStep {
  id: number;
  title: string;
  icon: React.ReactNode;
  completed: boolean;
  active: boolean;
}

interface LocationFeatures {
  [key: string]: {
    name: string;
    icon: React.ReactNode;
    features: string[];
    color: string;
  };
}

export default function Reservations() {
  const { isAuthenticated, customer } = useAuth();
  const navigate = useNavigate();

  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form data
  const [reservationData, setReservationData] = useState<Partial<CreateReservationData>>({
    guest_count: 2,
    special_requests: '',
    contact_name: customer?.full_name || '',
    contact_phone: customer?.phone || ''
  });

  // Availability data
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(120); // 2 hours default
  const [availableTables, setAvailableTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [alternativeTimes, setAlternativeTimes] = useState<any[]>([]);
  const [tablesLayout, setTablesLayout] = useState<TablesLayoutResponse | null>(null);
  const [locationPreference, setLocationPreference] = useState<string>('any');

  // UI state
  const [animatingStep, setAnimatingStep] = useState(false);
  const [availabilityChecked, setAvailabilityChecked] = useState(false);

  // Location features configuration
  const locationFeatures: LocationFeatures = {
    indoor: {
      name: 'Indoor Dining',
      icon: <Home className="w-5 h-5" />,
      features: ['Air Conditioning', 'Comfortable Seating', 'Wi-Fi', 'Background Music'],
      color: '#3b82f6'
    },
    outdoor: {
      name: 'Outdoor Terrace',
      icon: <TreePine className="w-5 h-5" />,
      features: ['Fresh Air', 'Garden View', 'Natural Light', 'Romantic Ambiance'],
      color: '#10b981'
    },
    window: {
      name: 'Window Side',
      icon: <Eye className="w-5 h-5" />,
      features: ['Street View', 'Natural Light', 'People Watching', 'Cozy Atmosphere'],
      color: '#f59e0b'
    },
    private: {
      name: 'Private Room',
      icon: <Star className="w-5 h-5" />,
      features: ['Complete Privacy', 'Dedicated Service', 'Custom Music', 'Special Occasions'],
      color: '#8b5cf6'
    }
  };

  // Steps configuration - fixed completion logic
  const steps: ReservationStep[] = [
    {
      id: 1,
      title: 'Date & Time',
      icon: <Calendar className="w-5 h-5" />,
      completed: currentStep > 1 && !!(selectedDate && selectedTime && availableTables.length > 0),
      active: currentStep === 1
    },
    {
      id: 2,
      title: 'Select Table',
      icon: <MapPin className="w-5 h-5" />,
      completed: currentStep > 2 && !!selectedTable,
      active: currentStep === 2
    },
    {
      id: 3,
      title: 'Your Details',
      icon: <User className="w-5 h-5" />,
      completed: currentStep > 3 && !!(reservationData.contact_name && reservationData.contact_phone),
      active: currentStep === 3
    },
    {
      id: 4,
      title: 'Confirmation',
      icon: <CheckCircle className="w-5 h-5" />,
      completed: currentStep === 4 && !!success,
      active: currentStep === 4
    }
  ];

  // Initialize customer data when authenticated
  useEffect(() => {
    if (isAuthenticated && customer) {
      setReservationData(prev => ({
        ...prev,
        contact_name: customer.full_name,
        contact_phone: customer.phone
      }));
    }
  }, [isAuthenticated, customer]);

  const loadTablesLayout = async () => {
    try {
      const layout = await apiService.getTablesLayout();
      setTablesLayout(layout);
    } catch (err) {
      console.error('Failed to load tables layout:', err);
    }
  };

  const checkAvailability = useCallback(async () => {
    if (!selectedDate || !selectedTime || !reservationData.guest_count) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setSelectedTable(null); // Clear previous table selection when checking new availability

    try {
      const endTime = calculateEndTime(selectedTime, selectedDuration);
      
      const request: ReservationAvailabilityRequest = {
        date: selectedDate,
        start_time: selectedTime,
        end_time: endTime,
        guest_count: reservationData.guest_count,
        location_preference: locationPreference === 'any' ? 'any' : locationPreference as 'indoor' | 'outdoor' | 'window' | 'private'
      };

      const response: AvailabilityResponse = await apiService.checkReservationAvailability(request);
      
      if (response.success) {
        setAvailableTables(response.available_tables);
        setAlternativeTimes([]);
        if (response.available_tables.length > 0) {
          setAvailabilityChecked(true);
        } else {
          setAvailabilityChecked(false);
        }
      } else {
        setAvailableTables([]);
        setAlternativeTimes(response.alternative_times || []);
        setError(response.message);
        setAvailabilityChecked(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to check availability');
      setAvailableTables([]);
      setAlternativeTimes([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedTime, selectedDuration, reservationData.guest_count, locationPreference]);

  // Load tables layout on component mount
  useEffect(() => {
    loadTablesLayout();
  }, []);

  // Close any potential state when step changes
  useEffect(() => {
    if (currentStep !== 2) {
      // Clear any table selection state if needed
    }
  }, [currentStep]);



  const calculateEndTime = (startTime: string, duration: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + duration;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };

  const selectTable = (table: Table) => {
    setSelectedTable(table);
    setReservationData(prev => ({
      ...prev,
      table_id: table.table_id
    }));
  };

  const submitReservation = async () => {
    if (!selectedTable || !selectedDate || !selectedTime || !reservationData.contact_name || !reservationData.contact_phone) {
      setError('Please complete all required fields');
      return;
    }

    if (!isAuthenticated) {
      // Redirect to sign up with reservation data stored
      localStorage.setItem('pendingReservation', JSON.stringify({
        ...reservationData,
        date: selectedDate,
        time: selectedTime,
        duration: selectedDuration,
        table_id: selectedTable.table_id
      }));
      navigate('/sign-up');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const endTime = calculateEndTime(selectedTime, selectedDuration);
      
      const reservationRequest: CreateReservationData = {
        customer_id: customer!.customer_id,
        table_id: selectedTable.table_id,
        reservation_date: selectedDate,
        start_time: selectedTime,
        end_time: endTime,
        guest_count: reservationData.guest_count!,
        special_requests: reservationData.special_requests,
        contact_name: reservationData.contact_name!,
        contact_phone: reservationData.contact_phone!
      };

      const response: ReservationResponse = await apiService.createReservation(reservationRequest);
      
      if (response.success) {
        setSuccess('Reservation confirmed successfully! You will receive an SMS confirmation shortly.');
        setCurrentStep(4);
        // Reset form after successful submission
        setTimeout(() => {
          resetForm();
        }, 5000);
      } else {
        setError(response.message || 'Failed to create reservation');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create reservation');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedDate('');
    setSelectedTime('');
    setSelectedTable(null);
    setAvailableTables([]);
    setAlternativeTimes([]);
    setError(null);
    setSuccess(null);
    setReservationData({
      guest_count: 2,
      special_requests: '',
      contact_name: customer?.full_name || '',
      contact_phone: customer?.phone || ''
    });
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setAnimatingStep(true);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setAnimatingStep(false);
      }, 200);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setAnimatingStep(true);
      setTimeout(() => {
        if (currentStep === 2) {
          setSelectedTable(null);
          setAvailableTables([]);
          setAlternativeTimes([]);
          setAvailabilityChecked(false);
        }
        setCurrentStep(currentStep - 1);
        setAnimatingStep(false);
      }, 200);
    }
  };

  return (
    <div className="reservations-page">
      <Navbar />
      
      {/* Hero Section with 3D Effect */}
      <section className="reservation-hero">
        <div className="hero-background">
          <div className="floating-elements">
            <div className="floating-plate"></div>
            <div className="floating-utensils"></div>
            <div className="floating-glass"></div>
          </div>
        </div>
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Reserve Your <span className="gradient-text">Perfect Table</span>
            </h1>
            <p className="hero-subtitle">
              Experience exceptional dining in a wonderful atmosphere
            </p>
            {isAuthenticated && (
              <div className="hero-actions">
                <button 
                  onClick={() => navigate('/my-reservations')}
                  className="btn-secondary hero-link-btn"
                >
                  <Clock className="w-5 h-5" />
                  View My Reservations
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Progress Steps */}
      <section className="steps-section">
        <div className="container">
          <div className="steps-container">
            {steps.map((step, index) => (
              <div key={step.id} className={`step ${step.active ? 'active' : ''} ${step.completed ? 'completed' : ''}`}>
                <div className="step-icon">
                  {step.completed ? <CheckCircle className="w-6 h-6" /> : step.icon}
                </div>
                <span className="step-title">{step.title}</span>
                {index < steps.length - 1 && <div className="step-connector"></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="reservation-content">
        <div className="container">
          <div className={`step-content ${animatingStep ? 'animating' : ''}`}>
            
            {/* Step 1: Date & Time Selection */}
            {currentStep === 1 && (
              <div className="step-panel date-time-panel">
                <h2 className="panel-title">Choose Your Date & Time</h2>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Time</label>
                    <select
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="form-input"
                    >
                      <option value="">Select Time</option>
                      {Array.from({ length: 26 }, (_, i) => {
                        const hour = Math.floor(10 + i / 2);
                        const minute = i % 2 === 0 ? '00' : '30';
                        if (hour >= 23) return null;
                        const time = `${hour.toString().padStart(2, '0')}:${minute}`;
                        const displayTime = new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        });
                        return (
                          <option key={time} value={time}>
                            {displayTime}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Duration</label>
                    <select
                      value={selectedDuration}
                      onChange={(e) => setSelectedDuration(Number(e.target.value))}
                      className="form-input"
                    >
                      <option value={90}>1.5 hours</option>
                      <option value={120}>2 hours</option>
                      <option value={150}>2.5 hours</option>
                      <option value={180}>3 hours</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Party Size</label>
                    <select
                      value={reservationData.guest_count || ''}
                      onChange={(e) => setReservationData(prev => ({
                        ...prev,
                        guest_count: Number(e.target.value)
                      }))}
                      className="form-input"
                    >
                      {Array.from({ length: 20 }, (_, i) => i + 1).map(count => (
                        <option key={count} value={count}>
                          {count} {count === 1 ? 'guest' : 'guests'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Location Preference */}
                <div className="location-preference">
                  <h3>Preferred Location</h3>
                  <div className="location-grid">
                    <div
                      className={`location-card ${locationPreference === 'any' ? 'selected' : ''}`}
                      onClick={() => setLocationPreference('any')}
                    >
                      <MapPin className="w-6 h-6" />
                      <span>Any Location</span>
                    </div>
                    {Object.entries(locationFeatures).map(([key, location]) => (
                      <div
                        key={key}
                        className={`location-card ${locationPreference === key ? 'selected' : ''}`}
                        onClick={() => setLocationPreference(key)}
                      >
                        {location.icon}
                        <span>{location.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="step-1-actions">
                  <button
                    onClick={checkAvailability}
                    disabled={!selectedDate || !selectedTime || !reservationData.guest_count || loading}
                    className="btn-primary btn-large check-availability-btn"
                  >
                    {loading ? (
                      <>
                        <RotateCcw className="w-5 h-5 animate-spin" />
                        Checking Availability...
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5" />
                        Check Availability
                      </>
                    )}
                  </button>

                  {availabilityChecked && availableTables.length > 0 && (
                    <button
                      onClick={nextStep}
                      className="btn-primary btn-large proceed-btn"
                      disabled={loading}
                    >
                      <CheckCircle className="w-5 h-5" />
                      Proceed to Select Table ({availableTables.length} found)
                    </button>
                  )}


                </div>

                {/* Alternative Times */}
                {alternativeTimes.length > 0 && (
                  <div className="alternative-times">
                    <h3>Alternative Available Times</h3>
                    <div className="time-slots">
                      {alternativeTimes.map((alt, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSelectedTime(alt.start_time.substring(0, 5));
                            checkAvailability();
                          }}
                          className="time-slot"
                        >
                          <Clock className="w-4 h-4" />
                          {alt.start_time} - {alt.end_time}
                          <span className="available-count">
                            {alt.available_tables_count} tables
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Table Selection */}
            {currentStep === 2 && (
              <div className="step-panel table-selection-panel">
                <h2 className="panel-title">Select Your Table</h2>
                
                {availableTables.length > 0 ? (
                  <>
                    {/* 3D Restaurant Layout */}
                    <RestaurantLayout
                      availableTables={availableTables}
                      selectedTable={selectedTable}
                      onTableSelect={selectTable}
                      disableInternalModal={true}
                    />
                    
                    {/* Selection Summary */}
                    {selectedTable && (
                      <div className="table-selection-summary">
                        <div className="selection-header">
                          <CheckCircle className="w-6 h-6 text-green-500" />
                          <h3>Table Selected!</h3>
                        </div>
                        <div className="selection-details">
                          <div className="selected-table-preview">
                                                         <div 
                               className="selected-location-badge"
                               style={{ backgroundColor: locationFeatures[selectedTable.location]?.color }}
                             >
                               {locationFeatures[selectedTable.location]?.icon}
                               {selectedTable.location_display}
                             </div>
                            <div className="selected-table-info">
                              <strong>Table {selectedTable.table_number}</strong>
                              <span>Up to {selectedTable.capacity} guests</span>
                            </div>
                          </div>
                          <p className="selection-note">
                            Perfect! Your table is reserved. Click "Continue" below to proceed with your details.
                          </p>
                        </div>
                      </div>
                    )}

                  </>
                ) : (
                  <div className="no-tables">
                    <AlertCircle className="w-12 h-12 text-orange-500" />
                    <h3>No Tables Available</h3>
                    <p>Sorry, no tables are available for your selected time. Please try alternative times above.</p>
                  </div>
                )}

                <div className="step-actions">
                  <button onClick={prevStep} className="btn-secondary">
                    <RotateCcw className="w-4 h-4" />
                    Back to Date & Time
                  </button>
                  {selectedTable && (
                    <button onClick={nextStep} className="btn-primary">
                      <CheckCircle className="w-5 h-5" />
                      Continue with Table {selectedTable.table_number}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Contact Details */}
            {currentStep === 3 && (
              <div className="step-panel contact-panel">
                <h2 className="panel-title">Your Contact Information</h2>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      value={reservationData.contact_name || ''}
                      onChange={(e) => setReservationData(prev => ({
                        ...prev,
                        contact_name: e.target.value
                      }))}
                      placeholder="Enter your full name"
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input
                      type="tel"
                      value={reservationData.contact_phone || ''}
                      onChange={(e) => setReservationData(prev => ({
                        ...prev,
                        contact_phone: e.target.value
                      }))}
                      placeholder="09xxxxxxxx"
                      className="form-input"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Special Requests (Optional)</label>
                  <textarea
                    value={reservationData.special_requests || ''}
                    onChange={(e) => setReservationData(prev => ({
                      ...prev,
                      special_requests: e.target.value
                    }))}
                    placeholder="Any special requests or dietary requirements..."
                    rows={4}
                    className="form-textarea"
                  />
                </div>

                <div className="step-actions">
                  <button onClick={prevStep} className="btn-secondary">
                    Back
                  </button>
                  <button 
                    onClick={submitReservation}
                    disabled={!reservationData.contact_name || !reservationData.contact_phone || loading}
                    className="btn-primary"
                  >
                    {loading ? (
                      <>
                        <RotateCcw className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        {isAuthenticated ? 'Confirm Reservation' : 'Sign Up & Reserve'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {currentStep === 4 && (
              <div className="step-panel confirmation-panel">
                <div className="confirmation-success">
                  <CheckCircle className="w-16 h-16 text-green-500" />
                  <h2>Reservation Confirmed!</h2>
                  <p>Your table has been reserved successfully. You will receive an SMS confirmation shortly.</p>
                  
                  {selectedTable && (
                    <div className="reservation-summary">
                      <h3>Reservation Details</h3>
                      <div className="summary-item">
                        <Calendar className="w-5 h-5" />
                        <span>{new Date(selectedDate).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</span>
                      </div>
                      <div className="summary-item">
                        <Clock className="w-5 h-5" />
                        <span>{selectedTime} ({selectedDuration / 60} hours)</span>
                      </div>
                      <div className="summary-item">
                        <MapPin className="w-5 h-5" />
                        <span>Table {selectedTable.table_number} - {selectedTable.location_display}</span>
                      </div>
                      <div className="summary-item">
                        <Users className="w-5 h-5" />
                        <span>{reservationData.guest_count} guests</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="confirmation-actions">
                    <button onClick={resetForm} className="btn-primary">
                      Make Another Reservation
                    </button>
                    <button onClick={() => navigate('/')} className="btn-secondary">
                      Back to Home
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error & Success Messages */}
          {error && (
            <div className="alert alert-error">
              <AlertCircle className="w-5 h-5" />
              {error}
              <button onClick={() => setError(null)} className="alert-close">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <CheckCircle className="w-5 h-5" />
              {success}
              <button onClick={() => setSuccess(null)} className="alert-close">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </section>





      <Footer />
    </div>
  );
} 