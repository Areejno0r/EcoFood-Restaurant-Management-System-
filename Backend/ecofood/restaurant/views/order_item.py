from rest_framework import generics
from restaurant.models.order_item import OrderItem
from restaurant.serializers.order_item import OrderItemSerializer
from restaurant.business_logic.order_business_logic import OrderBusinessLogic

class OrderItemListCreateView(generics.ListCreateAPIView):
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer

    def perform_create(self, serializer):
        order_id = self.request.data.get('order_id')
        ingredients_ids = self.request.data.get('ingredients_ids', [])
        order_item = OrderBusinessLogic().add_item_to_order(
            order_id=order_id,
            menu_item_id=serializer.validated_data['menu_item'].menu_item_id,
            quantity=serializer.validated_data['quantity'],
            ingredients_ids=ingredients_ids
        )
        serializer.instance = order_item

class OrderItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer