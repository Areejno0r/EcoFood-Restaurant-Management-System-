from abc import ABC, abstractmethod

class OrderState(ABC):
    @abstractmethod
    def handle(self, order):
        """التعامل مع حالة الطلب"""
        pass

    @abstractmethod
    def get_status(self):
        """إرجاع اسم الحالة"""
        pass

class PendingState(OrderState):
    def handle(self, order):
        """التعامل مع الحالة المعلقة"""
        from restaurant.models.order import Order  # استيراد مؤخر
        if not isinstance(order, Order):
            raise ValueError("Order must be an instance of Order")
        order.set_state(PreparingState())

    def get_status(self):
        return "pending"

class PreparingState(OrderState):
    def handle(self, order):
        """التعامل مع الحالة قيد التحضير"""
        from restaurant.models.order import Order  # استيراد مؤخر
        if not isinstance(order, Order):
            raise ValueError("Order must be an instance of Order")
        order.set_state(DeliveredState())

    def get_status(self):
        return "preparing"

class DeliveredState(OrderState):
    def handle(self, order):
        """لا يمكن تغيير الحالة بعد التسليم"""
        from restaurant.models.order import Order  # استيراد مؤخر
        if not isinstance(order, Order):
            raise ValueError("Order must be an instance of Order")
        pass

    def get_status(self):
        return "delivered"

class CanceledState(OrderState):
    def handle(self, order):
        """لا يمكن تغيير الحالة بعد الإلغاء"""
        from restaurant.models.order import Order  # استيراد مؤخر
        if not isinstance(order, Order):
            raise ValueError("Order must be an instance of Order")
        pass

    def get_status(self):
        return "canceled"