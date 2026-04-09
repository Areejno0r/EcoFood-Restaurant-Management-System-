import React, { useState } from 'react';
import { Percent, Tag, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { apiService } from '../services/api.service';
import type { Discount } from '../types/api.types';
import './DiscountInput.css';

interface DiscountInputProps {
  orderTotal: number;
  customerId?: number;
  onDiscountApplied: (discount: {
    discount: Discount;
    discount_amount: number;
    final_total: number;
  } | null) => void;
  appliedDiscount?: {
    discount: Discount;
    discount_amount: number;
    final_total: number;
  } | null;
}

const DiscountInput: React.FC<DiscountInputProps> = ({
  orderTotal,
  customerId,
  onDiscountApplied,
  appliedDiscount
}) => {
  const [discountCode, setDiscountCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showActiveDiscounts, setShowActiveDiscounts] = useState(false);
  const [activeDiscounts, setActiveDiscounts] = useState<Discount[]>([]);

  const handleApplyDiscount = async (code?: string) => {
    const codeToApply = code || discountCode.trim();
    if (!codeToApply) {
      setError('Please enter a discount code');
      return;
    }

    setIsApplying(true);
    setError(null);

    try {
      const response = await apiService.applyDiscount(codeToApply, orderTotal, customerId);
      
      if (response.success && response.discount) {
        onDiscountApplied({
          discount: response.discount,
          discount_amount: response.discount_amount!,
          final_total: response.final_total!
        });
        setDiscountCode('');
        setError(null);
      } else {
        setError(response.message);
        onDiscountApplied(null);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to apply discount';
      setError(errorMessage);
      onDiscountApplied(null);
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemoveDiscount = () => {
    onDiscountApplied(null);
    setDiscountCode('');
    setError(null);
  };

  const loadActiveDiscounts = async () => {
    try {
      const response = await apiService.getActiveDiscounts(customerId);
      if (response.success) {
        setActiveDiscounts(response.discounts);
        setShowActiveDiscounts(true);
        
        // Show message if no discounts available
        if (response.discounts.length === 0) {
          setError(response.message || 'No discounts available at this time');
        }
      }
    } catch (err) {
      console.error('Failed to load active discounts:', err);
      setError('Failed to load available discounts');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApplyDiscount();
    }
  };

  return (
    <div className="discount-input-container">
      {appliedDiscount ? (
        <div className="applied-discount">
          <div className="discount-success">
            <CheckCircle className="success-icon" />
            <div className="discount-details">
              <span className="discount-code">
                {appliedDiscount.discount.code}
              </span>
              <span className="discount-description">
                {appliedDiscount.discount.description}
              </span>
              <span className="discount-savings">
                You saved ${appliedDiscount.discount_amount.toFixed(2)} 
                ({appliedDiscount.discount.percentage}% off)
              </span>
            </div>
            <button
              onClick={handleRemoveDiscount}
              className="remove-discount-btn"
              type="button"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="discount-input-section">
          <div className="discount-header">
            <Tag className="discount-icon" />
            <span>Have a discount code?</span>
            <button
              type="button"
              onClick={loadActiveDiscounts}
              className="view-discounts-btn"
            >
              View Available
            </button>
          </div>
          
          <div className="discount-input-group">
            <input
              type="text"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              placeholder="Enter discount code"
              className={`discount-input ${error ? 'error' : ''}`}
              disabled={isApplying}
            />
            <button
              onClick={() => handleApplyDiscount()}
              disabled={isApplying || !discountCode.trim()}
              className="apply-discount-btn"
              type="button"
            >
              {isApplying ? (
                <>
                  <Loader className="spinner" />
                  Applying...
                </>
              ) : (
                <>
                  <Percent />
                  Apply
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="discount-error">
              <AlertCircle className="error-icon" />
              {error}
            </div>
          )}

          {showActiveDiscounts && activeDiscounts.length > 0 && (
            <div className="active-discounts">
              <h4>Available Discounts:</h4>
              <div className="discounts-list">
                {activeDiscounts.map((discount) => (
                  <div key={discount.discount_id} className="discount-item">
                    <div className="discount-info">
                      <span className="code">{discount.code}</span>
                      <span className="description">{discount.description}</span>
                      <span className="percentage">{discount.percentage}% OFF</span>
                    </div>
                    <button
                      onClick={() => handleApplyDiscount(discount.code)}
                      className="apply-btn"
                      disabled={isApplying}
                    >
                      Apply
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowActiveDiscounts(false)}
                className="close-discounts-btn"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiscountInput; 