from restaurant.models.discount_usage import DiscountUsage
from django.core.exceptions import ObjectDoesNotExist

class DiscountUsageRepository:
    def has_customer_used_discount(self, customer_id, discount_id):
        """Check if a customer has already used a specific discount"""
        return DiscountUsage.objects.filter(
            customer_id=customer_id,
            discount_id=discount_id
        ).exists()

    def record_discount_usage(self, customer_id, discount_id, order_id=None):
        """Record that a customer has used a discount"""
        try:
            usage = DiscountUsage.objects.create(
                customer_id=customer_id,
                discount_id=discount_id,
                order_id=order_id
            )
            return usage
        except Exception as e:
            # Handle the case where usage already exists
            return None

    def get_customer_discount_usage(self, customer_id):
        """Get all discounts used by a customer"""
        return DiscountUsage.objects.filter(customer_id=customer_id).select_related('discount')

    def get_discount_usage_stats(self, discount_id):
        """Get usage statistics for a discount"""
        usages = DiscountUsage.objects.filter(discount_id=discount_id)
        return {
            'total_uses': usages.count(),
            'unique_customers': usages.values('customer').distinct().count()
        }

    def get_usage_by_id(self, usage_id):
        """Get discount usage by ID"""
        try:
            return DiscountUsage.objects.select_related('customer', 'discount', 'order').get(usage_id=usage_id)
        except ObjectDoesNotExist:
            raise ObjectDoesNotExist(f"Discount usage with ID {usage_id} not found")

    def delete_usage(self, usage_id):
        """Delete a discount usage record"""
        usage = self.get_usage_by_id(usage_id)
        usage.delete()
        return True 