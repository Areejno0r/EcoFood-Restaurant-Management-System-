from django.db import models

class MenuItem(models.Model):
        menu_item_id=models.AutoField(primary_key=True)
        name = models.CharField(max_length=100)
        description = models.TextField(blank=True, null=True)
        price = models.DecimalField(max_digits=10, decimal_places=2)
        calories = models.PositiveIntegerField(blank=True, null=True)
        category =models.CharField(max_length=50, choices=[
        ('breakfast', 'Breakfast'),
        ('lunch', 'Lunch'),
        ('dinner', 'Dinner'),
        ('snack', 'Snack'),] )
        is_available =models.BooleanField(default=True)
        image = models.ImageField(upload_to='menu_items/', blank=True, null=True)
        
        def __str__(self):
            return self.name