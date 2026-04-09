from django.db import models

class PaymentMethod(models.Model):
    payment_method_id = models.AutoField(primary_key=True)  # PaymentMethodID (PK)
    method = models.CharField(max_length=50, unique=True)  # Method (credit card, cash, etc.)
    is_active = models.BooleanField(default=True)  # حقل إضافي لتفعيل/تعطيل طريقة الدفع

    def __str__(self):  # تصحيح str بدلاً من str
        return self.method

class Payment(models.Model):
    payment_id = models.AutoField(primary_key=True)
    order = models.ForeignKey('Order', on_delete=models.CASCADE, related_name='payment_records')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.ForeignKey(PaymentMethod, on_delete=models.PROTECT)  # ForeignKey إلى PaymentMethod
    status = models.CharField(max_length=20, default="pending")  # e.g., success, failed, refunded
    transaction_id = models.CharField(max_length=100, null=True)  # من الخدمة الخارجية
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment {self.payment_id} for Order {self.order.order_id}"