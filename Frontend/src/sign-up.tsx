import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import './sign-up.css';
import { Eye, EyeOff, Check, AlertCircle } from 'lucide-react';

export default function SignUp() {
  const [isLoginView, setIsLoginView] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const navigate = useNavigate();
  const { login, signup } = useAuth();

  // Validation functions
  const validateField = (field: string, value: string) => {
    switch (field) {
      case 'fullName':
        return value.length < 2 ? 'Full name must be at least 2 characters' : '';
      case 'loginPhone':
        return value.length < 10 ? 'Phone number must be at least 10 digits' : '';
      case 'phoneNumber':
        return value.length < 10 ? 'Phone number must be at least 10 digits' : '';
      case 'address':
        return value.length < 5 ? 'Address must be at least 5 characters' : '';
      case 'password':
        return value.length < 6 ? 'Password must be at least 6 characters' : '';
      default:
        return '';
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    // Update field value
    switch (field) {
      case 'fullName':
        setFullName(value);
        break;
      case 'loginPhone':
        setLoginPhone(value);
        break;
      case 'phoneNumber':
        setPhoneNumber(value);
        break;
      case 'address':
        setAddress(value);
        break;
      case 'password':
        setPassword(value);
        break;
    }

    // Clear field error if user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Clear general error when user modifies form
    if (error) setError('');
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (isLoginView) {
      if (!loginPhone.trim()) {
        errors.loginPhone = 'Phone number is required for login';
      } else if (validateField('loginPhone', loginPhone)) {
        errors.loginPhone = validateField('loginPhone', loginPhone);
      }
    } else {
      if (!fullName.trim()) {
        errors.fullName = 'Full name is required';
      } else if (validateField('fullName', fullName)) {
        errors.fullName = validateField('fullName', fullName);
      }

      if (!phoneNumber.trim()) {
        errors.phoneNumber = 'Phone number is required';
      } else if (validateField('phoneNumber', phoneNumber)) {
        errors.phoneNumber = validateField('phoneNumber', phoneNumber);
      }

      if (!address.trim()) {
        errors.address = 'Address is required';
      } else if (validateField('address', address)) {
        errors.address = validateField('address', address);
      }

      if (!agreeToTerms) {
        errors.agreeToTerms = 'You must agree to the Terms & Conditions';
      }
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (validateField('password', password)) {
      errors.password = validateField('password', password);
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (isLoginView) {
        await login({ 
          phone: loginPhone.trim(),
          password: password 
        });
        setSuccess('Welcome back! Redirecting...');
        setTimeout(() => navigate('/menu'), 1500);
      } else {
        await signup({ 
          full_name: fullName.trim(), 
          phone: phoneNumber.trim(), 
          password: password,
          address: address.trim()
        });
        setSuccess('Account created successfully! You can now log in.');
        // Switch to login view after successful signup
        setTimeout(() => {
          setIsLoginView(true);
          setPassword('');
          setSuccess('');
        }, 2000);
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      
      // Handle specific field validation errors
      if (err.response?.data && typeof err.response.data === 'object') {
        const responseData = err.response.data;
        let phoneError = '';
        
        // Handle phone already exists error
        if (responseData.phone && Array.isArray(responseData.phone)) {
          phoneError = responseData.phone[0];
          if (phoneError.includes('already exists')) {
            setFieldErrors(prev => ({ ...prev, phoneNumber: phoneError }));
            setError(`Phone number already registered. Already have an account?`);
            return;
          } else {
            setFieldErrors(prev => ({ ...prev, phoneNumber: phoneError }));
          }
        }
        
        // Handle other field-specific errors
        const errors: Record<string, string> = {};
        if (responseData.full_name) {
          errors.fullName = Array.isArray(responseData.full_name) 
            ? responseData.full_name[0] 
            : responseData.full_name;
        }
        if (responseData.phone && !phoneError) {
          errors.phoneNumber = Array.isArray(responseData.phone) 
            ? responseData.phone[0] 
            : responseData.phone;
        }
        if (responseData.address) {
          errors.address = Array.isArray(responseData.address) 
            ? responseData.address[0] 
            : responseData.address;
        }
        if (responseData.password) {
          errors.password = Array.isArray(responseData.password) 
            ? responseData.password[0] 
            : responseData.password;
        }
        
        if (Object.keys(errors).length > 0) {
          setFieldErrors(prev => ({ ...prev, ...errors }));
        }
      }
      
      // Fallback to general error message
      if (!fieldErrors.phoneNumber && !Object.keys(fieldErrors).length) {
        const errorMessage = err.response?.data?.detail || 
                            err.response?.data?.message || 
                            err.message || 
                            'An error occurred. Please try again.';
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabSwitch = (loginView: boolean) => {
    setIsLoginView(loginView);
    setError('');
    setSuccess('');
    setFieldErrors({});
    // Clear form when switching
    if (loginView) {
      setPhoneNumber('');
      setAddress('');
      setAgreeToTerms(false);
    } else {
      setLoginPhone('');
      setRememberMe(false);
    }
  };

  const getFieldClassName = (field: string) => {
    if (fieldErrors[field]) return 'error';
    if (field === 'fullName' && fullName && !fieldErrors[field] && !isLoginView) return 'success';
    if (field === 'loginPhone' && loginPhone && !fieldErrors[field] && isLoginView) return 'success';
    if (field === 'password' && password && !fieldErrors[field]) return 'success';
    if (field === 'phoneNumber' && phoneNumber && !fieldErrors[field]) return 'success';
    if (field === 'address' && address && !fieldErrors[field]) return 'success';
    return '';
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-header">
          <h1>EcoFood</h1>
          <p>{isLoginView ? 'Welcome back! Please sign in to your account' : 'Create your account to get started'}</p>
        </div>

        <div className="tab-buttons">
          <button 
            className={isLoginView ? 'active' : ''} 
            onClick={() => handleTabSwitch(true)}
            type="button"
          >
            Sign In
          </button>
          <button 
            className={!isLoginView ? 'active' : ''} 
            onClick={() => handleTabSwitch(false)}
            type="button"
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={16} style={{ marginRight: '8px' }} />
            {error}
            {error.includes('Phone number already registered') && !isLoginView && (
              <button 
                type="button"
                onClick={() => {
                  handleTabSwitch(true);
                  setLoginPhone(phoneNumber); // Pre-fill the phone number
                }}
                className="link-button"
                style={{ marginLeft: '8px', textDecoration: 'underline' }}
              >
                Sign in here
              </button>
            )}
          </div>
        )}

        {success && (
          <div className="success-message">
            <Check size={16} style={{ marginRight: '8px' }} />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-group">
            <label htmlFor="phone">{isLoginView ? 'Phone Number' : 'Full Name'}</label>
            <input
              type="tel"
              id="phone"
              value={isLoginView ? loginPhone : fullName}
              onChange={(e) => handleFieldChange(isLoginView ? 'loginPhone' : 'fullName', e.target.value)}
              placeholder={isLoginView ? "Enter your phone number" : "Enter your full name"}
              className={getFieldClassName(isLoginView ? 'loginPhone' : 'fullName')}
              disabled={isLoading}
              required
            />
            {isLoginView && fieldErrors.loginPhone && (
              <small style={{ color: '#e53e3e', fontSize: '12px', marginTop: '4px' }}>
                {fieldErrors.loginPhone}
              </small>
            )}
            {!isLoginView && fieldErrors.fullName && (
              <small style={{ color: '#e53e3e', fontSize: '12px', marginTop: '4px' }}>
                {fieldErrors.fullName}
              </small>
            )}
          </div>

          {!isLoginView && (
            <>
              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => handleFieldChange('phoneNumber', e.target.value)}
                  placeholder="Enter your phone number"
                  className={getFieldClassName('phoneNumber')}
                  disabled={isLoading}
                  required
                />
                {fieldErrors.phoneNumber && (
                  <small style={{ color: '#e53e3e', fontSize: '12px', marginTop: '4px' }}>
                    {fieldErrors.phoneNumber}
                  </small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input
                  type="text"
                  id="address"
                  value={address}
                  onChange={(e) => handleFieldChange('address', e.target.value)}
                  placeholder="Enter your address"
                  className={getFieldClassName('address')}
                  disabled={isLoading}
                  required
                />
                {fieldErrors.address && (
                  <small style={{ color: '#e53e3e', fontSize: '12px', marginTop: '4px' }}>
                    {fieldErrors.address}
                  </small>
                )}
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => handleFieldChange('password', e.target.value)}
                placeholder="Enter your password"
                className={getFieldClassName('password')}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {fieldErrors.password && (
              <small style={{ color: '#e53e3e', fontSize: '12px', marginTop: '4px' }}>
                {fieldErrors.password}
              </small>
            )}
          </div>

          <div className="form-options">
            {isLoginView ? (
              <>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                  />
                  Remember me
                </label>
                <a href="#" className="forgot-password">
                  Forgot password?
                </a>
              </>
            ) : (
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  disabled={isLoading}
                  required
                />
                I agree to the Terms & Conditions
              </label>
            )}
          </div>

          {fieldErrors.agreeToTerms && (
            <small style={{ color: '#e53e3e', fontSize: '12px', marginTop: '-16px' }}>
              {fieldErrors.agreeToTerms}
            </small>
          )}

          <button 
            type="submit" 
            className={`submit-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? '' : (isLoginView ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="signup-footer">
          <p>
            {isLoginView ? "Don't have an account? " : "Already have an account? "}
            <button 
              className="link-button" 
              onClick={() => handleTabSwitch(!isLoginView)}
              type="button"
              disabled={isLoading}
            >
              {isLoginView ? 'Create one here' : 'Sign in here'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}