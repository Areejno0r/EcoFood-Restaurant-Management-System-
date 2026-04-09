from django.db import models
from .ingredient import Ingredient
from .order_item import OrderItem 

class OrderItemModification(models.Model):
    modification_id = models.AutoField(primary_key=True)  # ModificationID (PK)
    order_item = models.ForeignKey(OrderItem, on_delete=models.CASCADE)  # OrderItemID (FK)
    ingredient = models.ForeignKey(Ingredient, on_delete=models.CASCADE)  # IngredientID (FK)
    action = models.CharField(
        max_length=10,
        choices=[
            ('add', 'Add'),
            ('remove', 'Remove'),
        ]
    )  # Add/Remove
    notes = models.TextField(blank=True, null=True)  # Notes

    def __str__(self):
        return f"Modification {self.modification_id} - {self.action}"