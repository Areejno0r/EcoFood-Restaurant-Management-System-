from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from django.db import transaction
from django.core.exceptions import ValidationError
from restaurant.models.reservation import Reservation
from restaurant.models.table import Table
from restaurant.models.customers import Customer
from restaurant.repositories.reservation_repository import ReservationRepository
from restaurant.business_logic.reservation_business_logic import ReservationBusinessLogic
from restaurant.serializers.reservation import (
    ReservationSerializer, CreateReservationSerializer, 
    UpdateReservationSerializer, ReservationStatusUpdateSerializer,
    ReservationAvailabilitySerializer
)

class ReservationListCreateView(generics.ListCreateAPIView):
    """
    List reservations or create a new reservation.
    Following use case steps 6-9: Select table, enter info, send confirmation, save reservation.
    """
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateReservationSerializer
        return ReservationSerializer
    
    def get_queryset(self):
        """Filter reservations based on query parameters"""
        reservation_repo = ReservationRepository()
        
        # Filter by customer if authenticated
        customer_id = self.request.query_params.get('customer_id', None)
        if self.request.user.is_authenticated and customer_id:
            queryset = reservation_repo.get_by_customer(customer_id)
        else:
            queryset = Reservation.objects.all()
        
        # Filter by status
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            if customer_id:
                # If we already filtered by customer, filter the existing queryset
                queryset = queryset.filter(status=status_filter)
            else:
                queryset = reservation_repo.get_reservations_by_status(status_filter)
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)
        if date_from and date_to:
            from datetime import datetime
            start_date = datetime.strptime(date_from, '%Y-%m-%d').date()
            end_date = datetime.strptime(date_to, '%Y-%m-%d').date()
            if not customer_id and not status_filter:
                queryset = reservation_repo.get_by_date_range(start_date, end_date)
            else:
                queryset = queryset.filter(reservation_date__gte=start_date, reservation_date__lte=end_date)
        elif date_from:
            queryset = queryset.filter(reservation_date__gte=date_from)
        elif date_to:
            queryset = queryset.filter(reservation_date__lte=date_to)
        
        return queryset.order_by('-reservation_date', '-start_time')

    def create(self, request, *args, **kwargs):
        """
        Create a new reservation with SMS confirmation.
        Following use case steps 7-9.
        """
        serializer = self.get_serializer(data=request.data)
        
        # Following use case A2: Validate data and show specific error messages
        if not serializer.is_valid():
            error_messages = []
            for field, errors in serializer.errors.items():
                if field == 'reservation_date':
                    error_messages.append("The reservation date must be in the future. Please modify the date.")
                elif field == 'contact_phone':
                    error_messages.append("Invalid phone number. Please enter a number consisting of at least 10 digits.")
                elif field == 'guest_count':
                    error_messages.append("The number of people exceeds the available capacity or is invalid.")
                elif field == 'start_time' or field == 'end_time':
                    error_messages.append("Invalid time. Reservations must be between 10:00 AM and 11:00 PM.")
                else:
                    error_messages.extend(errors)
            
            return Response({
                'success': False,
                'errors': serializer.errors,
                'error_messages': error_messages,
                'message': 'Please correct the following errors'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                # Use business logic to create the reservation
                business_logic = ReservationBusinessLogic()
                validated_data = serializer.validated_data
                
                # Get customer
                customer = Customer.objects.get(customer_id=validated_data['customer_id'])
                
                reservation = business_logic.create_reservation(
                    customer=customer,
                    table_id=validated_data['table_id'],
                    reservation_date=validated_data['reservation_date'],
                    start_time=validated_data['start_time'],
                    end_time=validated_data['end_time'],
                    guest_count=validated_data['guest_count'],
                    contact_name=validated_data['contact_name'],
                    contact_phone=validated_data['contact_phone'],
                    special_requests=validated_data.get('special_requests'),
                    notes=validated_data.get('notes')
                )
                
                # Send SMS confirmation (mock implementation)
                sms_sent = self._send_sms_confirmation(reservation)
                
                return Response({
                    'success': True,
                    'reservation': ReservationSerializer(reservation).data,
                    'sms_sent': sms_sent,
                    'message': f'Reservation confirmed! Confirmation sent via SMS to {reservation.contact_phone}'
                }, status=status.HTTP_201_CREATED)
                
        except ValidationError as e:
            return Response({
                'success': False,
                'errors': {'validation': str(e)},
                'message': 'Reservation could not be created due to validation errors'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'errors': {'general': str(e)},
                'message': 'An error occurred while creating the reservation'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _send_sms_confirmation(self, reservation):
        """
        Send SMS confirmation to customer.
        Following use case step 8: Send confirmation via SMS.
        Mock implementation - in production, integrate with SMS service.
        """
        try:
            # Mock SMS sending logic
            message = (
                f"Reservation Confirmed!\n"
                f"Restaurant: EcoFood\n"
                f"Date: {reservation.reservation_date.strftime('%B %d, %Y')}\n"
                f"Time: {reservation.start_time.strftime('%I:%M %p')}\n"
                f"Table: {reservation.table.table_number}\n"
                f"Guests: {reservation.guest_count}\n"
                f"Name: {reservation.contact_name}\n"
                f"Reservation ID: {reservation.reservation_id}\n"
                f"Thank you for choosing EcoFood!"
            )
            
            # In production, replace with actual SMS service
            print(f"SMS to {reservation.contact_phone}: {message}")
            
            return True
        except Exception as e:
            print(f"Failed to send SMS: {e}")
            return False

class ReservationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a specific reservation"""
    queryset = Reservation.objects.all()
    lookup_field = 'reservation_id'
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UpdateReservationSerializer
        return ReservationSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def lookup_reservation(request):
    """
    Look up reservation by reservation ID or phone number.
    Following use case A3 & A4: Customer wants to modify/cancel existing reservation.
    """
    reservation_id = request.data.get('reservation_id', None)
    phone_number = request.data.get('phone_number', None)
    
    if not reservation_id and not phone_number:
        return Response({
            'success': False,
            'message': 'Please provide either reservation ID or phone number'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        if reservation_id:
            reservations = Reservation.objects.filter(reservation_id=reservation_id)
        else:
            reservations = Reservation.objects.filter(contact_phone=phone_number)
        
        if not reservations.exists():
            return Response({
                'success': False,
                'message': 'No reservations found with the provided information'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Return all reservations for the phone number, or the specific reservation
        serialized_reservations = ReservationSerializer(reservations, many=True).data
        
        return Response({
            'success': True,
            'reservations': serialized_reservations,
            'message': f'Found {len(serialized_reservations)} reservation(s)'
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'message': 'An error occurred while looking up the reservation'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def modify_reservation(request, reservation_id):
    """
    Modify an existing reservation.
    Following use case A3: Customer wants to modify existing reservation.
    """
    try:
        reservation_repo = ReservationRepository()
        reservation = reservation_repo.get_by_id(reservation_id)
    except Reservation.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Reservation not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Check if reservation can be modified
    if reservation.status not in ['pending', 'confirmed']:
        return Response({
            'success': False,
            'message': f'Cannot modify reservation with status: {reservation.status}'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    serializer = UpdateReservationSerializer(reservation, data=request.data, partial=True)
    
    if not serializer.is_valid():
        return Response({
            'success': False,
            'errors': serializer.errors,
            'message': 'Please correct the following errors'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        with transaction.atomic():
            # Use business logic to modify reservation
            business_logic = ReservationBusinessLogic()
            updated_reservation = business_logic.modify_reservation(
                reservation_id, **serializer.validated_data
            )
            
            # Send modification confirmation SMS
            _send_modification_sms(updated_reservation)
            
            return Response({
                'success': True,
                'reservation': ReservationSerializer(updated_reservation).data,
                'message': 'Reservation updated successfully. Confirmation sent via SMS.'
            })
            
    except ValidationError as e:
        return Response({
            'success': False,
            'errors': {'validation': str(e)},
            'message': 'Reservation could not be updated due to validation errors'
        }, status=status.HTTP_400_BAD_REQUEST)

def _send_modification_sms(reservation):
    """Send SMS for reservation modification"""
    try:
        message = (
            f"Reservation Updated!\n"
            f"Restaurant: EcoFood\n"
            f"Date: {reservation.reservation_date.strftime('%B %d, %Y')}\n"
            f"Time: {reservation.start_time.strftime('%I:%M %p')}\n"
            f"Table: {reservation.table.table_number}\n"
            f"Guests: {reservation.guest_count}\n"
            f"Name: {reservation.contact_name}\n"
            f"Reservation ID: {reservation.reservation_id}\n"
            f"Thank you for choosing EcoFood!"
        )
        
        print(f"SMS to {reservation.contact_phone}: {message}")
        return True
    except Exception as e:
        print(f"Failed to send modification SMS: {e}")
        return False

@api_view(['POST'])
@permission_classes([AllowAny])
def cancel_reservation(request, reservation_id):
    """
    Cancel an existing reservation.
    Following use case A4: Customer wants to cancel reservation.
    """
    try:
        reservation_repo = ReservationRepository()
        reservation = reservation_repo.get_by_id(reservation_id)
    except Reservation.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Reservation not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Check if reservation can be cancelled
    if reservation.status not in ['pending', 'confirmed']:
        return Response({
            'success': False,
            'message': f'Cannot cancel reservation with status: {reservation.status}'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Request confirmation before cancelling
    confirm_cancellation = request.data.get('confirm_cancellation', False)
    if not confirm_cancellation:
        return Response({
            'success': False,
            'reservation': ReservationSerializer(reservation).data,
            'message': 'Please confirm cancellation by setting confirm_cancellation to true',
            'requires_confirmation': True
        })
    
    try:
        with transaction.atomic():
            # Cancel the reservation using business logic
            business_logic = ReservationBusinessLogic()
            if business_logic.cancel_reservation(reservation.reservation_id):
                # Refresh reservation object to get updated status
                reservation.refresh_from_db()
                
                # Send cancellation confirmation SMS
                _send_cancellation_sms(reservation)
                
                return Response({
                    'success': True,
                    'reservation': ReservationSerializer(reservation).data,
                    'message': 'Reservation cancelled successfully. Confirmation sent via SMS.'
                })
            else:
                return Response({
                    'success': False,
                    'message': 'Failed to cancel reservation'
                }, status=status.HTTP_400_BAD_REQUEST)
                
    except Exception as e:
        return Response({
            'success': False,
            'message': 'An error occurred while cancelling the reservation'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def _send_cancellation_sms(reservation):
    """Send SMS for reservation cancellation"""
    try:
        message = (
            f"Reservation Cancelled\n"
            f"Restaurant: EcoFood\n"
            f"Reservation ID: {reservation.reservation_id}\n"
            f"Date: {reservation.reservation_date.strftime('%B %d, %Y')}\n"
            f"Time: {reservation.start_time.strftime('%I:%M %p')}\n"
            f"We hope to see you again soon!"
        )
        
        print(f"SMS to {reservation.contact_phone}: {message}")
        return True
    except Exception as e:
        print(f"Failed to send cancellation SMS: {e}")
        return False

@api_view(['POST'])
def update_reservation_status(request, reservation_id):
    """
    Update reservation status (admin function).
    For staff to confirm, check-in, complete, or mark no-show.
    """
    try:
        reservation_repo = ReservationRepository()
        reservation = reservation_repo.get_by_id(reservation_id)
    except Reservation.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Reservation not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    serializer = ReservationStatusUpdateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            'success': False,
            'errors': serializer.errors,
            'message': 'Invalid action or data'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    business_logic = ReservationBusinessLogic()
    action = serializer.validated_data['action']
    
    try:
        if action == 'confirm':
            success = business_logic.confirm_reservation(reservation_id)
        elif action == 'check_in':
            success = business_logic.check_in_customer(reservation_id)
        elif action == 'complete':
            success = business_logic.complete_reservation(reservation_id)
        elif action == 'cancel':
            success = business_logic.cancel_reservation(reservation_id)
        elif action == 'no_show':
            success = business_logic.mark_no_show(reservation_id)
        else:
            return Response({
                'success': False,
                'message': f'Invalid action: {action}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if success:
            # Refresh reservation object to get updated status
            reservation.refresh_from_db()
            return Response({
                'success': True,
                'reservation': ReservationSerializer(reservation).data,
                'message': f'Reservation status updated to {reservation.status}'
            })
        else:
            return Response({
                'success': False,
                'message': f'Failed to perform action: {action}'
            }, status=status.HTTP_400_BAD_REQUEST)
    except ValidationError as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def get_upcoming_reservations(request):
    """Get upcoming reservations for today and tomorrow (staff view)"""
    business_logic = ReservationBusinessLogic()
    upcoming_reservations = business_logic.get_upcoming_reservations(days_ahead=1)
    
    # Group by date
    reservations_by_date = {}
    for reservation in upcoming_reservations:
        date_str = reservation.reservation_date.isoformat()
        if date_str not in reservations_by_date:
            reservations_by_date[date_str] = []
        reservations_by_date[date_str].append(ReservationSerializer(reservation).data)
    
    return Response({
        'success': True,
        'reservations_by_date': reservations_by_date,
        'total_count': upcoming_reservations.count()
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def check_availability(request):
    """
    Check availability and suggest tables.
    Following use case steps 3-5: Check availability and show suitable tables.
    """
    serializer = ReservationAvailabilitySerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response({
            'success': False,
            'errors': serializer.errors,
            'message': 'Please correct the following errors'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    data = serializer.validated_data
    date = data['date']
    start_time = data['start_time']
    end_time = data['end_time']
    guest_count = data['guest_count']
    location_preference = data.get('location_preference', 'any')
    
    # Use business logic to find available tables
    business_logic = ReservationBusinessLogic()
    available_tables_objects = business_logic.find_available_tables(date, start_time, end_time, guest_count)
    
    # Filter by location preference if specified
    if location_preference != 'any':
        available_tables_objects = [table for table in available_tables_objects if table.location == location_preference]
    
    available_tables = []
    for table in available_tables_objects:
        from restaurant.serializers.table import TableSerializer
        table_data = TableSerializer(table).data
        available_tables.append(table_data)
    
    if available_tables:
        return Response({
            'success': True,
            'available_tables': available_tables,
            'search_criteria': {
                'date': date.isoformat(),
                'start_time': start_time.strftime('%H:%M'),
                'end_time': end_time.strftime('%H:%M'),
                'guest_count': guest_count,
                'location_preference': location_preference
            },
            'message': f'Found {len(available_tables)} available table(s) for {guest_count} guests'
        })
    else:
        # Suggest alternative times
        from restaurant.views.table import _suggest_alternative_times
        alternative_times = _suggest_alternative_times(date, start_time, end_time, guest_count)
        
        return Response({
            'success': False,
            'available_tables': [],
            'alternative_times': alternative_times,
            'search_criteria': {
                'date': date.isoformat(),
                'start_time': start_time.strftime('%H:%M'),
                'end_time': end_time.strftime('%H:%M'),
                'guest_count': guest_count,
                'location_preference': location_preference
            },
            'message': 'No tables available at the specified time. Please select another time.'
        }) 