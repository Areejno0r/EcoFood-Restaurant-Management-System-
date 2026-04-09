from rest_framework import serializers
from restaurant.models import Discount

class DiscountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Discount
        fields = [
            'discount_id',
            'code',
            'description',
            'percentage',
            'is_active',
            'valid_from',
            'valid_to'
        ]