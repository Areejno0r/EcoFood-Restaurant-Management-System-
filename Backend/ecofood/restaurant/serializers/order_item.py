from rest_framework import serializers
from restaurant.models import OrderItem, MenuItem, Ingredient
from restaurant.serializers.menu_item import MenuItemSerializer
from restaurant.serializers.ingredient import IngredientSerializer

class OrderItemSerializer(serializers.ModelSerializer):
    menu_item = MenuItemSerializer(read_only=True)
    menu_item_id = serializers.PrimaryKeyRelatedField(
        source='menu_item', queryset=MenuItem.objects.all(), write_only=True
    )
    ingredients = IngredientSerializer(many=True, read_only=True)
    ingredients_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False
    )

    class Meta:
        model = OrderItem
        fields = [
            'order_item_id',
            'menu_item',
            'menu_item_id',
            'quantity',
            'price',
            'ingredients',
            'ingredients_ids'
        ]

    def create(self, validated_data):
        ingredients_ids = validated_data.pop('ingredients_ids', [])
        menu_item = validated_data.pop('menu_item')
        order_item = OrderItem.objects.create(menu_item=menu_item, **validated_data)
        if ingredients_ids:
            ingredients = Ingredient.objects.filter(ingredient_id__in=ingredients_ids)
            order_item.ingredients.set(ingredients)
        return order_item

    def update(self, instance, validated_data):
        ingredients_ids = validated_data.pop('ingredients_ids', None)
        
        instance.menu_item = validated_data.get('menu_item', instance.menu_item)
        instance.quantity = validated_data.get('quantity', instance.quantity)
        instance.price = validated_data.get('price', instance.price)

        if ingredients_ids is not None:
            if ingredients_ids:
                ingredients = Ingredient.objects.filter(ingredient_id__in=ingredients_ids)
                instance.ingredients.set(ingredients)
            else:
                instance.ingredients.clear()
        
        instance.save()
        return instance