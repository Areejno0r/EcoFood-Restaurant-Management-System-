from django.db import models
from django.utils import timezone
from restaurant.orders_states import OrderState, PendingState, PreparingState, DeliveredState, CanceledState

class Order(models.Model):
    order_id = models.AutoField(primary_key=True)  # OrderID (PK)
    customer = models.ForeignKey('Customer', on_delete=models.CASCADE)  # CustomerID (FK)
    order_date = models.DateTimeField(default=timezone.now)  # OrderDate
    state = models.CharField(max_length=20, default="pending")  # تخزين اسم الحالة
    discount = models.ForeignKey('Discount', on_delete=models.SET_NULL, null=True, related_name='orders')  # DiscountID (FK)
    payment = models.OneToOneField(
        'Payment', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='order_payment'
    )  # Payment relationship
    total_amount = models.DecimalField(max_digits=7, decimal_places=2, default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)  # Creation timestamp
    updated_at = models.DateTimeField(auto_now=True)  # Last update timestamp

    def get_state(self):
        """إرجاع كائن الحالة بناءً على الحالة المخزنة"""
        state_map = {
            "pending": PendingState,
            "preparing": PreparingState,
            "delivered": DeliveredState,
            "canceled": CanceledState,
        }
        state_class = state_map.get(self.state, PendingState)
        return  state_class()
    
    def set_state(self, state: 'OrderState'):
        """تعيين الحالة وتحديث الحقل"""
        self.state = state.get_status()
        self.save()

    def transition_to_next_state(self):
        """الانتقال إلى الحالة التالية"""
        current_state = self.get_state()
        current_state.handle(self)

    def __str__(self):
        return f"Order {self.order_id} - {self.state}"