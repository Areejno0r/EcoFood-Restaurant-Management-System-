from rest_framework import serializers
from restaurant.models import Payment, PaymentMethod
from restaurant.models import Order

class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = ['payment_method_id', 'method', 'is_active']

class PaymentSerializer(serializers.ModelSerializer):
    order = serializers.PrimaryKeyRelatedField(queryset=Order.objects.all())
    payment_method = PaymentMethodSerializer(read_only=True)

    class Meta:
        model = Payment
        fields = [
            'payment_id',
            'order',
            'amount',
            'payment_method',  # Now includes full PaymentMethod details
            'status',
            'transaction_id',
            'created_at',
            'updated_at'
        ]