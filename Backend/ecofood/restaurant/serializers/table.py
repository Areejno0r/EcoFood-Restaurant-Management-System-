from rest_framework import serializers
from restaurant.models.table import Table

class TableSerializer(serializers.ModelSerializer):
    location_display = serializers.CharField(source='get_location_display', read_only=True)
    current_availability = serializers.SerializerMethodField()

    class Meta:
        model = Table
        fields = [
            'table_id', 'table_number', 'capacity', 'location', 'location_display',
            'is_available', 'description', 'current_availability',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['table_id', 'created_at', 'updated_at']

    def get_current_availability(self, obj):
        """Get current availability status"""
        from datetime import datetime, timedelta
        from django.utils import timezone
        
        now = timezone.now()
        current_date = now.date()
        current_time = now.time()
        
        # Check if available right now (next 2 hours)
        end_time = (now + timedelta(hours=2)).time()
        
        if obj.is_available_for_time_slot(current_date, current_time, end_time):
            return "available"
        else:
            return "occupied"

class CreateTableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Table
        fields = [
            'table_number', 'capacity', 'location', 'is_available', 'description'
        ]

    def validate_table_number(self, value):
        """Ensure table number is unique"""
        if Table.objects.filter(table_number=value).exists():
            raise serializers.ValidationError("Table number already exists")
        return value

class TableAvailabilitySerializer(serializers.Serializer):
    """Serializer for checking table availability"""
    date = serializers.DateField()
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    guest_count = serializers.IntegerField(min_value=1, max_value=20)

    def validate(self, data):
        """Validate time slot"""
        if data['start_time'] >= data['end_time']:
            raise serializers.ValidationError("Start time must be before end time")
        
        from django.utils import timezone
        from datetime import datetime, time
        
        # Validate date is not in the past
        if data['date'] < timezone.now().date():
            raise serializers.ValidationError("Date cannot be in the past")
        
        # Validate operating hours (10 AM to 11 PM)
        if data['start_time'] < time(10, 0) or data['start_time'] >= time(23, 0):
            raise serializers.ValidationError("Reservations must be between 10:00 AM and 11:00 PM")
            
        return data 