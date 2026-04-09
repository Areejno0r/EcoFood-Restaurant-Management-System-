from restaurant.models.order import Order
from restaurant.models.order_item import OrderItem
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Sum
from django.db import models

class OrderRepository:
    def create(self, customer, total_amount, state="pending"):
        """إنشاء طلب جديد"""
        if total_amount <= 0:
            raise ValueError("Total amount must be positive")
        order = Order(customer=customer, total_amount=total_amount, state=state)
        order.save()
        return order

    def save(self, order):
        """حفظ سجل طلب (تحديث أو إنشاء)"""
        order.save()
        return order

    def get_by_id(self, order_id):
        """جلب طلب بناءً على المعرّف"""
        try:
            return Order.objects.select_related(
                'customer', 
                'payment__payment_method',  # Updated to use new relationship
                'discount'
            ).prefetch_related('orderitem_set__ingredients').get(order_id=order_id)
        except ObjectDoesNotExist:
            raise ObjectDoesNotExist(f"Order with ID {order_id} not found")

    def get_by_customer(self, customer_id):
        """جلب جميع الطلبات لعميل"""
        return Order.objects.select_related(
            'customer', 
            'payment__payment_method',  # Updated to use new relationship
            'discount'
        ).prefetch_related('orderitem_set__ingredients').filter(customer__customer_id=customer_id)

    def update_state(self, order_id, state):
        """تحديث حالة الطلب"""
        order = self.get_by_id(order_id)
        order.set_state(state)
        return order

    def delete(self, order_id):
        """حذف طلب بناءً على المعرّف"""
        order = self.get_by_id(order_id)
        order.delete()
        return True

    def add_item_to_order(self, order, menu_item, quantity, price, ingredients=None):
        """إضافة عنصر إلى الطلب"""
    
        if quantity <= 0:
            raise ValueError("Quantity must be positive")
        if price <= 0:
            raise ValueError("Price must be positive")
                
        order_item = OrderItem.objects.create(
            order=order,
            menu_item=menu_item,
            quantity=quantity,
            price=price
        )  
        if ingredients is not None and ingredients:
            order_item.ingredients.set(ingredients)
            # Recalculate price after setting ingredients
            order_item.save()
        
        return order_item

    def update_total_amount(self, order_id):
        """تحديث المبلغ الإجمالي بناءً على العناصر"""
        order = self.get_by_id(order_id)
        total = order.orderitem_set.aggregate(total=Sum(models.F('price') * models.F('quantity')))['total'] or 0
        order.total_amount = total
        order.save()
        return order