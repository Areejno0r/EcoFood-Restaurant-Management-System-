from django.db import models
from .order import Order
from .menu_item import MenuItem
from .ingredient import Ingredient

class OrderItem(models.Model):
    order_item_id = models.AutoField(primary_key=True)  # OrderItemID (PK)
    order = models.ForeignKey(Order, on_delete=models.CASCADE)  # OrderID (FK)
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    ingredients = models.ManyToManyField(Ingredient, blank=True, related_name='order_item_ingredients')
    price = models.DecimalField(max_digits=10, decimal_places=2)  # Price

    def calculate_price(self):
        """Calculate total price including menu item and ingredients"""
        # Start with the base price of the menu item
        base_price = self.menu_item.price
        
        # Add costs of additional ingredients
        ingredient_cost = sum(
            ingredient.price_per_unit 
            for ingredient in self.ingredients.all()
        )
        
        # Calculate total price for the quantity
        total_price = (base_price + ingredient_cost) * self.quantity
        return total_price

    def save(self, *args, **kwargs):
        # Auto-calculate price if not set
        if self.pk is None:  # Only for new instances
            # Create the instance first without ingredients
            super().save(*args, **kwargs)
            # Now calculate price including ingredients
            self.price = self.calculate_price()
            super().save(update_fields=['price'])
        else:
            # For updates, recalculate price
            self.price = self.calculate_price()
            super().save(*args, **kwargs)
        
    def __str__(self):
        return f"{self.menu_item.name} (x{self.quantity}) for Order {self.order.order_id}"