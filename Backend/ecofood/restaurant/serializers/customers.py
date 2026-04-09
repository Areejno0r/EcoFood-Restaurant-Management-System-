from rest_framework import serializers
from restaurant.models.customers import Customer
from restaurant.business_logic.customer_business_logic import CustomerBusinessLogic

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['customer_id', 'full_name', 'phone', 'address', 'date_joined']
        read_only_fields = ['customer_id', 'date_joined']


class CustomerSignUpSerializer(serializers.ModelSerializer):
        password = serializers.CharField(write_only=True, min_length=8)

        class Meta:
            model = Customer
            fields = ['full_name', 'phone', 'address', 'password']

        def create(self, validated_data):
            return CustomerBusinessLogic().signup(
                full_name=validated_data['full_name'],
                phone=validated_data['phone'],
                address=validated_data['address'],
                password=validated_data['password']
            )

class CustomerLoginSerializer(serializers.Serializer):
        phone = serializers.CharField()
        password = serializers.CharField(write_only=True)

        def validate(self, data):
            customer = CustomerBusinessLogic().login(
                phone=data['phone'],
                password=data['password']
            )
            return {'customer': customer}