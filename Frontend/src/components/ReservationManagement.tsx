import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Calendar, Clock, Users, MapPin, Phone, User, 
  CheckCircle, AlertCircle, Edit3, X, Trash2, 
  Star, TreePine, Home, Eye, RefreshCw
} from 'lucide-react';
import apiService from '../services/api.service';
import { Reservation, UpdateReservationData } from '../types/api.types';
import Navbar from './Navbar';
import Footer from './Footer';
import './ReservationManagement.css';

const ReservationManagement: React.FC = () => {
  const { customer } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingReservation, setEditingReservation] = useState<number | null>(null);
  const [cancellingReservation, setCancellingReservation] = useState<number | null>(null);

  // Editing form state
  const [editForm, setEditForm] = useState({
    guest_count: 2,
    special_requests: '',
    contact_name: '',
    contact_phone: ''
  });

  const handleModalClose = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCancellingReservation(null);
  }, []);

  const handleCancelClick = useCallback((e: React.MouseEvent, reservationId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCancellingReservation(reservationId);
  }, []);

  const loadReservations = useCallback(async () => {
    if (!customer) return;
    try {
      setLoading(true);
      const response = await apiService.getReservations({
        customer_id: customer.customer_id
      });
      setReservations(response.results || []);
    } catch (err: any) {
      setError('Failed to load reservations');
      console.error('Error loading reservations:', err);
    } finally {
      setLoading(false);
    }
  }, [customer]);

  useEffect(() => {
    if (customer) {
      loadReservations();
    }
  }, [customer, loadReservations]);

  // Prevent body scroll when modal is open and handle escape key
  useEffect(() => {
    const body = document.body;
    if (cancellingReservation) {
      body.style.overflow = 'hidden';
      
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          handleModalClose();
        }
      };

      document.addEventListener('keydown', handleEscape);
      
      return () => {
        body.style.overflow = 'unset';
        document.removeEventListener('keydown', handleEscape);
      };
    } else {
      body.style.overflow = 'unset';
    }
  }, [cancellingReservation, handleModalClose]);

  const getLocationIcon = (location: string) => {
    switch (location) {
      case 'indoor': return <Home className="w-4 h-4" />;
      case 'outdoor': return <TreePine className="w-4 h-4" />;
      case 'window': return <Eye className="w-4 h-4" />;
      case 'private': return <Star className="w-4 h-4" />;
      default: return <Home className="w-4 h-4" />;
    }
  };

  const getLocationColor = (location: string) => {
    switch (location) {
      case 'indoor': return '#3b82f6';
      case 'outdoor': return '#10b981';
      case 'window': return '#f59e0b';
      case 'private': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      case 'completed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const canEditReservation = (reservation: Reservation) => {
    const reservationDateTime = new Date(`${reservation.reservation_date}T${reservation.start_time}`);
    const now = new Date();
    const timeDiff = reservationDateTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);
    
    // More permissive for testing - allow editing if upcoming and confirmed/pending
    return hoursDiff > -24 && ['confirmed', 'pending'].includes(reservation.status); 
  };

  const canCancelReservation = (reservation: Reservation) => {
    const reservationDateTime = new Date(`${reservation.reservation_date}T${reservation.start_time}`);
    const now = new Date();
    const timeDiff = reservationDateTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);
    
    // More permissive for testing - allow canceling if upcoming and not already cancelled
    return hoursDiff > -24 && ['confirmed', 'pending'].includes(reservation.status);
  };

  const startEdit = (reservation: Reservation) => {
    setEditingReservation(reservation.reservation_id);
    setEditForm({
      guest_count: reservation.guest_count,
      special_requests: reservation.special_requests || '',
      contact_name: reservation.contact_name,
      contact_phone: reservation.contact_phone
    });
  };

  const cancelEdit = () => {
    setEditingReservation(null);
    setEditForm({
      guest_count: 2,
      special_requests: '',
      contact_name: '',
      contact_phone: ''
    });
  };

  const saveEdit = async (reservationId: number) => {
    const originalReservation = reservations.find(r => r.reservation_id === reservationId);

    if (!originalReservation) {
      setError('Could not find the reservation to update.');
      return;
    }

    if (editForm.guest_count > originalReservation.table.capacity) {
      setError(
        `The selected party size of ${editForm.guest_count} exceeds the capacity of ` +
        `Table ${originalReservation.table.table_number} (max ${originalReservation.table.capacity} guests). ` +
        'Please choose a smaller party size or cancel and rebook for a larger table.'
      );
      return;
    }

    try {
      setLoading(true);
      const updateData: UpdateReservationData = {
        guest_count: editForm.guest_count,
        special_requests: editForm.special_requests,
        contact_name: editForm.contact_name,
        contact_phone: editForm.contact_phone
      };

      await apiService.updateReservation(reservationId, updateData);
      setSuccess('Reservation updated successfully!');
      setEditingReservation(null);
      await loadReservations(); // Reload to get updated data
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update reservation');
    } finally {
      setLoading(false);
    }
  };

  const confirmCancel = useCallback(async (reservationId: number) => {
    try {
      setLoading(true);
      await apiService.cancelReservation(reservationId, true);
      setSuccess('Reservation cancelled successfully!');
      setCancellingReservation(null);
      await loadReservations(); // Reload to get updated data
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel reservation');
    } finally {
      setLoading(false);
    }
  }, [loadReservations]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const isUpcoming = (reservation: Reservation) => {
    const reservationDateTime = new Date(`${reservation.reservation_date}T${reservation.start_time}`);
    return reservationDateTime > new Date();
  };

  const upcomingReservations = reservations.filter(isUpcoming);
  const pastReservations = reservations.filter(r => !isUpcoming(r));

  if (loading && reservations.length === 0) {
    return (
      <div className="reservation-management loading">
        <div className="loading-spinner">
          <RefreshCw className="w-8 h-8 animate-spin text-green-500" />
          <p>Loading your reservations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reservation-management">
      <Navbar />
      {/* Hero Section */}
      <section className="management-hero">
        <div className="management-container">
          <div className="management-header">
            <h2>My Reservations</h2>
            <p>Manage your table reservations</p>
            <button onClick={loadReservations} className="refresh-btn" disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="management-content">

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

      {/* Upcoming Reservations */}
      {upcomingReservations.length > 0 && (
        <div className="reservations-section">
          <h3>Upcoming Reservations</h3>
          <div className="reservations-grid">
            {upcomingReservations.map((reservation) => (
              <div key={reservation.reservation_id} className="reservation-card upcoming">
                <div className="reservation-header">
                  <div className="reservation-status">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(reservation.status) }}
                    >
                      {reservation.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="reservation-actions">
                    {canEditReservation(reservation) ? (
                      <button
                        onClick={() => startEdit(reservation)}
                        className="action-btn edit-btn"
                        title="Edit Reservation"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="action-disabled" title="Cannot edit this reservation">
                        <Edit3 className="w-4 h-4" />
                      </span>
                    )}
                    {canCancelReservation(reservation) ? (
                      <button
                        onClick={(e) => handleCancelClick(e, reservation.reservation_id)}
                        className="action-btn cancel-btn"
                        title="Cancel Reservation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="action-disabled" title="Cannot cancel this reservation">
                        <Trash2 className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                </div>

                <div className="reservation-details">
                  <div className="detail-row">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(reservation.reservation_date)}</span>
                  </div>
                  <div className="detail-row">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(reservation.start_time)} - {formatTime(reservation.end_time)}</span>
                  </div>
                  <div className="detail-row">
                    <MapPin className="w-4 h-4" />
                    <span className="table-info">
                      {getLocationIcon(reservation.table.location)}
                      Table {reservation.table.table_number} - {reservation.table.location_display}
                    </span>
                  </div>
                  <div className="detail-row">
                    <Users className="w-4 h-4" />
                    <span>{reservation.guest_count} guests</span>
                  </div>
                  {reservation.special_requests && (
                    <div className="special-requests">
                      <strong>Special Requests:</strong> {reservation.special_requests}
                    </div>
                  )}
                </div>

                {/* Edit Form */}
                {editingReservation === reservation.reservation_id && (
                  <div className="edit-form">
                    <h4>Edit Reservation</h4>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Party Size</label>
                        <select
                          value={editForm.guest_count}
                          onChange={(e) => setEditForm(prev => ({
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
                      <div className="form-group">
                        <label>Contact Name</label>
                        <input
                          type="text"
                          value={editForm.contact_name}
                          onChange={(e) => setEditForm(prev => ({
                            ...prev,
                            contact_name: e.target.value
                          }))}
                          className="form-input"
                        />
                      </div>
                      <div className="form-group">
                        <label>Phone Number</label>
                        <input
                          type="tel"
                          value={editForm.contact_phone}
                          onChange={(e) => setEditForm(prev => ({
                            ...prev,
                            contact_phone: e.target.value
                          }))}
                          className="form-input"
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Special Requests</label>
                      <textarea
                        value={editForm.special_requests}
                        onChange={(e) => setEditForm(prev => ({
                          ...prev,
                          special_requests: e.target.value
                        }))}
                        className="form-textarea"
                        rows={3}
                        placeholder="Any special requests..."
                      />
                    </div>
                    <div className="form-actions">
                      <button onClick={cancelEdit} className="btn-secondary">
                        Cancel
                      </button>
                      <button 
                        onClick={() => saveEdit(reservation.reservation_id)}
                        className="btn-primary"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Reservations */}
      {pastReservations.length > 0 && (
        <div className="reservations-section">
          <h3>Past Reservations</h3>
          <div className="reservations-grid">
            {pastReservations.slice(0, 6).map((reservation) => (
              <div key={reservation.reservation_id} className="reservation-card past">
                <div className="reservation-header">
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(reservation.status) }}
                  >
                    {reservation.status.toUpperCase()}
                  </span>
                </div>

                <div className="reservation-details">
                  <div className="detail-row">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(reservation.reservation_date)}</span>
                  </div>
                  <div className="detail-row">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(reservation.start_time)} - {formatTime(reservation.end_time)}</span>
                  </div>
                  <div className="detail-row">
                    <MapPin className="w-4 h-4" />
                    <span className="table-info">
                      {getLocationIcon(reservation.table.location)}
                      Table {reservation.table.table_number} - {reservation.table.location_display}
                    </span>
                  </div>
                  <div className="detail-row">
                    <Users className="w-4 h-4" />
                    <span>{reservation.guest_count} guests</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Reservations */}
      {reservations.length === 0 && !loading && (
        <div className="no-reservations">
          <Calendar className="w-16 h-16 text-gray-400" />
          <h3>No Reservations Found</h3>
          <p>You haven't made any reservations yet.</p>
          <button 
            onClick={() => window.location.href = '/reservations'}
            className="btn-primary"
          >
            Make a Reservation
          </button>
        </div>
      )}

      </div> {/* Close management-content */}

      {/* Cancel Confirmation Modal */}
      {cancellingReservation && (
        <div 
          className="modal-overlay" 
          onClick={handleModalClose}
        >
          <div 
            className="modal-content" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <div className="modal-header">
              <h3>Cancel Reservation</h3>
              <button 
                onClick={handleModalClose} 
                className="modal-close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to cancel this reservation? This action cannot be undone.</p>
              <div className="modal-actions">
                <button 
                  onClick={handleModalClose}
                  className="btn-secondary"
                >
                  Keep Reservation
                </button>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    confirmCancel(cancellingReservation);
                  }}
                  className="btn-danger"
                >
                  Cancel Reservation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
     
     <Footer />
    </div>
  );
};

export default ReservationManagement; 