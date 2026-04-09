# restaurant/management/commands/seed_initial_data.py
import os
from django.core.management.base import BaseCommand, CommandError
from decimal import Decimal
import random

# Import models (adjust if your app structure is different)
# Assuming your models are in restaurant.models.payment, restaurant.models.menu_item, etc.
# If they are directly under restaurant.models, adjust the imports.

# It's good practice to import models within the handle method or functions called by it,
# especially if there are complex dependencies, but for simplicity here, we import at the top.
# Ensure your DJANGO_SETTINGS_MODULE is correctly set when this command is run.

from restaurant.models.payment import PaymentMethod
from restaurant.models.menu_item import MenuItem
from restaurant.models.ingredient import Ingredient
from restaurant.models.table import Table

class Command(BaseCommand):
    help = 'Seeds the database with initial data for EcoFood (PaymentMethods, Ingredients, MenuItems, Tables)'

    def seed_payment_methods(self):
        self.stdout.write("Seeding payment methods...")
        methods_data = [
            {'method': 'cash', 'is_active': True},
            {'method': 'credit_card', 'is_active': True},
        ]
        created_count = 0
        existing_count = 0
        for data in methods_data:
            obj, created = PaymentMethod.objects.get_or_create(method=data['method'], defaults=data)
            if created:
                self.stdout.write(self.style.SUCCESS(f"  CREATED payment method: {obj.method}"))
                created_count += 1
            else:
                self.stdout.write(f"  EXISTING payment method: {obj.method}")
                existing_count += 1
        self.stdout.write(f"Payment methods - Created: {created_count}, Existing: {existing_count}, Total: {PaymentMethod.objects.count()}")

    def seed_ingredients(self):
        self.stdout.write(self.style.HTTP_INFO("\nSeeding ingredients (EcoFood Focus)..."))
        ingredients_data = [
            {'name': 'Organic Tomatoes', 'unit': 'kg', 'is_allergen': False, 'stock_quantity': Decimal('30.0'), 'price_per_unit': Decimal('4500')},
            {'name': 'Local Onions', 'unit': 'kg', 'is_allergen': False, 'stock_quantity': Decimal('25.0'), 'price_per_unit': Decimal('3000')},
            {'name': 'Farm Potatoes', 'unit': 'kg', 'is_allergen': False, 'stock_quantity': Decimal('50.0'), 'price_per_unit': Decimal('2500')},
            {'name': 'Crisp Lettuce Mix', 'unit': 'kg', 'is_allergen': False, 'stock_quantity': Decimal('20.0'), 'price_per_unit': Decimal('5000')},
            {'name': 'Fresh Cucumbers', 'unit': 'kg', 'is_allergen': False, 'stock_quantity': Decimal('20.0'), 'price_per_unit': Decimal('3200')},
            {'name': 'Sweet Bell Peppers', 'unit': 'kg', 'is_allergen': False, 'stock_quantity': Decimal('15.0'), 'price_per_unit': Decimal('5500')},
            {'name': 'Garden Carrots', 'unit': 'kg', 'is_allergen': False, 'stock_quantity': Decimal('20.0'), 'price_per_unit': Decimal('2800')},
            {'name': 'Syrian Garlic', 'unit': 'kg', 'is_allergen': False, 'stock_quantity': Decimal('10.0'), 'price_per_unit': Decimal('6000')},
            {'name': 'Tart Lemons', 'unit': 'kg', 'is_allergen': False, 'stock_quantity': Decimal('15.0'), 'price_per_unit': Decimal('4000')},
            {'name': 'Free-Range Chicken Breast', 'unit': 'kg', 'is_allergen': False, 'stock_quantity': Decimal('20.0'), 'price_per_unit': Decimal('22000')},
            {'name': 'Sustainably Sourced Fish (e.g., Seabass)', 'unit': 'kg', 'is_allergen': True, 'stock_quantity': Decimal('10.0'), 'price_per_unit': Decimal('48000')},
            {'name': 'Organic Eggs', 'unit': 'piece', 'is_allergen': True, 'stock_quantity': Decimal('80'), 'price_per_unit': Decimal('900')},
            {'name': 'Organic Chickpeas', 'unit': 'kg', 'is_allergen': False, 'stock_quantity': Decimal('30.0'), 'price_per_unit': Decimal('7000')},
            {'name': 'Lentils (Local Variety)', 'unit': 'kg', 'is_allergen': False, 'stock_quantity': Decimal('25.0'), 'price_per_unit': Decimal('6500')},
            {'name': 'Organic Milk', 'unit': 'liter', 'is_allergen': True, 'stock_quantity': Decimal('30.0'), 'price_per_unit': Decimal('5000')},
            {'name': 'Artisanal Local Cheese', 'unit': 'kg', 'is_allergen': True, 'stock_quantity': Decimal('8.0'), 'price_per_unit': Decimal('28000')},
            {'name': 'Natural Yogurt', 'unit': 'kg', 'is_allergen': True, 'stock_quantity': Decimal('15.0'), 'price_per_unit': Decimal('6000')},
            {'name': 'Whole Wheat Flour', 'unit': 'kg', 'is_allergen': True, 'stock_quantity': Decimal('30.0'), 'price_per_unit': Decimal('4000')},
            {'name': 'Brown Rice', 'unit': 'kg', 'is_allergen': False, 'stock_quantity': Decimal('25.0'), 'price_per_unit': Decimal('5500')},
            {'name': 'Bulgur Wheat', 'unit': 'kg', 'is_allergen': True, 'stock_quantity': Decimal('20.0'), 'price_per_unit': Decimal('6000')},
            {'name': 'Extra Virgin Olive Oil (Syrian)', 'unit': 'liter', 'is_allergen': False, 'stock_quantity': Decimal('15.0'), 'price_per_unit': Decimal('18000')},
            {'name': 'Natural Honey', 'unit': 'kg', 'is_allergen': False, 'stock_quantity': Decimal('10.0'), 'price_per_unit': Decimal('20000')},
            {'name': 'Sea Salt', 'unit': 'kg', 'is_allergen': False, 'stock_quantity': Decimal('20.0'), 'price_per_unit': Decimal('1500')},
            {'name': 'Syrian Pistachios', 'unit': 'kg', 'is_allergen': True, 'stock_quantity': Decimal('5.0'), 'price_per_unit': Decimal('45000')},
            {'name': 'Walnuts (Local Grove)', 'unit': 'kg', 'is_allergen': True, 'stock_quantity': Decimal('5.0'), 'price_per_unit': Decimal('35000')},
            {'name': 'Sesame Seeds', 'unit': 'kg', 'is_allergen': True, 'stock_quantity': Decimal('10.0'), 'price_per_unit': Decimal('12000')},
        ]
        created_count = 0
        existing_count = 0
        for data in ingredients_data:
            obj, created = Ingredient.objects.get_or_create(name=data['name'], defaults=data)
            if created:
                self.stdout.write(self.style.SUCCESS(f"  CREATED ingredient: {obj.name}"))
                created_count += 1
            else:
                self.stdout.write(f"  EXISTING ingredient: {obj.name}")
                existing_count += 1
        self.stdout.write(f"Ingredients - Created: {created_count}, Existing: {existing_count}, Total: {Ingredient.objects.count()}")

    def seed_menu_items(self):
        self.stdout.write(self.style.HTTP_INFO("\nSeeding menu items (EcoFood Focus)..."))
        menu_items_data = [
            {'name': 'Sunrise Power Bowl', 'description': 'Warm quinoa and lentil porridge with seasonal fruits, local honey, and a sprinkle of pistachios. Wholesome start to your day!', 'price': Decimal('18000'), 'calories': 420, 'category': 'breakfast', 'is_available': True},
            {'name': 'Farmer\'s Market Omelette', 'description': 'Fluffy omelette made with organic eggs, filled with fresh local vegetables and artisanal cheese. Served with whole wheat toast.', 'price': Decimal('22000'), 'calories': 480, 'category': 'breakfast', 'is_available': True},
            {'name': 'Traditional Syrian Breakfast Platter', 'description': 'A delightful assortment of labneh, olives, fresh vegetables, zaatar with olive oil, and homemade bread. Pure & simple.', 'price': Decimal('15000'), 'calories': 380, 'category': 'breakfast', 'is_available': True},
            {'name': 'EcoSalad Delight', 'description': 'A vibrant mix of crisp lettuce, organic tomatoes, cucumbers, carrots, bell peppers, and chickpeas, topped with grilled free-range chicken and a light lemon-herb vinaigrette.', 'price': Decimal('28000'), 'calories': 550, 'category': 'lunch', 'is_available': True},
            {'name': 'Hearty Lentil & Veggie Soup', 'description': 'Nourishing soup made with local lentils, garden carrots, potatoes, and onions, seasoned with fresh herbs. Served with a side of bulgur.', 'price': Decimal('20000'), 'calories': 400, 'category': 'lunch', 'is_available': True},
            {'name': 'Whole Wheat Falafel Wrap', 'description': 'Baked (not fried!) organic chickpea falafels wrapped in whole wheat pita with fresh greens, tomatoes, and a tahini yogurt sauce.', 'price': Decimal('24000'), 'calories': 500, 'category': 'lunch', 'is_available': True},
            {'name': 'Grilled River Fish with Roasted Vegetables', 'description': 'Sustainably sourced local river fish, grilled and served with a medley of roasted seasonal vegetables and a side of brown rice.', 'price': Decimal('45000'), 'calories': 650, 'category': 'dinner', 'is_available': True},
            {'name': 'Stuffed Bell Peppers with Quinoa & Herbs', 'description': 'Sweet bell peppers filled with a savory mixture of quinoa, local herbs, and vegetables, baked to perfection. A vegetarian delight.', 'price': Decimal('35000'), 'calories': 580, 'category': 'dinner', 'is_available': True},
            {'name': 'Slow-Cooked Chicken with Freekeh', 'description': 'Tender free-range chicken slow-cooked with aromatic spices and served over smoky green wheat (freekeh). A traditional healthy feast.', 'price': Decimal('40000'), 'calories': 700, 'category': 'dinner', 'is_available': True},
            {'name': 'Spiced Hummus with Veggie Sticks', 'description': 'Our signature organic chickpea hummus with a hint of spice, served with fresh cucumber and carrot sticks.', 'price': Decimal('12000'), 'calories': 300, 'category': 'snack', 'is_available': True},
            {'name': 'Baked Spinach & Cheese Triangles', 'description': 'Whole wheat pastry triangles filled with fresh spinach and local artisanal cheese, baked until golden.', 'price': Decimal('15000'), 'calories': 350, 'category': 'snack', 'is_available': True},
            {'name': 'Date & Walnut Energy Bites', 'description': 'Naturally sweetened energy bites made with dates, local walnuts, and a touch of cardamom. Perfect guilt-free treat.', 'price': Decimal('10000'), 'calories': 250, 'category': 'snack', 'is_available': True,},
            {'name': 'Freshly Squeezed Seasonal Juice', 'description': 'A refreshing juice made from the best seasonal fruits, no added sugar.', 'price': Decimal('9000'), 'calories': 150, 'category': 'snack', 'is_available': True},
        ]
        created_count = 0
        existing_count = 0
        for item_data in menu_items_data:
            obj, created = MenuItem.objects.get_or_create(name=item_data['name'], defaults=item_data)
            if created:
                self.stdout.write(self.style.SUCCESS(f"  CREATED menu item: {obj.name}"))
                created_count += 1
            else:
                self.stdout.write(f"  EXISTING menu item: {obj.name}")
                existing_count += 1
        self.stdout.write(f"Menu items - Created: {created_count}, Existing: {existing_count}, Total: {MenuItem.objects.count()}")

    def seed_tables(self):
        self.stdout.write(self.style.HTTP_INFO("\nSeeding tables..."))
        tables_data = [
            {'table_number': 1, 'capacity': 2, 'location': 'indoor', 'description': 'Cozy table for two near the fireplace'},
            {'table_number': 2, 'capacity': 4, 'location': 'indoor', 'description': 'Family table with comfortable seating'},
            {'table_number': 3, 'capacity': 6, 'location': 'indoor', 'description': 'Large indoor table perfect for groups'},
            {'table_number': 4, 'capacity': 2, 'location': 'indoor', 'description': 'Intimate corner table'},
            {'table_number': 5, 'capacity': 8, 'location': 'indoor', 'description': 'Large family table in the main dining area'},
            {'table_number': 6, 'capacity': 4, 'location': 'indoor', 'description': 'Standard indoor table for four.'},
            {'table_number': 10, 'capacity': 2, 'location': 'window', 'description': 'Romantic window table with street view'},
            {'table_number': 11, 'capacity': 4, 'location': 'window', 'description': 'Window table perfect for people watching'},
            {'table_number': 12, 'capacity': 2, 'location': 'window', 'description': 'Cozy window nook with natural light'},
            {'table_number': 13, 'capacity': 3, 'location': 'window', 'description': 'Small window table for three.'},
            {'table_number': 20, 'capacity': 4, 'location': 'outdoor', 'description': 'Beautiful terrace table with garden view'},
            {'table_number': 21, 'capacity': 2, 'location': 'outdoor', 'description': 'Romantic outdoor table under the stars'},
            {'table_number': 22, 'capacity': 6, 'location': 'outdoor', 'description': 'Large outdoor table perfect for celebrations'},
            {'table_number': 23, 'capacity': 4, 'location': 'outdoor', 'description': 'Fresh air dining with nature sounds'},
            {'table_number': 24, 'capacity': 5, 'location': 'outdoor', 'description': 'Spacious outdoor table for five.'},
            {'table_number': 30, 'capacity': 8, 'location': 'private', 'description': 'Exclusive private dining room for special occasions'},
            {'table_number': 31, 'capacity': 12, 'location': 'private', 'description': 'Large private room for business meetings or celebrations'},
            {'table_number': 32, 'capacity': 6, 'location': 'private', 'description': 'Intimate private room for small groups'},
        ]
        created_count = 0
        existing_count = 0
        for data in tables_data:
            obj, created = Table.objects.get_or_create(table_number=data['table_number'], defaults=data)
            if created:
                self.stdout.write(self.style.SUCCESS(f"  CREATED table: {obj.table_number} ({obj.location})"))
                created_count += 1
            else:
                self.stdout.write(f"  EXISTING table: {obj.table_number} ({obj.location})")
                existing_count += 1
        self.stdout.write(f"Tables - Created: {created_count}, Existing: {existing_count}, Total: {Table.objects.count()}")

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Starting database seeding process (EcoFood Focus)..."))
        self.seed_payment_methods()
        self.seed_ingredients()
        self.seed_menu_items()
        self.seed_tables()
        self.stdout.write(self.style.SUCCESS("\nDatabase seeding completed successfully!"))

# To run this command: python manage.py seed_initial_data 