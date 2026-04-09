from rest_framework import serializers
from restaurant.models import Order,Customer,Discount,OrderItem,MenuItem,Ingredient
from restaurant.serializers.order_item import OrderItemSerializer
from restaurant.serializers.customers import CustomerSerializer
from restaurant.serializers.payment import PaymentSerializer
from restaurant.serializers.discount import DiscountSerializer

class OrderSerializer(serializers.ModelSerializer):
    order_items = OrderItemSerializer(many=True, read_only=True, source='orderitem_set')
    customer = CustomerSerializer(read_only=True)
    customer_id = serializers.PrimaryKeyRelatedField(
        source='customer', queryset=Customer.objects.all(), write_only=True
    )
    payment = PaymentSerializer(read_only=True)
    discount = DiscountSerializer(read_only=True, allow_null=True)
    discount_id = serializers.PrimaryKeyRelatedField(
        source='discount', queryset=Discount.objects.all(), write_only=True, required=False, allow_null=True
    )
    items = serializers.ListField(write_only=True, required=False, allow_empty=True)
    payment_method = serializers.CharField(write_only=True, required=False, default='cash')

    class Meta:
        model = Order
        fields = [
            'order_id',
            'customer',
            'customer_id',
            'order_date',
            'state',
            'total_amount',
            'order_items',
            'payment',
            'discount',
            'discount_id',
            'items',
            'payment_method',
            'created_at',
            'updated_at'
        ]

    def create(self, validated_data):
        from restaurant.business_logic.order_business_logic import OrderBusinessLogic
        from restaurant.models import MenuItem, Ingredient, OrderItem
        
        # Extract items and payment_method from validated_data
        items_data = validated_data.pop('items', [])
        payment_method = validated_data.pop('payment_method', 'cash')
        
        # Extract customer and discount
        customer = validated_data.pop('customer')
        discount = validated_data.pop('discount', None)
        
        # Create order using business logic
        order_data = {
            'customer_id': customer.customer_id,
            'total_amount': validated_data['total_amount'],
            'payment_method': payment_method,
            'discount_id': discount.discount_id if discount else None,
            'payment': {}
        }
        
        order_business_logic = OrderBusinessLogic()
        order = order_business_logic.process_order(order_data)
        
        # Create order items directly without business logic
        for item_data in items_data:
            menu_item_id = item_data.get('menu_item_id')
            quantity = item_data.get('quantity', 1)
            price = item_data.get('price', '0.00')
            ingredients_ids = item_data.get('ingredients_ids', [])
            
            print(f"Creating order item: menu_item_id={menu_item_id}, quantity={quantity}, price={price}")
            
            try:
                # Get the menu item
                menu_item = MenuItem.objects.get(menu_item_id=menu_item_id)
                
                # Create order item directly
                order_item = OrderItem.objects.create(
                    order=order,
                    menu_item=menu_item,
                    quantity=quantity,
                    price=price
                )
                
                # Add ingredients if provided
                if ingredients_ids:
                    ingredients = Ingredient.objects.filter(ingredient_id__in=ingredients_ids)
                    order_item.ingredients.set(ingredients)
                    
                print(f"Order item created successfully: {order_item}")
                
            except MenuItem.DoesNotExist:
                print(f"MenuItem with ID {menu_item_id} not found")
                continue
            except Exception as e:
                print(f"Error creating order item: {e}")
                continue
        
        # Refresh order to get updated items
        order.refresh_from_db()
        return order