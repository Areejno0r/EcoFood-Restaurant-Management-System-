from rest_framework.views import APIView
from rest_framework import generics
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from restaurant.models.customers import Customer
from restaurant.serializers.customers import CustomerSerializer, CustomerSignUpSerializer, CustomerLoginSerializer

def get_tokens_for_customer(customer):
    """Generate JWT tokens for a customer"""
    refresh = RefreshToken()
    refresh['customer_id'] = customer.customer_id
    refresh['full_name'] = customer.full_name
    refresh['phone'] = customer.phone
    
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

class CustomerSignUpView(APIView):
    def post(self, request):
        serializer = CustomerSignUpSerializer(data=request.data)
        if serializer.is_valid():
            customer = serializer.save()
            tokens = get_tokens_for_customer(customer)
            return Response({
                'customer_id': customer.customer_id,
                'full_name': customer.full_name,
                'phone': customer.phone,
                'access_token': tokens['access'],
                'refresh_token': tokens['refresh']
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CustomerLoginView(APIView):
    def post(self, request):
        serializer = CustomerLoginSerializer(data=request.data)
        if serializer.is_valid():
            customer = serializer.validated_data['customer']
            tokens = get_tokens_for_customer(customer)
            return Response({
                'customer_id': customer.customer_id,
                'full_name': customer.full_name,
                'phone': customer.phone,
                'access_token': tokens['access'],
                'refresh_token': tokens['refresh']
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CustomerListCreateView(generics.ListCreateAPIView):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer

class CustomerDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer