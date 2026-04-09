from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from datetime import datetime, time
from django.core.exceptions import ValidationError

class Reservation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Confirmation'),
        ('confirmed', 'Confirmed'),
        ('checked_in', 'Checked In'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('no_show', 'No Show'),
    ]

    reservation_id = models.AutoField(primary_key=True)
    customer = models.ForeignKey('Customer', on_delete=models.CASCADE, related_name='reservations')
    table = models.ForeignKey('Table', on_delete=models.CASCADE, related_name='reservations')
    reservation_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    guest_count = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    special_requests = models.TextField(blank=True, null=True, help_text="Special dietary requirements, celebration notes, etc.")
    notes = models.TextField(blank=True, null=True, help_text="Internal notes for staff")
    
    # Contact information for flexibility
    contact_name = models.CharField(max_length=255, help_text="Name for the reservation")
    contact_phone = models.CharField(max_length=20, help_text="Contact phone number")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    checked_in_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['reservation_date', 'start_time']
        constraints = [
            models.UniqueConstraint(
                fields=['table', 'reservation_date', 'start_time'],
                name='unique_table_datetime'
            )
        ]

    def __str__(self):
        return f"Reservation {self.reservation_id} - {self.contact_name} on {self.reservation_date} at {self.start_time}"

    def clean(self):
        """Validate reservation data"""
        super().clean()
        
        # Validate start_time is before end_time
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValidationError("Start time must be before end time")
        
        # Validate reservation date is not in the past
        if self.reservation_date and self.reservation_date < timezone.now().date():
            raise ValidationError("Reservation date cannot be in the past")
        
        # Validate guest count doesn't exceed table capacity
        if self.table and self.guest_count > self.table.capacity:
            raise ValidationError(f"Guest count ({self.guest_count}) exceeds table capacity ({self.table.capacity})")
        
        # Validate restaurant operating hours (example: 10:00 AM to 11:00 PM)
        if self.start_time and (self.start_time < time(10, 0) or self.start_time >= time(23, 0)):
            raise ValidationError("Reservations must be between 10:00 AM and 11:00 PM")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def duration_hours(self):
        """Calculate reservation duration in hours"""
        if self.start_time and self.end_time:
            start_datetime = datetime.combine(datetime.today(), self.start_time)
            end_datetime = datetime.combine(datetime.today(), self.end_time)
            duration = end_datetime - start_datetime
            return duration.total_seconds() / 3600
        return 0

    @property
    def is_upcoming(self):
        """Check if reservation is upcoming"""
        now = timezone.now()
        reservation_datetime = datetime.combine(self.reservation_date, self.start_time)
        reservation_datetime = timezone.make_aware(reservation_datetime)
        return reservation_datetime > now and self.status in ['confirmed', 'pending']

    @property
    def is_today(self):
        """Check if reservation is today"""
        return self.reservation_date == timezone.now().date()

    @property
    def time_until_reservation(self):
        """Get time until reservation in human readable format"""
        if not self.is_upcoming:
            return None
        
        now = timezone.now()
        reservation_datetime = datetime.combine(self.reservation_date, self.start_time)
        reservation_datetime = timezone.make_aware(reservation_datetime)
        
        time_diff = reservation_datetime - now
        
        if time_diff.days > 0:
            return f"{time_diff.days} days"
        elif time_diff.seconds > 3600:
            hours = time_diff.seconds // 3600
            return f"{hours} hours"
        else:
            minutes = time_diff.seconds // 60
            return f"{minutes} minutes" 