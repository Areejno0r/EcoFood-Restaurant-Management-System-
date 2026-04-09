from restaurant.services import PaymentService
from restaurant.repositories.payment_repository import PaymentRepository
from restaurant.models.payment import Payment, PaymentMethod
from restaurant.models.order import Order
from restaurant.models.discount import Discount
from restaurant.models.menu_item import MenuItem
from restaurant.models.ingredient import Ingredient
from restaurant.orders_states import  PendingState ,PreparingState,CanceledState, DeliveredState
from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from restaurant.repositories.order_repository import OrderRepository
from restaurant.models.customers import Customer
from restaurant.payment_services.cash import CashPayment

class OrderBusinessLogic:
    def __init__(self):
        self.payment_service = PaymentService()
        self.payment_repository = PaymentRepository()
        self.order_repository=OrderRepository()

    @transaction.atomic
    def process_order(self, order_data):
        """معالجة طلب جديد مع دفع مرتبط"""
        try:
            # التحقق من العميل
            customer = Customer.objects.get(customer_id=order_data["customer_id"])
        except ObjectDoesNotExist:
            raise ValueError(f"Invalid customer ID: {order_data['customer_id']}")
    
        try:
            # التحقق من طريقة الدفع
            payment_method = PaymentMethod.objects.get(method=order_data["payment_method"])
            if not payment_method.is_active:
                raise ValueError(f"Payment method {order_data['payment_method']} is disabled")
        except ObjectDoesNotExist:
            raise ValueError(f"Invalid payment method: {order_data['payment_method']}")
        
        discount = None
        if order_data.get("discount_id"):
            try:
                discount = Discount.objects.get(discount_id=order_data["discount_id"])
            except ObjectDoesNotExist:
                raise ValueError(f"Invalid discount ID: {order_data['discount_id']}")

        # معالجة الدفع أولاً قبل إنشاء الطلب
        try:
            payment_result = self.payment_service.process_payment(
                payment_method=payment_method,
                amount=order_data["total_amount"],
                payment_details=order_data.get("payment", {})
            )

            # فحص نتيجة الدفع قبل إنشاء الطلب
            if payment_result["status"] == "failed":
                error_msg = payment_result.get("error", "Payment processing failed")
                raise ValueError(f"Payment failed: {error_msg}")
                
        except Exception as e:
            raise ValueError(f"Payment processing failed: {str(e)}")
                                                                    
        # إنشاء الطلب فقط إذا نجح الدفع أو كان نقدي
        order = Order.objects.create(
            customer=customer,
            total_amount=order_data["total_amount"],
            state=PendingState().get_status()
        )
        order.discount = discount
        self.order_repository.save(order)

        try:
            # إنشاء سجل الدفع
            payment = Payment(
                order=order,
                amount=order_data["total_amount"],
                payment_method=payment_method,
                status=payment_result["status"],
                transaction_id=payment_result["payment_id"]
            )
            self.payment_repository.save(payment)

            # ربط الدفع بالطلب باستخدام العلاقة الجديدة
            order.payment = payment
            self.order_repository.save(order)

            # الطلب يبقى في حالة pending للموافقة الإدارية
            # سيتم تحويله إلى preparing من خلال الإدارة
            
            return order
            
        except Exception as e:
            # في حالة فشل حفظ بيانات الدفع، احذف الطلب
            order.delete()
            raise ValueError(f"Failed to save payment information: {str(e)}")
    

    def get_order(self, order_id):
        return self.order_repository.get_by_id(order_id)

    def transition_to_next_state(self, order_id):
        """الانتقال إلى الحالة التالية"""
        order = self.get_order(order_id)
        order.transition_to_next_state()
        return order
    
    def delete_order(self, order_id):
        """حذف الطلب مع التحقق من الحالة"""
        order = self.get_order(order_id)
        if order.state in ["delivered", "canceled"]:
            raise ValueError(f"Cannot delete order in {order.state} state")
        self.order_repository.delete(order_id)
        return True
    
    @transaction.atomic
    def complete_order_delivery(self, order_id):
        """Complete order delivery and handle cash payment if applicable"""
        order = self.get_order(order_id)
        
        # Set order state to delivered
        order.set_state(DeliveredState())
        self.order_repository.save(order)
        
        # If payment method is cash and status is pending, mark as completed
        if (order.payment and 
            order.payment.payment_method.method == "cash" and 
            order.payment.status == "pending"):
            
            # Complete the cash payment
            cash_service = CashPayment()
            payment_result = cash_service.complete_cash_payment(order.payment.transaction_id)
            
            # Update payment status
            order.payment.status = payment_result["status"]
            self.payment_repository.save(order.payment)
        
        return order
    
    @transaction.atomic
    def add_item_to_order(self, order_id, menu_item_id, quantity, ingredients_ids=None):
        """إضافة عنصر إلى الطلب"""
        order = self.get_order(order_id)
        if order.state in ["delivered", "canceled"]:
            raise ValueError(f"Cannot add items to order in {order.state} state")

        try:
            menu_item = MenuItem.objects.get(menu_item_id=menu_item_id)
            if not menu_item.is_available:
                raise ValueError(f"Menu item {menu_item.name} is not available")
        except ObjectDoesNotExist:
            raise ValueError(f"Invalid menu item ID: {menu_item_id}")

        ingredients = []
        if ingredients_ids:  # التأكد من أن ingredients_ids ليست None
            try:
                ingredients = Ingredient.objects.filter(ingredient_id__in=ingredients_ids)
                if len(ingredients) != len(ingredients_ids):
                    raise ValueError("One or more ingredients are invalid")
                for ingredient in ingredients:
                    if ingredient.stock_quantity < quantity:
                        raise ValueError(f"Insufficient stock for ingredient {ingredient.name}")
            except TypeError:
                raise ValueError("Ingredients IDs must be a list")

        order_item = self.order_repository.add_item_to_order(
            order=order,
            menu_item=menu_item,
            quantity=quantity,
            price=menu_item.price,
            ingredients=ingredients
        )
        order = self.order_repository.update_total_amount(order_id)
        return order_item