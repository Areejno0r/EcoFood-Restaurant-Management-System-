from restaurant.payment_services.paymentstrategy import PaymentStrategy
import uuid
import random

class CreditCardPayment(PaymentStrategy):
    def process_payment(self, amount, payment_details):
        print(f"Processing credit card payment of {amount} with details: {payment_details}")
        
        # Generate transaction ID
        transaction_id = f"card_{uuid.uuid4().hex[:8]}"
        
        # Simulate credit card processing (5% failure rate)
        # In real implementation, this would call external payment gateway
        success_rate = 0.95  # 95% success rate for simulation
        
        if random.random() < success_rate:
            return {
                "payment_id": transaction_id, 
                "status": "success",
                "method": "credit_card"
            }
        else:
            return {
                "payment_id": transaction_id, 
                "status": "failed",
                "method": "credit_card",
                "error": "Credit card payment declined by bank"
            }

    def refund_payment(self, payment_id):
        print(f"Refunding payment {payment_id} via credit card")
        return {"status": "refunded"}