from django.core.exceptions import ObjectDoesNotExist
from restaurant.models.customers import Customer

class CustomerRepository:
    def create(self, full_name, phone, address, password):
        """إنشاء عميل جديد"""
        customer = Customer(
            full_name=full_name,
            phone=phone,
            address=address,
            password=password
        )
        customer.save()
        return customer

    def get_by_id(self, customer_id):
        """جلب عميل بناءً على المعرّف"""
        try:
            return Customer.objects.get(customer_id=customer_id)
        except ObjectDoesNotExist:
            raise ObjectDoesNotExist(f"Customer with ID {customer_id} not found")

    def get_by_phone(self, phone):
        """جلب عميل بناءً على رقم الهاتف"""
        try:
            return Customer.objects.get(phone=phone)
        except ObjectDoesNotExist:
            raise ObjectDoesNotExist(f"Customer with phone {phone} not found")

    def update(self, customer_id, **kwargs):
        """تحديث بيانات العميل"""
        customer = self.get_by_id(customer_id)
        for key, value in kwargs.items():
            setattr(customer, key, value)
        customer.save()
        return customer

    def delete(self, customer_id):
        """حذف عميل بناءً على المعرّف"""
        customer = self.get_by_id(customer_id)
        customer.delete()
        return True