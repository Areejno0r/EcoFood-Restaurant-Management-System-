from rest_framework import serializers
from restaurant.models import MenuItem

class MenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        fields = [
            'menu_item_id',
            'name',
            'description',
            'price',
            'calories',
            'is_available',
            'category',
            'image',
        ]