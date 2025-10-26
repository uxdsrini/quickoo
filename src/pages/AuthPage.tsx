import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Loader2, Mail, Lock, User, X, FileText } from 'lucide-react';

interface AuthPageProps {
  onSignUpSuccess?: () => void;
  onSignInSuccess?: () => void;
}

export function AuthPage({ onSignUpSuccess, onSignInSuccess }: AuthPageProps) {
  const { signUp, signIn } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsPopup, setShowTermsPopup] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation for signup
    if (isSignUp) {
      if (formData.password !== formData.confirmPassword) {
        alert('Passwords do not match!');
        return;
      }
      if (!termsAccepted) {
        alert('Please accept the Terms and Conditions to continue.');
        return;
      }
    }
    
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(formData.email, formData.password, formData.fullName);
        if (error) throw error;

        if (onSignUpSuccess) {
          onSignUpSuccess();
        }
      } else {
        const { error } = await signIn(formData.email, formData.password);
        if (error) throw error;

        if (onSignInSuccess) {
          onSignInSuccess();
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An error occurred. Please try again.';
      alert(message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {isSignUp ? 'Create an Account' : 'Welcome Back'}
          </h2>
          <p className="text-gray-600">
            {isSignUp
              ? 'Sign up to start ordering fresh groceries'
              : 'Sign in to continue shopping'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lock className="w-4 h-4 inline mr-1" />
                Password
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter your password"
                minLength={6}
              />
              {isSignUp && (
                <p className="text-xs text-gray-500 mt-1">
                  Password must be at least 6 characters
                </p>
              )}
            </div>

            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="w-4 h-4 inline mr-1" />
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Confirm your password"
                  minLength={6}
                />
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">
                    Passwords do not match
                  </p>
                )}
              </div>
            )}

            {isSignUp && (
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 mt-1"
                />
                <label htmlFor="terms" className="text-sm text-gray-700">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => setShowTermsPopup(true)}
                    className="text-emerald-600 hover:text-emerald-700 underline"
                  >
                    Terms and Conditions
                  </button>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : isSignUp ? (
                'Sign Up'
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setFormData({ email: '', password: '', confirmPassword: '', fullName: '' });
                setTermsAccepted(false);
              }}
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              {isSignUp
                ? 'Already have an account? Sign In'
                : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>

      {/* Terms and Conditions Popup */}
      {showTermsPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Terms and Conditions
              </h3>
              <button
                onClick={() => setShowTermsPopup(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-96">
              <div className="space-y-4">
                <p className="text-gray-700 mb-4">
                  By using GroceryMart, you agree to the following terms and conditions:
                </p>
                
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <span className="text-emerald-600 font-semibold min-w-[24px]">1.</span>
                    <p className="text-gray-700">You must be at least 18 years old to use our services and place orders.</p>
                  </div>
                  
                  <div className="flex gap-3">
                    <span className="text-emerald-600 font-semibold min-w-[24px]">2.</span>
                    <p className="text-gray-700">All product information, prices, and availability are subject to change without notice.</p>
                  </div>
                  
                  <div className="flex gap-3">
                    <span className="text-emerald-600 font-semibold min-w-[24px]">3.</span>
                    <p className="text-gray-700">You are responsible for providing accurate delivery information and being available during delivery windows.</p>
                  </div>
                  
                  <div className="flex gap-3">
                    <span className="text-emerald-600 font-semibold min-w-[24px]">4.</span>
                    <p className="text-gray-700">Payment must be completed before order processing. We accept UPI, cards, and cash on delivery.</p>
                  </div>
                  
                  <div className="flex gap-3">
                    <span className="text-emerald-600 font-semibold min-w-[24px]">5.</span>
                    <p className="text-gray-700">Orders can be cancelled within 30 minutes of placement. After that, cancellation may not be possible.</p>
                  </div>
                  
                  <div className="flex gap-3">
                    <span className="text-emerald-600 font-semibold min-w-[24px]">6.</span>
                    <p className="text-gray-700">We reserve the right to refuse service or cancel orders for any reason, including suspected fraud.</p>
                  </div>
                  
                  <div className="flex gap-3">
                    <span className="text-emerald-600 font-semibold min-w-[24px]">7.</span>
                    <p className="text-gray-700">Your personal information will be protected according to our Privacy Policy and used only for order fulfillment.</p>
                  </div>
                  
                  <div className="flex gap-3">
                    <span className="text-emerald-600 font-semibold min-w-[24px]">8.</span>
                    <p className="text-gray-700">Quality issues must be reported within 24 hours of delivery for refund or replacement consideration.</p>
                  </div>
                  
                  <div className="flex gap-3">
                    <span className="text-emerald-600 font-semibold min-w-[24px]">9.</span>
                    <p className="text-gray-700">Delivery charges apply based on location and order value. Minimum order requirements may apply in certain areas.</p>
                  </div>
                  
                  <div className="flex gap-3">
                    <span className="text-emerald-600 font-semibold min-w-[24px]">10.</span>
                    <p className="text-gray-700">These terms may be updated periodically. Continued use of the service constitutes acceptance of any changes.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowTermsPopup(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setTermsAccepted(true);
                  setShowTermsPopup(false);
                }}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Accept Terms
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
