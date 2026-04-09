from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import datetime, timedelta
from restaurant.models.table import Table
from restaurant.serializers.table import (
    TableSerializer, CreateTableSerializer, TableAvailabilitySerializer
)

class TableListCreateView(generics.ListCreateAPIView):
    """List all tables or create a new table (admin only)"""
    queryset = Table.objects.all()
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateTableSerializer
        return TableSerializer

    def get_queryset(self):
        """Filter tables based on query parameters"""
        queryset = Table.objects.all()
        
        # Filter by location
        location = self.request.query_params.get('location', None)
        if location and location != 'any':
            queryset = queryset.filter(location=location)
        
        # Filter by capacity (minimum capacity)
        min_capacity = self.request.query_params.get('min_capacity', None)
        if min_capacity:
            try:
                min_capacity = int(min_capacity)
                queryset = queryset.filter(capacity__gte=min_capacity)
            except ValueError:
                pass
        
        # Filter by availability
        is_available = self.request.query_params.get('is_available', None)
        if is_available:
            queryset = queryset.filter(is_available=is_available.lower() == 'true')
        
        return queryset.order_by('table_number')

class TableDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete a table (admin only for update/delete)"""
    queryset = Table.objects.all()
    serializer_class = TableSerializer
    lookup_field = 'table_id'

@api_view(['POST'])
def check_table_availability(request):
    """
    Check table availability for specific date, time, and guest count.
    Following use case step 4: System checks table availability based on capacity and schedule.
    """
    serializer = TableAvailabilitySerializer(data=request.data)
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
    
    # Find suitable tables based on capacity
    suitable_tables = Table.objects.filter(
        capacity__gte=guest_count,
        is_available=True
    )
    
    available_tables = []
    for table in suitable_tables:
        if table.is_available_for_time_slot(date, start_time, end_time):
            table_data = TableSerializer(table).data
            available_tables.append(table_data)
    
    if available_tables:
        return Response({
            'success': True,
            'available_tables': available_tables,
            'message': f'Found {len(available_tables)} available table(s) for {guest_count} guests'
        })
    else:
        # Following use case A1: No tables available - suggest alternative times
        alternative_times = _suggest_alternative_times(date, start_time, end_time, guest_count)
        return Response({
            'success': False,
            'available_tables': [],
            'alternative_times': alternative_times,
            'message': 'No tables available at the specified time. Please select another time.'
        })

def _suggest_alternative_times(date, start_time, end_time, guest_count):
    """
    Suggest alternative times when no tables are available.
    Following use case A1: Display alternative times close to the requested time.
    """
    from datetime import datetime, timedelta, time
    
    alternative_times = []
    
    # Convert times to datetime for easier manipulation
    start_datetime = datetime.combine(date, start_time)
    end_datetime = datetime.combine(date, end_time)
    duration = end_datetime - start_datetime
    
    # Check for alternative times within 2 hours before and after
    for offset in [-2, -1, 1, 2]:
        alt_start = start_datetime + timedelta(hours=offset)
        alt_end = alt_start + duration
        
        # Ensure times are within operating hours (10 AM to 11 PM)
        if (alt_start.time() >= time(10, 0) and 
            alt_end.time() <= time(23, 0) and 
            alt_start.date() == date):
            
            # Check if any table is available at this time
            suitable_tables = Table.objects.filter(
                capacity__gte=guest_count,
                is_available=True
            )
            
            for table in suitable_tables:
                if table.is_available_for_time_slot(
                    alt_start.date(), 
                    alt_start.time(), 
                    alt_end.time()
                ):
                    alternative_times.append({
                        'start_time': alt_start.time().strftime('%H:%M'),
                        'end_time': alt_end.time().strftime('%H:%M'),
                        'available_tables_count': len([
                            t for t in suitable_tables 
                            if t.is_available_for_time_slot(
                                alt_start.date(), 
                                alt_start.time(), 
                                alt_end.time()
                            )
                        ])
                    })
                    break
    
    # Remove duplicates and sort by time
    seen = set()
    unique_alternatives = []
    for alt in alternative_times:
        time_key = (alt['start_time'], alt['end_time'])
        if time_key not in seen:
            seen.add(time_key)
            unique_alternatives.append(alt)
    
    return sorted(unique_alternatives, key=lambda x: x['start_time'])[:5]

@api_view(['GET'])
def get_tables_with_layout(request):
    """
    Get tables with layout information for map display.
    Following use case step 5: A map showing table locations.
    """
    location_filter = request.query_params.get('location', None)
    
    queryset = Table.objects.all()
    if location_filter and location_filter != 'any':
        queryset = queryset.filter(location=location_filter)
    
    tables = TableSerializer(queryset, many=True).data
    
    # Group tables by location for map display
    tables_by_location = {}
    for table in tables:
        location = table['location']
        if location not in tables_by_location:
            tables_by_location[location] = []
        tables_by_location[location].append(table)
    
    return Response({
        'success': True,
        'tables': tables,
        'tables_by_location': tables_by_location,
        'locations': [
            {'value': 'indoor', 'label': 'Indoor'},
            {'value': 'outdoor', 'label': 'Outdoor'},
            {'value': 'window', 'label': 'Window Side'},
            {'value': 'private', 'label': 'Private Room'},
        ]
    })

@api_view(['GET'])
def get_table_schedule(request, table_id):
    """
    Get table schedule for a specific date to show availability timeline.
    """
    try:
        table = Table.objects.get(table_id=table_id)
    except Table.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Table not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    date_str = request.query_params.get('date', timezone.now().date().isoformat())
    try:
        date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return Response({
            'success': False,
            'message': 'Invalid date format. Use YYYY-MM-DD'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Get reservations for this table on this date
    from restaurant.models.reservation import Reservation
    reservations = Reservation.objects.filter(
        table=table,
        reservation_date=date,
        status__in=['confirmed', 'checked_in', 'pending']
    ).order_by('start_time')
    
    # Create schedule with time slots
    schedule = []
    for reservation in reservations:
        schedule.append({
            'start_time': reservation.start_time.strftime('%H:%M'),
            'end_time': reservation.end_time.strftime('%H:%M'),
            'status': reservation.status,
            'guest_count': reservation.guest_count,
            'contact_name': reservation.contact_name,
            'reservation_id': reservation.reservation_id
        })
    
    return Response({
        'success': True,
        'table': TableSerializer(table).data,
        'date': date.isoformat(),
        'schedule': schedule
    })

@api_view(['POST'])
def toggle_table_availability(request, table_id):
    """
    Toggle table availability (admin function).
    """
    try:
        table = Table.objects.get(table_id=table_id)
    except Table.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Table not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    table.is_available = not table.is_available
    table.save()
    
    return Response({
        'success': True,
        'table': TableSerializer(table).data,
        'message': f'Table {table.table_number} is now {"available" if table.is_available else "unavailable"}'
    }) 