from abc import ABC, abstractmethod

class PaymentStrategy(ABC):
    @abstractmethod
    def process_payment(self, amount, payment_details):
        """معالجة الدفع"""
        pass

    @abstractmethod
    def refund_payment(self, payment_id):
        """استرداد الدفع"""
        pass