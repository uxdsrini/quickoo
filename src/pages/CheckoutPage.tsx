import { useState, useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../hooks/useAuth';
import { Loader2, CreditCard, Banknote, CheckCircle, Copy } from 'lucide-react';

interface CheckoutPageProps {
  onSuccess: () => void;
  onBack: () => void;
}

export function CheckoutPage({ onSuccess, onBack }: CheckoutPageProps) {
  const { items, getTotalPrice, clearCart, currentShopId } = useCart();
  const { user, userProfile, isProfileComplete } = useAuth();
  const [loading, setLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isEditingDelivery, setIsEditingDelivery] = useState(false);

  const copyUpiId = async () => {
    const upiId = '830991303@sbi';
    try {
      await navigator.clipboard.writeText(upiId);
      alert('UPI ID copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy UPI ID:', err);
      alert('Failed to copy UPI ID. Please copy manually: ' + upiId);
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    paymentMethod: 'cod',
    notes: '',
    couponCode: '',
  });

  // Prefill form with user profile data
  useEffect(() => {
    if (user && userProfile && isProfileComplete()) {
      setFormData(prev => ({
        ...prev,
        name: userProfile.fullName || prev.name,
        phone: userProfile.phone || prev.phone,
        address: userProfile.address ? `${userProfile.address}, ${userProfile.city} - ${userProfile.pincode}` : prev.address,
      }));
    }
  }, [user, userProfile, isProfileComplete]);

  const subtotal = getTotalPrice();
  const deliveryFee = 0; // Always FREE
  const platformCharges = 10; // Fixed 10 INR platform charges
  const discount = 0; // Coupon discount (can be implemented later)
  const total = subtotal + deliveryFee + platformCharges - discount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Please sign in to place an order');
      return;
    }

    if (!currentShopId) {
      alert('No items in cart');
      return;
    }

    // Use profile data if available and not editing, otherwise use form data
    const deliveryName = userProfile && isProfileComplete() && !isEditingDelivery ? userProfile.fullName : formData.name;
    const deliveryPhone = userProfile && isProfileComplete() && !isEditingDelivery ? userProfile.phone : formData.phone;
    const deliveryAddress = userProfile && isProfileComplete() && !isEditingDelivery
      ? `${userProfile.address}, ${userProfile.city} - ${userProfile.pincode}` 
      : formData.address;

    // Validate required fields
    if (!deliveryName || !deliveryPhone || !deliveryAddress) {
      alert('Please fill in all required delivery information');
      return;
    }

    setLoading(true);

    try {
      const orderNumber = `ORD-${Date.now()}`;

      const orderData = {
        userId: user.uid,
        storeId: currentShopId,
        orderNumber,
        status: 'pending',
        paymentMethod: formData.paymentMethod,
        paymentStatus: formData.paymentMethod === 'cod' ? 'pending' : 'paid',
        subtotal,
        discountAmount: discount,
        deliveryFee,
        platformCharges,
        totalAmount: total,
        deliveryAddress,
        customerPhone: deliveryPhone,
        customerName: deliveryName,
        notes: formData.notes || '',
        couponCode: formData.couponCode || '',
        items: items.map(item => ({
          productId: item.id,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity,
        })),
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'orders'), orderData);

      setOrderPlaced(true);
      clearCart();
      setIsEditingDelivery(false); // Reset editing state

      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h2>
          <p className="text-gray-600 mb-6">
            Your order has been confirmed and will be delivered soon.
          </p>
          <div className="bg-emerald-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-emerald-800 font-medium">
              You'll receive updates on your order status
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Checkout</h1>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Delivery Information</h2>
              {user && userProfile && isProfileComplete() && !isEditingDelivery && (
                <button
                  type="button"
                  onClick={() => setIsEditingDelivery(true)}
                  className="text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                >
                  Edit
                </button>
              )}
            </div>
            {user && userProfile && isProfileComplete() && !isEditingDelivery ? (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <p className="text-sm text-emerald-800 mb-2 font-medium">
                    Using your profile information for delivery
                  </p>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Name:</span> {userProfile.fullName}</p>
                    <p><span className="font-medium">Phone:</span> {userProfile.phone}</p>
                    <p><span className="font-medium">Address:</span> {userProfile.address}, {userProfile.city} - {userProfile.pincode}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {user && userProfile && !isProfileComplete() && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800">
                      💡 <span className="font-medium">Tip:</span> Complete your profile to skip filling delivery details in future orders.
                    </p>
                  </div>
                )}
                {isEditingDelivery && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex justify-between items-center">
                    <p className="text-sm text-blue-800">
                      ✏️ <span className="font-medium">Edit delivery</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingDelivery(false);
                        // Reset form data to profile info
                        if (userProfile) {
                          setFormData(prev => ({
                            ...prev,
                            name: userProfile.fullName,
                            phone: userProfile.phone,
                            address: userProfile.address ? `${userProfile.address}, ${userProfile.city} - ${userProfile.pincode}` : prev.address,
                          }));
                        }
                      }}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      Save
                    </button>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Address *
                  </label>
                  <textarea
                    required
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Enter complete delivery address"
                  />
                </div>
              </div>
            )}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Instructions (Optional)
              </label>
              <input
                type="text"
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Any special instructions"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Method</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-emerald-500 transition-colors">
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={formData.paymentMethod === 'cod'}
                  onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-4 h-4 text-emerald-600"
                />
                <Banknote className="w-6 h-6 text-gray-600" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Cash on Delivery</p>
                  <p className="text-sm text-gray-500">Pay when you receive</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-emerald-500 transition-colors">
                <input
                  type="radio"
                  name="payment"
                  value="upi"
                  checked={formData.paymentMethod === 'upi'}
                  onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-4 h-4 text-emerald-600"
                />
                <CreditCard className="w-6 h-6 text-gray-600" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">UPI Payment</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-500">Call me 9963650466</p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        copyUpiId();
                      }}
                      className="text-blue-600 hover:text-blue-700 p-1 rounded transition-colors"
                      title="Copy UPI ID"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
            
            {/* Coupon Code - Optional */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Coupon Code (Optional)
              </label>
              <input
                type="text"
                value={formData.couponCode}
                onChange={e => setFormData({ ...formData, couponCode: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter coupon code"
              />
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Product Price ({items.length} items)</span>
                <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span className="font-semibold text-emerald-600">FREE</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Platform Charges</span>
                <span className="font-semibold">₹{platformCharges.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Coupon Discount</span>
                  <span className="font-semibold">-₹{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
                <span>Total Amount</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Placing Order...
                </>
              ) : (
                'Place Order'
              )}
            </button>
            <button
              type="button"
              onClick={onBack}
              className="w-full mt-3 bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Back to Cart
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
