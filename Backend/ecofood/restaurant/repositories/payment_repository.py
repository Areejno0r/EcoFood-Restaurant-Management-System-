from restaurant.models.payment import Payment
from django.core.exceptions import ObjectDoesNotExist

class PaymentRepository:
    def save(self, payment):
        """حفظ سجل دفع في قاعدة البيانات"""
        payment.save()
        return payment

    def get_by_id(self, payment_id):
        """جلب دفع بناءً على المعرّف"""
        try:
            return Payment.objects.get(payment_id=payment_id)
        except ObjectDoesNotExist:
            raise ObjectDoesNotExist(f"Payment with ID {payment_id} not found")

    def get_by_order(self, order_id):
        """جلب دفع مرتبط بطلب معين"""
        try:
            return Payment.objects.get(order__order_id=order_id)
        except ObjectDoesNotExist:
            raise ObjectDoesNotExist(f"No payment found for Order ID {order_id}")