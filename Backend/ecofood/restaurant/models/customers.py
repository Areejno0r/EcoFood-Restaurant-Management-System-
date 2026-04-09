from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone

class CustomerManager(BaseUserManager):
    def create_user(self, phone, password=None, **extra_fields):
        if not phone:
            raise ValueError('The Phone number must be set')
        # Normalize the phone number if necessary
        # phone = self.normalize_phone(phone) # Example
        user = self.model(phone=phone, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(phone, password, **extra_fields)

class Customer(AbstractBaseUser, PermissionsMixin):
    customer_id = models.AutoField(primary_key=True)
    full_name = models.CharField(max_length=255) # Changed from 100 to 255 for consistency
    phone = models.CharField(max_length=20, unique=True) # Changed from 15 to 20 for consistency
    address = models.TextField(blank=True, null=True) # Add address field back
    # password = models.CharField(max_length=128) # Removed password field, handled by AbstractBaseUser
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False) # Required for Django admin and staff access
    date_joined = models.DateTimeField(default=timezone.now) # Standard field for user models
    # created_at = models.DateTimeField(auto_now_add=True) # Replaced by date_joined

    objects = CustomerManager() # Add the custom manager

    USERNAME_FIELD = 'phone' # Use phone for login
    REQUIRED_FIELDS = ['full_name'] # Required fields for createsuperuser

    def __str__(self):
        return self.full_name # Simplified __str__ method