from rest_framework import serializers
from restaurant.models.reservation import Reservation
from restaurant.models.table import Table
from restaurant.models.customers import Customer
from restaurant.serializers.table import TableSerializer
from restaurant.serializers.customers import CustomerSerializer

class ReservationSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer(read_only=True)
    table = TableSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    duration_hours = serializers.ReadOnlyField()
    is_upcoming = serializers.ReadOnlyField()
    is_today = serializers.ReadOnlyField()
    time_until_reservation = serializers.ReadOnlyField()

    class Meta:
        model = Reservation
        fields = [
            'reservation_id', 'customer', 'table', 'reservation_date',
            'start_time', 'end_time', 'guest_count', 'status', 'status_display',
            'special_requests', 'notes', 'contact_name', 'contact_phone',
            'created_at', 'updated_at', 'confirmed_at', 'checked_in_at',
            'duration_hours', 'is_upcoming', 'is_today', 'time_until_reservation'
        ]
        read_only_fields = [
            'reservation_id', 'created_at', 'updated_at', 
            'confirmed_at', 'checked_in_at'
        ]

class CreateReservationSerializer(serializers.ModelSerializer):
    customer_id = serializers.IntegerField(write_only=True)
    table_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Reservation
        fields = [
            'customer_id', 'table_id', 'reservation_date', 'start_time', 'end_time',
            'guest_count', 'special_requests', 'contact_name', 'contact_phone'
        ]

    def validate(self, data):
        """Validate reservation data"""
        # Get the table and customer objects
        try:
            table = Table.objects.get(table_id=data['table_id'])
            customer = Customer.objects.get(customer_id=data['customer_id'])
        except Table.DoesNotExist:
            raise serializers.ValidationError("Table not found")
        except Customer.DoesNotExist:
            raise serializers.ValidationError("Customer not found")

        # Validate table capacity
        if data['guest_count'] > table.capacity:
            raise serializers.ValidationError(
                f"Guest count ({data['guest_count']}) exceeds table capacity ({table.capacity})"
            )

        # Check table availability for the requested time slot using repository
        from restaurant.repositories.reservation_repository import ReservationRepository
        reservation_repo = ReservationRepository()
        
        if not reservation_repo.check_table_availability(
            table.table_id,
            data['reservation_date'], 
            data['start_time'], 
            data['end_time']
        ):
            raise serializers.ValidationError(
                "Table is not available for the requested time slot"
            )

        # Validate time constraints
        if data['start_time'] >= data['end_time']:
            raise serializers.ValidationError("Start time must be before end time")

        from django.utils import timezone
        from datetime import time
        
        # Validate date is not in the past
        if data['reservation_date'] < timezone.now().date():
            raise serializers.ValidationError("Reservation date cannot be in the past")

        # Validate operating hours
        if data['start_time'] < time(10, 0) or data['start_time'] >= time(23, 0):
            raise serializers.ValidationError("Reservations must be between 10:00 AM and 11:00 PM")

        return data

    def create(self, validated_data):
        """Create reservation with table and customer"""
        customer_id = validated_data.pop('customer_id')
        table_id = validated_data.pop('table_id')
        
        customer = Customer.objects.get(customer_id=customer_id)
        table = Table.objects.get(table_id=table_id)
        
        reservation = Reservation.objects.create(
            customer=customer,
            table=table,
            **validated_data
        )
        
        return reservation

class UpdateReservationSerializer(serializers.ModelSerializer):
    """Serializer for updating reservation details"""
    class Meta:
        model = Reservation
        fields = [
            'reservation_date', 'start_time', 'end_time', 'guest_count',
            'special_requests', 'contact_name', 'contact_phone', 'notes'
        ]

    def validate(self, data):
        """Validate updated reservation data"""
        instance = self.instance
        
        # If time or date is being updated, check availability
        if any(field in data for field in ['reservation_date', 'start_time', 'end_time']):
            reservation_date = data.get('reservation_date', instance.reservation_date)
            start_time = data.get('start_time', instance.start_time)
            end_time = data.get('end_time', instance.end_time)
            
            # Check availability using repository (excluding current reservation)
            from restaurant.repositories.reservation_repository import ReservationRepository
            reservation_repo = ReservationRepository()
            
            if not reservation_repo.check_table_availability(
                instance.table.table_id,
                reservation_date,
                start_time,
                end_time,
                exclude_reservation_id=instance.reservation_id
            ):
                raise serializers.ValidationError(
                    "Table is not available for the updated time slot"
                )

        # Validate guest count against table capacity
        guest_count = data.get('guest_count', instance.guest_count)
        if guest_count > instance.table.capacity:
            raise serializers.ValidationError(
                f"Guest count ({guest_count}) exceeds table capacity ({instance.table.capacity})"
            )

        return data

class ReservationStatusUpdateSerializer(serializers.Serializer):
    """Serializer for updating reservation status"""
    action = serializers.ChoiceField(choices=[
        'confirm', 'check_in', 'complete', 'cancel', 'no_show'
    ])
    notes = serializers.CharField(required=False, allow_blank=True)

    def update_status(self, reservation, reservation_repo):
        """Update reservation status based on action using repository"""
        action = self.validated_data['action']
        notes = self.validated_data.get('notes', '')
        
        success = False
        if action == 'confirm':
            success = reservation_repo.confirm_reservation(reservation.reservation_id)
        elif action == 'check_in':
            success = reservation_repo.check_in(reservation.reservation_id)
        elif action == 'complete':
            success = reservation_repo.complete_reservation(reservation.reservation_id)
        elif action == 'cancel':
            success = reservation_repo.cancel_reservation(reservation.reservation_id)
        elif action == 'no_show':
            success = reservation_repo.mark_no_show(reservation.reservation_id)
        
        if success and notes:
            reservation.notes = notes
            reservation.save()
            
        return success

class ReservationAvailabilitySerializer(serializers.Serializer):
    """Serializer for checking reservation availability"""
    date = serializers.DateField()
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    guest_count = serializers.IntegerField(min_value=1)
    location_preference = serializers.ChoiceField(
        choices=[
            ('any', 'Any Location'),
            ('indoor', 'Indoor'),
            ('outdoor', 'Outdoor'),
            ('window', 'Window Side'),
            ('private', 'Private Room'),
        ],
        default='any',
        required=False
    )

    def validate(self, data):
        """Validate availability request"""
        if data['start_time'] >= data['end_time']:
            raise serializers.ValidationError("Start time must be before end time")
        
        from django.utils import timezone
        from datetime import time
        
        if data['date'] < timezone.now().date():
            raise serializers.ValidationError("Date cannot be in the past")
        
        if data['start_time'] < time(10, 0) or data['start_time'] >= time(23, 0):
            raise serializers.ValidationError("Reservations must be between 10:00 AM and 11:00 PM")
            
        return data 