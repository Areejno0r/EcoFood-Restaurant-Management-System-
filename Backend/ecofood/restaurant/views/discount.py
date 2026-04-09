from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.core.exceptions import ValidationError
from restaurant.models.discount import Discount
from restaurant.serializers.discount import DiscountSerializer
from restaurant.business_logic.discount_business_logic import DiscountBusinessLogic

class DiscountListCreateView(generics.ListCreateAPIView):
    queryset = Discount.objects.all()
    serializer_class = DiscountSerializer

    def perform_create(self, serializer):
        discount = DiscountBusinessLogic().create_discount(serializer.validated_data)
        serializer.instance = discount

class DiscountDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Discount.objects.all()
    serializer_class = DiscountSerializer
    lookup_field = 'discount_id'

@api_view(['POST'])
@permission_classes([AllowAny])
def apply_discount(request):
    """
    Apply a discount code to an order total
    """
    discount_code = request.data.get('discount_code')
    order_total = request.data.get('order_total')
    customer_id = request.data.get('customer_id')
    
    if not discount_code:
        return Response({
            'success': False,
            'message': 'Discount code is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if not order_total:
        return Response({
            'success': False,
            'message': 'Order total is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        order_total = float(order_total)
        if order_total <= 0:
            return Response({
                'success': False,
                'message': 'Order total must be greater than 0'
            }, status=status.HTTP_400_BAD_REQUEST)
    except (ValueError, TypeError):
        return Response({
            'success': False,
            'message': 'Invalid order total'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        business_logic = DiscountBusinessLogic()
        discount_result = business_logic.validate_and_apply_discount(discount_code, order_total, customer_id)
        
        return Response({
            'success': True,
            'discount': DiscountSerializer(discount_result['discount']).data,
            'discount_amount': discount_result['discount_amount'],
            'final_total': discount_result['final_total'],
            'message': f'Discount applied successfully! You saved ${discount_result["discount_amount"]:.2f}'
        })
        
    except ValidationError as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'success': False,
            'message': 'An error occurred while applying the discount'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_active_discounts(request):
    """
    Get active discounts available to a customer
    """
    customer_id = request.query_params.get('customer_id')
    
    try:
        business_logic = DiscountBusinessLogic()
        
        if customer_id:
            # Get discounts that this customer hasn't used yet
            try:
                customer_id = int(customer_id)
                available_discounts = business_logic.get_customer_available_discounts(customer_id)
            except (ValueError, TypeError):
                return Response({
                    'success': False,
                    'message': 'Invalid customer ID'
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            # Get all active discounts
            available_discounts = business_logic.get_active_discounts()
        
        return Response({
            'success': True,
            'discounts': DiscountSerializer(available_discounts, many=True).data,
            'count': len(available_discounts),
            'message': f'Found {len(available_discounts)} available discount(s)' if available_discounts else 'No discounts available at this time'
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'message': 'An error occurred while fetching active discounts'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def record_discount_usage(request):
    """
    Record that a customer has used a discount (called after order creation)
    """
    customer_id = request.data.get('customer_id')
    discount_id = request.data.get('discount_id')
    order_id = request.data.get('order_id')
    
    if not customer_id or not discount_id:
        return Response({
            'success': False,
            'message': 'Customer ID and Discount ID are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        business_logic = DiscountBusinessLogic()
        usage = business_logic.record_discount_usage(customer_id, discount_id, order_id)
        
        if usage:
            return Response({
                'success': True,
                'message': 'Discount usage recorded successfully'
            })
        else:
            return Response({
                'success': False,
                'message': 'Failed to record discount usage'
            }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': 'An error occurred while recording discount usage'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)