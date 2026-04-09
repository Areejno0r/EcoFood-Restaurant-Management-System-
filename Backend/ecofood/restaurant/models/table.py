from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone

class Table(models.Model):
    table_id = models.AutoField(primary_key=True)
    table_number = models.PositiveIntegerField(unique=True)
    capacity = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(20)])
    location = models.CharField(max_length=100, choices=[
        ('indoor', 'Indoor'),
        ('outdoor', 'Outdoor'),
        ('window', 'Window Side'),
        ('private', 'Private Room'),
    ], default='indoor')
    is_available = models.BooleanField(default=True)
    description = models.TextField(blank=True, null=True, help_text="Special features or notes about this table")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['table_number']

    def __str__(self):
        return f"Table {self.table_number} ({self.capacity} seats - {self.get_location_display()})"

    def is_available_for_time_slot(self, date, start_time, end_time):
        """Check if table is available for a specific time slot"""
        from .reservation import Reservation
        
        # Check for overlapping reservations
        overlapping_reservations = Reservation.objects.filter(
            table=self,
            reservation_date=date,
            status__in=['confirmed', 'checked_in'],
            start_time__lt=end_time,
            end_time__gt=start_time
        )
        
        return not overlapping_reservations.exists() and self.is_available 