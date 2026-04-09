from django.db import models
from django.utils import timezone

class DiscountUsage(models.Model):
    usage_id = models.AutoField(primary_key=True)
    customer = models.ForeignKey('Customer', on_delete=models.CASCADE, related_name='discount_usages')
    discount = models.ForeignKey('Discount', on_delete=models.CASCADE, related_name='usages')
    order = models.ForeignKey('Order', on_delete=models.CASCADE, related_name='discount_usage', null=True, blank=True)
    used_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        unique_together = ['customer', 'discount']
        ordering = ['-used_at']
    
    def __str__(self):
        return f"{self.customer.full_name} used {self.discount.code} on {self.used_at.strftime('%Y-%m-%d')}" 