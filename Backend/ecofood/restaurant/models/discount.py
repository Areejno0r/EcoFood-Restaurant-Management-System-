from django.db import models

class Discount(models.Model):
    discount_id = models.AutoField(primary_key=True)  # DiscountID (PK)
    description = models.TextField()  # Description
    percentage = models.DecimalField(max_digits=5, decimal_places=2)  # Percentage
    valid_from = models.DateTimeField()  # ValidFrom
    valid_to = models.DateTimeField()  # ValidTo
    code=models.CharField(max_length=20,unique=True,blank=True,null=True)
    is_active =models.BooleanField(default=True)
    def str(self):
        return f"Discount {self.discount_id} - {self.percentage}% ({self.code or 'NO Code'})"