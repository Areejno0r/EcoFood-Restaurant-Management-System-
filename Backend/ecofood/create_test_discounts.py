#!/usr/bin/env python
import os
import sys
import django
from datetime import datetime, timedelta

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecofood.settings')
django.setup()

from restaurant.models.discount import Discount
from django.utils import timezone

def create_test_discounts():
    """Create test discounts for development"""
    
    # Clear existing test discounts
    Discount.objects.filter(code__in=['D10', 'WELCOME20', 'SAVE15']).delete()
    
    # Current time
    now = timezone.now()
    
    discounts = [
        {
            'code': 'D10',
            'description': '10% off your entire order',
            'percentage': 10.0,
            'valid_from': now,
            'valid_to': now + timedelta(days=30),
            'is_active': True
        },
        {
            'code': 'WELCOME20',
            'description': '20% off for new customers',
            'percentage': 20.0,
            'valid_from': now,
            'valid_to': now + timedelta(days=7),
            'is_active': True
        },
        {
            'code': 'SAVE15',
            'description': '15% off weekend special',
            'percentage': 15.0,
            'valid_from': now,
            'valid_to': now + timedelta(days=14),
            'is_active': True
        }
    ]
    
    for discount_data in discounts:
        discount = Discount.objects.create(**discount_data)
        print(f"Created discount: {discount.code} - {discount.description}")
    
    print(f"\nCreated {len(discounts)} test discounts successfully!")

if __name__ == '__main__':
    create_test_discounts() 