from restaurant.payment_services.paymentstrategy import PaymentStrategy
import uuid

class CashPayment(PaymentStrategy):
    def process_payment(self, amount, payment_details):
        print(f"Processing cash on delivery payment of {amount}")
        
        # Generate transaction ID for tracking
        transaction_id = f"cash_{uuid.uuid4().hex[:8]}"
        
        # Cash payments remain pending until delivery completion
        return {
            "payment_id": transaction_id, 
            "status": "pending",
            "method": "cash"
        }

    def refund_payment(self, payment_id):
        print(f"Refunding payment {payment_id} via cash")
        return {"status": "refunded"}
    
    def complete_cash_payment(self, payment_id):
        """Mark cash payment as completed upon delivery"""
        print(f"Completing cash payment {payment_id}")
        return {"status": "success"}