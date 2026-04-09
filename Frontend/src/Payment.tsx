import { useState } from 'react';
import './payment.css';
import { Eye } from 'lucide-react';

export default function PaymentPage() {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [deliveryMethod, setDeliveryMethod] = useState('pickup');
  const [recipientName, setRecipientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiry: '',
    cvv: ''
  });
  const [address, setAddress] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const deliveryFee = 30000; // SYR

  // Order summary (replace with your dynamic cart if needed)
  const orderSummary = [
    { id: 1, name: 'Quinoa Salad', quantity: 2, price: 25 },
    { id: 2, name: 'Natural Juice', quantity: 1, price: 10 }
  ];
  const total = orderSummary.reduce((sum, item) => sum + item.quantity * item.price, 0)+deliveryFee;

  // Card validation
  const validateCardDetails = () => {
    if (paymentMethod !== 'card') return true;
    const { cardNumber, expiry, cvv } = cardDetails;
    const cardNumberRegex = /^\d{16}$/;
    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
    const cvvRegex = /^\d{3,4}$/;
    return cardNumberRegex.test(cardNumber) && expiryRegex.test(expiry) && cvvRegex.test(cvv);
  };

  // Cash validation
  const validateCashDetails = () => {
    if (paymentMethod !== 'cash') return true;
    return recipientName.trim() !== '' && /^\+?\d{10,}$/.test(phoneNumber);
  };

  // Handle order confirmation
  const handleConfirmOrder = () => {
    setIsSubmitting(true);
    setMessage('');

    setTimeout(() => {
      if (paymentMethod === 'card' && !validateCardDetails()) {
        setMessage('Invalid card details.');
        setIsSubmitting(false);
        return;
      }
      if (paymentMethod === 'cash' && !validateCashDetails()) {
        setMessage('Please enter a valid recipient name and phone number.');
        setIsSubmitting(false);
        return;
      }
      if (deliveryMethod === 'delivery' && address.trim() === '') {
        setMessage('Please enter a delivery address.');
        setIsSubmitting(false);
        return;
      }

      // Simulate server response
      const isSuccess = Math.random() > 0.2;
      if (isSuccess) {
        setMessage(`Order confirmed successfully! Order number: ${Math.floor(Math.random() * 10000)}`);
      } else {
        setMessage('Payment failed. Please try again.');
      }
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="signup-bg">
      <div className="form-container" dir="ltr">
        <h1 className="form-title">Complete Payment</h1>

        {/* Order Summary */}
        <div className="form-group">
          <label className="block text-lg font-semibold mb-2">Order Summary</label>
          <div className="bg-gray-100 p-4 rounded-lg">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-2">Item</th>
                  <th className="py-2">Quantity</th>
                  <th className="py-2">Price</th>
                </tr>
              </thead>
              <tbody>
                {orderSummary.map(item => (
                  <tr key={item.id} className="border-b">
                    <td className="py-2">{item.name}</td>
                    <td className="py-2 text-center">{item.quantity}</td>
                    <td className="py-2">{item.price} SAR</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 font-semibold">Total: {total} SAR</p>
          </div>
        </div>

        {/* Payment Method */}
        <div className="button-group">
          <button
            className={`signup-btn${paymentMethod === 'cash' ? ' active' : ''}`}
            type="button"
            onClick={() => setPaymentMethod('cash')}
          >
            Cash
          </button>
          <button
            className={`login-btn${paymentMethod === 'card' ? ' active' : ''}`}
            type="button"
            onClick={() => setPaymentMethod('card')}
          >
            Card
          </button>
        </div>

        {/* Cash Fields */}
        {paymentMethod === 'cash' && (
          <>
            <div className="form-group">
              <label htmlFor="recipientName">Recipient Name</label>
              <input
                type="text"
                id="recipientName"
                placeholder="Enter recipient name"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number</label>
              <input
                type="tel"
                id="phoneNumber"
                placeholder="Enter phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                autoComplete="tel"
              />
            </div>
          </>
        )}

        {/* Card Fields */}
        {paymentMethod === 'card' && (
          <>
            <div className="form-group">
              <label htmlFor="cardNumber">Card Number</label>
              <input
                type="text"
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={cardDetails.cardNumber}
                onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value })}
                autoComplete="cc-number"
                maxLength={16}
              />
            </div>
            <div className="form-group flex gap-4">
              <div className="flex-1">
                <label htmlFor="expiry">Expiry Date</label>
                <input
                  type="text"
                  id="expiry"
                  placeholder="MM/YY"
                  value={cardDetails.expiry}
                  onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                  autoComplete="cc-exp"
                  maxLength={5}
                />
              </div>
              <div className="flex-1" style={{ position: 'relative' }}>
                <label htmlFor="cvv">CVV</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="cvv"
                  placeholder="123"
                  value={cardDetails.cvv}
                  onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                  autoComplete="cc-csc"
                  maxLength={4}
                />
                <button
                  type="button"
                  className="show-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label="Show CVV"
                >
                  <Eye size={20} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Delivery Method */}
        <div className="form-group">
          <label>Delivery Method</label>
          <div className="button-group">
            <button
              className={`signup-btn${deliveryMethod === 'pickup' ? ' active' : ''}`}
              type="button"
              onClick={() => setDeliveryMethod('pickup')}
            >
              Pickup from Restaurant
            </button>
            <button
              className={`login-btn${deliveryMethod === 'delivery' ? ' active' : ''}`}
              type="button"
              onClick={() => setDeliveryMethod('delivery')}
            >
              Delivery
            </button>
          </div>
        </div>

        {/* Delivery Address */}
        {deliveryMethod === 'delivery' && (
          <div className="form-group">
            <label htmlFor="address">Delivery Address</label>
            <textarea
              id="address"
              placeholder="Enter delivery address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        )}

        {/* Confirm Order Button */}
        <button
          onClick={handleConfirmOrder}
          disabled={isSubmitting}
          className="main-submit-btn"
        >
          {isSubmitting ? 'Processing...' : 'Confirm Order'}
        </button>

        {/* Result Message */}
        {message && (
          <div className={`form-footer ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
