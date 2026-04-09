from restaurant.repositories.reservation_repository import ReservationRepository
from django.utils import timezone
from django.core.exceptions import ValidationError
from datetime import datetime, timedelta

class ReservationBusinessLogic:
    def __init__(self):
        self.repo = ReservationRepository()

    def create_reservation(self, customer, table_id, reservation_date, start_time, end_time, 
                          guest_count, contact_name, contact_phone, special_requests=None, notes=None):
        """Create a new reservation with business validation"""
        from restaurant.models.table import Table
        
        # Business validations
        self._validate_reservation_data(reservation_date, start_time, end_time, guest_count)
        
        # Get table and validate capacity
        try:
            table = Table.objects.get(table_id=table_id)
        except Table.DoesNotExist:
            raise ValidationError("Table not found")
        
        if guest_count > table.capacity:
            raise ValidationError(f"Guest count ({guest_count}) exceeds table capacity ({table.capacity})")
        
        # Check table availability
        if not self._is_table_available(table_id, reservation_date, start_time, end_time):
            raise ValidationError("Table is not available for the selected time slot")
        
        # Create reservation
        return self.repo.create(
            customer=customer,
            table=table,
            reservation_date=reservation_date,
            start_time=start_time,
            end_time=end_time,
            guest_count=guest_count,
            contact_name=contact_name,
            contact_phone=contact_phone,
            special_requests=special_requests,
            notes=notes
        )

    def confirm_reservation(self, reservation_id, confirmed_by=None):
        """Confirm a reservation with business rules"""
        reservation = self.repo.get_by_id(reservation_id)
        
        # Validate business rules for confirmation
        if reservation.status != 'pending':
            raise ValidationError(f"Cannot confirm reservation with status '{reservation.status}'")
        
        # Check if still within valid time (e.g., not too close to reservation time)
        now = timezone.now()
        reservation_datetime = datetime.combine(reservation.reservation_date, reservation.start_time)
        reservation_datetime = timezone.make_aware(reservation_datetime)
        
        # Allow confirmation up to 30 minutes before reservation
        if reservation_datetime - now < timedelta(minutes=30):
            raise ValidationError("Cannot confirm reservation less than 30 minutes before scheduled time")
        
        return self.repo.confirm_reservation(reservation_id)

    def check_in_customer(self, reservation_id, checked_in_by=None):
        """Check in customer with business validation"""
        reservation = self.repo.get_by_id(reservation_id)
        
        if reservation.status != 'confirmed':
            raise ValidationError(f"Cannot check in reservation with status '{reservation.status}'")
        
        # Check if it's the right day and within acceptable time window
        now = timezone.now()
        today = now.date()
        
        if reservation.reservation_date != today:
            raise ValidationError("Can only check in on the reservation date")
        
        # Allow check-in 15 minutes before and 30 minutes after scheduled time
        reservation_time = datetime.combine(today, reservation.start_time)
        reservation_time = timezone.make_aware(reservation_time)
        
        time_diff = now - reservation_time
        if time_diff < timedelta(minutes=-15):
            raise ValidationError("Check-in is not available yet (too early)")
        elif time_diff > timedelta(minutes=30):
            raise ValidationError("Check-in window has expired")
        
        return self.repo.check_in(reservation_id)

    def complete_reservation(self, reservation_id):
        """Complete a reservation"""
        reservation = self.repo.get_by_id(reservation_id)
        
        if reservation.status != 'checked_in':
            raise ValidationError(f"Cannot complete reservation with status '{reservation.status}'")
        
        return self.repo.complete_reservation(reservation_id)

    def cancel_reservation(self, reservation_id, cancelled_by=None, reason=None):
        """Cancel a reservation with business rules"""
        reservation = self.repo.get_by_id(reservation_id)
        
        if reservation.status not in ['pending', 'confirmed']:
            raise ValidationError(f"Cannot cancel reservation with status '{reservation.status}'")
        
        # Check cancellation policy (e.g., must cancel at least 2 hours before)
        now = timezone.now()
        reservation_datetime = datetime.combine(reservation.reservation_date, reservation.start_time)
        reservation_datetime = timezone.make_aware(reservation_datetime)
        
        if reservation_datetime - now < timedelta(hours=2):
            raise ValidationError("Reservations must be cancelled at least 2 hours in advance")
        
        return self.repo.cancel_reservation(reservation_id)

    def mark_no_show(self, reservation_id):
        """Mark reservation as no-show with business validation"""
        reservation = self.repo.get_by_id(reservation_id)
        
        if reservation.status != 'confirmed':
            raise ValidationError(f"Cannot mark as no-show with status '{reservation.status}'")
        
        # Check if enough time has passed after reservation time
        now = timezone.now()
        reservation_datetime = datetime.combine(reservation.reservation_date, reservation.start_time)
        reservation_datetime = timezone.make_aware(reservation_datetime)
        
        if now - reservation_datetime < timedelta(minutes=15):
            raise ValidationError("Must wait at least 15 minutes after reservation time to mark as no-show")
        
        return self.repo.mark_no_show(reservation_id)

    def modify_reservation(self, reservation_id, **changes):
        """Modify reservation with business validation"""
        reservation = self.repo.get_by_id(reservation_id)
        
        if reservation.status not in ['pending', 'confirmed']:
            raise ValidationError(f"Cannot modify reservation with status '{reservation.status}'")
        
        # Validate changes
        if 'reservation_date' in changes or 'start_time' in changes or 'end_time' in changes:
            new_date = changes.get('reservation_date', reservation.reservation_date)
            new_start = changes.get('start_time', reservation.start_time)
            new_end = changes.get('end_time', reservation.end_time)
            
            self._validate_reservation_data(new_date, new_start, new_end, 
                                          changes.get('guest_count', reservation.guest_count))
            
            # Check availability for new time slot
            if not self._is_table_available(reservation.table.table_id, new_date, new_start, new_end, reservation.reservation_id):
                raise ValidationError("Table is not available for the new time slot")
        
        return self.repo.update_reservation(reservation_id, **changes)

    def find_available_tables(self, reservation_date, start_time, end_time, guest_count):
        """Find available tables with business logic"""
        self._validate_reservation_data(reservation_date, start_time, end_time, guest_count)
        return self.repo.get_available_tables(reservation_date, start_time, end_time, guest_count)

    def get_customer_reservations(self, customer_id, include_cancelled=False):
        """Get customer reservations with filtering"""
        reservations = self.repo.get_by_customer(customer_id)
        
        if not include_cancelled:
            reservations = reservations.exclude(status='cancelled')
        
        return reservations.order_by('reservation_date', 'start_time')

    def get_upcoming_reservations(self, days_ahead=7):
        """Get upcoming reservations within specified days"""
        end_date = timezone.now().date() + timedelta(days=days_ahead)
        return self.repo.get_by_date_range(timezone.now().date(), end_date).filter(
            status__in=['confirmed', 'pending']
        )

    def get_restaurant_schedule(self, date):
        """Get all reservations for a specific date with occupancy info"""
        reservations = self.repo.get_by_date(date)
        
        # Group by time slots and calculate occupancy
        schedule = {}
        for reservation in reservations:
            time_slot = reservation.start_time.strftime('%H:%M')
            if time_slot not in schedule:
                schedule[time_slot] = {
                    'reservations': [],
                    'total_guests': 0,
                    'tables_occupied': 0
                }
            
            schedule[time_slot]['reservations'].append(reservation)
            schedule[time_slot]['total_guests'] += reservation.guest_count
            schedule[time_slot]['tables_occupied'] += 1
        
        return schedule

    def _validate_reservation_data(self, reservation_date, start_time, end_time, guest_count):
        """Private method to validate basic reservation data"""
        from datetime import time
        
        # Validate date is not in the past
        if reservation_date < timezone.now().date():
            raise ValidationError("Reservation date cannot be in the past")
        
        # Validate time order
        if start_time >= end_time:
            raise ValidationError("Start time must be before end time")
        
        # Validate guest count
        if guest_count <= 0:
            raise ValidationError("Guest count must be positive")
        
        # Validate operating hours (10:00 AM to 11:00 PM)
        if start_time < time(10, 0) or start_time >= time(23, 0):
            raise ValidationError("Reservations must be between 10:00 AM and 11:00 PM")
        
        if end_time > time(23, 30):
            raise ValidationError("Reservations must end by 11:30 PM")

    def _is_table_available(self, table_id, reservation_date, start_time, end_time, exclude_reservation_id=None):
        """Private method to check table availability"""
        return self.repo.check_table_availability(table_id, reservation_date, start_time, end_time, exclude_reservation_id) 