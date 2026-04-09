from django.db import models

class Ingredient(models.Model):
    ingredient_id = models.AutoField(primary_key=True)  # IngredientID (PK)
    name = models.CharField(max_length=100, unique=True)  # Name
    unit = models.CharField(max_length=20, choices=[
        ('gram', 'Gram'),
        ('kg', 'Kilogram'),
        ('liter', 'Liter'),
        ('ml', 'Milliliter'),
        ('piece', 'Piece'),
    ])  # Unit (وحدة القياس)
    is_allergen = models.BooleanField(default=False)  # ما إذا كان المكون يسبب حساسية
    stock_quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)  # الكمية المتوفرة في المخزون
    price_per_unit = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)  # السعر لكل وحدة

    def __str__(self):
        return f"{self.name} ({self.unit})"