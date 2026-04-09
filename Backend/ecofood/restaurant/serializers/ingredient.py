from rest_framework import serializers
from restaurant.models import Ingredient

class IngredientSerializer(serializers.ModelSerializer):
    is_available = serializers.SerializerMethodField()

    class Meta:
        model = Ingredient
        fields = [
            'ingredient_id',
            'name',
            'unit',
            'is_allergen',
            'stock_quantity',
            'price_per_unit',
            'is_available'
        ]

    def get_is_available(self, obj):
        return obj.stock_quantity > 0