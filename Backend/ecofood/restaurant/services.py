from restaurant.payment_services.credit_card import CreditCardPayment
from restaurant.payment_services.cash import CashPayment
from restaurant.models import PaymentMethod

class PaymentService:
    def __init__(self):
        self._strategies = None

    @property
    def strategies(self):
        """Lazy load payment strategies"""
        if self._strategies is None:
            self._strategies = self._load_strategies()
        return self._strategies

    def _load_strategies(self):
        """Load payment strategies from database"""
        try:
            active_methods = PaymentMethod.objects.filter(is_active=True)
            return {
                method.method: self._get_strategy(method.method)
                for method in active_methods
            }
        except Exception as e:
            # Fallback to default strategies if database is not available
            return {
                "credit_card": CreditCardPayment(),
                "cash": CashPayment(),
            }

    def _get_strategy(self, method):
        strategy_map = {
            "credit_card": CreditCardPayment(),
            "cash": CashPayment(),
        }
        return strategy_map.get(method, None)

    def process_payment(self, payment_method, amount, payment_details):
        if isinstance(payment_method, PaymentMethod):
            method = payment_method.method
        else:
            method = payment_method

        strategy = self.strategies.get(method)
        if not strategy:
            raise ValueError(f"Unsupported payment method: {method}")
        return strategy.process_payment(amount, payment_details)

    def refund_payment(self, payment_method, payment_id):
        if isinstance(payment_method, PaymentMethod):
            method = payment_method.method
        else:
            method = payment_method

        strategy = self.strategies.get(method)
        if not strategy:
            raise ValueError(f"Unsupported payment method: {method}")
        return strategy.refund_payment(payment_id)