from restaurant.repositories.discount_repository import DiscountRepository
from restaurant.repositories.discount_usage_repository import DiscountUsageRepository
from django.utils import timezone
from decimal import Decimal
from django.core.exceptions import ValidationError

class DiscountBusinessLogic:
    def __init__(self):
        self.repo = DiscountRepository()
        self.usage_repo = DiscountUsageRepository()

    def create_discount(self, discount_data):
        """Create a new discount"""
        return self.repo.create_discount(discount_data)

    def update_discount(self, discount_id, discount_data):
        """Update an existing discount"""
        return self.repo.update_discount(discount_id, discount_data)

    def remove_discount(self, discount_id):
        """Delete a discount"""
        return self.repo.delete_discount(discount_id)

    def validate_and_apply_discount(self, discount_code, order_total, customer_id=None):
        """Validate discount code and calculate discount amount"""
        try:
            discount = self.repo.get_discount_by_code(discount_code)
            
            if not discount:
                raise ValidationError("Invalid discount code")
            
            if not discount.is_active:
                raise ValidationError("This discount code is no longer active")
            
            now = timezone.now()
            if discount.valid_from > now:
                raise ValidationError("This discount code is not yet valid")
            
            if discount.valid_to < now:
                raise ValidationError("This discount code has expired")
            
            # Check if customer has already used this discount
            if customer_id and self.usage_repo.has_customer_used_discount(customer_id, discount.discount_id):
                raise ValidationError("You have already used this discount code")
            
            # Calculate discount amount
            discount_amount = (Decimal(str(order_total)) * discount.percentage) / Decimal('100')
            
            return {
                'discount': discount,
                'discount_amount': float(discount_amount),
                'final_total': float(Decimal(str(order_total)) - discount_amount)
            }
            
        except Exception as e:
            raise ValidationError(f"Error applying discount: {str(e)}")

    def record_discount_usage(self, customer_id, discount_id, order_id=None):
        """Record that a customer has used a discount"""
        return self.usage_repo.record_discount_usage(customer_id, discount_id, order_id)

    def get_customer_available_discounts(self, customer_id):
        """Get discounts that the customer hasn't used yet"""
        all_active_discounts = self.repo.get_active_discounts()
        available_discounts = []
        
        for discount in all_active_discounts:
            if not self.usage_repo.has_customer_used_discount(customer_id, discount.discount_id):
                available_discounts.append(discount)
        
        return available_discounts

    def get_active_discounts(self):
        """Get all currently active discounts"""
        return self.repo.get_active_discounts()