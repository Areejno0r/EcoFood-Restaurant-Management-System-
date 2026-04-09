from rest_framework import generics
from restaurant.models.order import Order
from restaurant.serializers.order import OrderSerializer
from restaurant.business_logic.order_business_logic import OrderBusinessLogic
from rest_framework import serializers

class OrderListCreateView(generics.ListCreateAPIView):
    serializer_class = OrderSerializer

    def get_queryset(self):
        """
        Optimize query with proper prefetching of related objects
        """
        return Order.objects.select_related(
            'customer',
            'payment__payment_method',
            'discount'
        ).prefetch_related(
            'orderitem_set__menu_item',
            'orderitem_set__ingredients'
        ).order_by('-created_at')

class OrderDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = OrderSerializer

    def get_queryset(self):
        """
        Optimize query with proper prefetching of related objects
        """
        return Order.objects.select_related(
            'customer',
            'payment__payment_method',
            'discount'
        ).prefetch_related(
            'orderitem_set__menu_item',
            'orderitem_set__ingredients'
        )

    def perform_update(self, serializer):
        order = self.get_object()
        if order.state in ['delivered', 'canceled']:
            raise serializers.ValidationError("Cannot update order in this state")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.state in ['delivered', 'canceled']:
            raise serializers.ValidationError("Cannot delete order in this state")
        OrderBusinessLogic().delete_order(instance.order_id)