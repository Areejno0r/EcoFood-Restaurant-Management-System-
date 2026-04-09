from rest_framework import serializers
from restaurant.models import OrderItemModification, OrderItem, Ingredient

class OrderItemModificationSerializer(serializers.ModelSerializer):
    order_item = serializers.PrimaryKeyRelatedField(queryset=OrderItem.objects.all())
    ingredient = serializers.PrimaryKeyRelatedField(queryset=Ingredient.objects.all())

    class Meta:
        model = OrderItemModification
        fields = [
            'id',
            'order_item',
            'ingredient',
            'action',  # مثل 'add' أو 'remove'
            'quantity',
            'created_at'
        ]