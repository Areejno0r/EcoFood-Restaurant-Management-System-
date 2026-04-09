from rest_framework import generics
from restaurant.models.order_item_modification import OrderItemModification
from restaurant.serializers.order_item_modification import OrderItemModificationSerializer

class OrderItemModificationListCreateView(generics.ListCreateAPIView):
    queryset = OrderItemModification.objects.all()
    serializer_class = OrderItemModificationSerializer

class OrderItemModificationDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = OrderItemModification.objects.all()
    serializer_class = OrderItemModificationSerializer