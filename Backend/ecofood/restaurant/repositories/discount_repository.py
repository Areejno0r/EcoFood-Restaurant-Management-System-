from restaurant.models.discount import Discount
from django.core.exceptions import ObjectDoesNotExist
from django.utils import timezone

class DiscountRepository:
    def get_discount(self, discount_id):
        """Get discount by ID"""
        try:
            return Discount.objects.get(discount_id=discount_id)
        except ObjectDoesNotExist:
            raise ObjectDoesNotExist(f"Discount with ID {discount_id} not found")

    def get_discount_by_code(self, code):
        """Get discount by code"""
        try:
            return Discount.objects.get(code=code, is_active=True)
        except ObjectDoesNotExist:
            return None

    def get_all_discounts(self):
        """Get all discounts"""
        return Discount.objects.all()

    def get_active_discounts(self):
        """Get all active discounts that are currently valid"""
        now = timezone.now()
        return Discount.objects.filter(
            is_active=True,
            valid_from__lte=now,
            valid_to__gte=now
        ).order_by('-created_at') if hasattr(Discount, 'created_at') else Discount.objects.filter(
            is_active=True,
            valid_from__lte=now,
            valid_to__gte=now
        )

    def create_discount(self, discount_data):
        """Create a new discount"""
        return Discount.objects.create(**discount_data)

    def update_discount(self, discount_id, discount_data):
        """Update an existing discount"""
        discount = self.get_discount(discount_id)
        for key, value in discount_data.items():
            setattr(discount, key, value)
        discount.save()
        return discount

    def delete_discount(self, discount_id):
        """Delete a discount"""
        discount = self.get_discount(discount_id)
        discount.delete()
        return True

    def save(self, discount):
        """Save discount record"""
        discount.save()
        return discount