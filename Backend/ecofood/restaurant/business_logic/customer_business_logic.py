from django.contrib.auth.hashers import make_password, check_password
from django.core.exceptions import ValidationError
from restaurant.repositories.customer_repository import CustomerRepository
from restaurant.models import Customer
from django.db import IntegrityError
import re

class CustomerBusinessLogic:
    def __init__(self):
        self.repository = CustomerRepository()

    def signup(self, full_name, phone, address, password):
        """إنشاء عميل جديد (Sign Up)"""
        # التحقق من صحة البيانات
        if not full_name or len(full_name.strip()) < 2:
            raise ValidationError("Full name must be at least 2 characters long")
        
        # التحقق من تنسيق رقم الهاتف (مثال: يبدأ بـ + أو أرقام فقط)
        if not re.match(r'^\+?\d{9,15}$', phone):
            raise ValidationError("Invalid phone number format")
        
        if not address or len(address.strip()) < 5:
            raise ValidationError("Address must be at least 5 characters long")
        
        if not password or len(password) < 8:
            raise ValidationError("Password must be at least 8 characters long")

        # تشفير كلمة المرور
        hashed_password = make_password(password)

        try:
            customer = self.repository.create(
                full_name=full_name,
                phone=phone,
                address=address,
                password=hashed_password
            )
            return customer
        except IntegrityError:
            raise ValidationError("Phone number already exists")

    def login(self, phone, password):
        """تسجيل الدخول (Login)"""
        try:
            # البحث عن العميل باستخدام phone number
            customer = Customer.objects.filter(phone=phone).first()
            if not customer:
                raise ValidationError("Invalid phone number or password")

            # التحقق من كلمة المرور
            if not check_password(password, customer.password):
                raise ValidationError("Invalid phone number or password")

            return customer
        except Customer.DoesNotExist:
            raise ValidationError("Invalid phone number or password")