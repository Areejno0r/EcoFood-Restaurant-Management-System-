from restaurant.models.reservation import Reservation
from django.core.exceptions import ObjectDoesNotExist
from django.utils import timezone
from django.db.models import Q

class ReservationRepository:
    def create(self, customer, table, reservation_date, start_time, end_time, guest_count, 
               contact_name, contact_phone, special_requests=None, notes=None):
        """Create a new reservation"""
        if guest_count <= 0:
            raise ValueError("Guest count must be positive")
        
        reservation = Reservation(
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
        reservation.save()
        return reservation

    def save(self, reservation):
        """Save reservation record (update or create)"""
        reservation.save()
        return reservation

    def get_by_id(self, reservation_id):
        """Get reservation by ID"""
        try:
            return Reservation.objects.select_related('customer', 'table').get(reservation_id=reservation_id)
        except ObjectDoesNotExist:
            raise ObjectDoesNotExist(f"Reservation with ID {reservation_id} not found")

    def get_by_customer(self, customer_id):
        """Get all reservations for a customer"""
        return Reservation.objects.select_related('customer', 'table').filter(customer__customer_id=customer_id)

    def get_by_table(self, table_id):
        """Get all reservations for a table"""
        return Reservation.objects.select_related('customer', 'table').filter(table__table_id=table_id)

    def get_by_date(self, date):
        """Get all reservations for a specific date"""
        return Reservation.objects.select_related('customer', 'table').filter(reservation_date=date)

    def get_by_date_range(self, start_date, end_date):
        """Get reservations within a date range"""
        return Reservation.objects.select_related('customer', 'table').filter(
            reservation_date__gte=start_date,
            reservation_date__lte=end_date
        )

    def get_upcoming_reservations(self):
        """Get all upcoming reservations"""
        now = timezone.now()
        today = now.date()
        current_time = now.time()
        
        return Reservation.objects.select_related('customer', 'table').filter(
            Q(reservation_date__gt=today) |
            Q(reservation_date=today, start_time__gt=current_time)
        ).filter(status__in=['confirmed', 'pending']).order_by('reservation_date', 'start_time')

    def get_today_reservations(self):
        """Get today's reservations"""
        today = timezone.now().date()
        return Reservation.objects.select_related('customer', 'table').filter(
            reservation_date=today
        ).order_by('start_time')

    def update_status(self, reservation_id, status):
        """Update reservation status"""
        reservation = self.get_by_id(reservation_id)
        reservation.status = status
        reservation.save()
        return reservation

    def delete(self, reservation_id):
        """Delete reservation by ID"""
        reservation = self.get_by_id(reservation_id)
        reservation.delete()
        return True

    def confirm_reservation(self, reservation_id):
        """Confirm the reservation (data operation only)"""
        reservation = self.get_by_id(reservation_id)
        reservation.status = 'confirmed'
        reservation.confirmed_at = timezone.now()
        reservation.save()
        return True

    def check_in(self, reservation_id):
        """Check in the customer (data operation only)"""
        reservation = self.get_by_id(reservation_id)
        reservation.status = 'checked_in'
        reservation.checked_in_at = timezone.now()
        reservation.save()
        return True

    def complete_reservation(self, reservation_id):
        """Mark reservation as completed (data operation only)"""
        reservation = self.get_by_id(reservation_id)
        reservation.status = 'completed'
        reservation.save()
        return True

    def cancel_reservation(self, reservation_id):
        """Cancel the reservation (data operation only)"""
        reservation = self.get_by_id(reservation_id)
        reservation.status = 'cancelled'
        reservation.save()
        return True

    def mark_no_show(self, reservation_id):
        """Mark as no show (data operation only)"""
        reservation = self.get_by_id(reservation_id)
        reservation.status = 'no_show'
        reservation.save()
        return True

    def check_table_availability(self, table_id, reservation_date, start_time, end_time, exclude_reservation_id=None):
        """Check if table is available for the given time slot"""
        conflicting_reservations = Reservation.objects.filter(
            table__table_id=table_id,
            reservation_date=reservation_date,
            status__in=['pending', 'confirmed', 'checked_in']
        ).filter(
            Q(start_time__lt=end_time) & Q(end_time__gt=start_time)
        )
        
        if exclude_reservation_id:
            conflicting_reservations = conflicting_reservations.exclude(reservation_id=exclude_reservation_id)
        
        return not conflicting_reservations.exists()

    def get_available_tables(self, reservation_date, start_time, end_time, guest_count):
        """Get available tables for the given time slot and guest count"""
        from restaurant.models.table import Table
        
        # Get all tables that can accommodate the guest count
        suitable_tables = Table.objects.filter(capacity__gte=guest_count)
        
        # Filter out tables that have conflicting reservations
        available_tables = []
        for table in suitable_tables:
            if self.check_table_availability(table.table_id, reservation_date, start_time, end_time):
                available_tables.append(table)
        
        return available_tables

    def get_reservations_by_status(self, status):
        """Get reservations by status"""
        return Reservation.objects.select_related('customer', 'table').filter(status=status)

    def update_reservation(self, reservation_id, **kwargs):
        """Update reservation with provided fields"""
        reservation = self.get_by_id(reservation_id)
        
        for field, value in kwargs.items():
            if hasattr(reservation, field):
                setattr(reservation, field, value)
        
        reservation.save()
        return reservation 