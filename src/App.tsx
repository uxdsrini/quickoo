import { useState, useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { CartProvider, useCart } from './contexts/CartContext';
import { HomePage } from './pages/HomePage';
import { ShopDetailPage } from './pages/ShopDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrdersPage } from './pages/OrdersPage';
import { ProfilePage } from './pages/ProfilePage';
import { AuthPage } from './pages/AuthPage';
import { ShoppingCart, Package, User as UserIcon, Home } from 'lucide-react';
import logoSvg from './assets/logo.svg';

type Page = 'home' | 'shop' | 'cart' | 'checkout' | 'orders' | 'profile' | 'auth';

function AppContent() {
  const { user, userProfile, isProfileComplete, loading } = useAuth();
  const { getTotalItems } = useCart();
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [hasCheckedProfile, setHasCheckedProfile] = useState(false);
  const [intendedDestination, setIntendedDestination] = useState<Page | null>(null);
  const [showCartReviewMessage, setShowCartReviewMessage] = useState(false);

  const handleShopSelect = (shopId: string) => {
    setSelectedShopId(shopId);
    setCurrentPage('shop');
  };

  // Navigate after login with intended destination support
  useEffect(() => {
    if (user && !loading && !hasCheckedProfile) {
      setHasCheckedProfile(true);
      
      if (currentPage === 'auth') {
        // If user was trying to go somewhere specific before login
        if (intendedDestination) {
          // Check if they can access the intended destination
          if (intendedDestination === 'checkout' && !isProfileComplete()) {
            alert('Please complete your profile before placing an order');
            setCurrentPage('profile');
          } else {
            // If returning to cart after login, show review message
            if (intendedDestination === 'cart') {
              setShowCartReviewMessage(true);
            }
            setCurrentPage(intendedDestination);
          }
          setIntendedDestination(null); // Clear the intended destination
        } else {
          // Default navigation to home
          setCurrentPage('home');
        }
      }
    } else if (!user) {
      setHasCheckedProfile(false);
      setIntendedDestination(null); // Clear intended destination when user logs out
    }
  }, [user, loading, hasCheckedProfile, currentPage, intendedDestination, isProfileComplete]);

  const handleNavigation = (page: Page) => {
    if (page === 'profile' || page === 'orders' || page === 'checkout') {
      if (!user) {
        // For checkout, redirect to cart after login so user can review items
        if (page === 'checkout') {
          setIntendedDestination('cart');
        } else {
          // For other protected pages, remember the exact destination
          setIntendedDestination(page);
        }
        setCurrentPage('auth');
        return;
      }
      // Check if profile is complete for checkout
      if (page === 'checkout' && !isProfileComplete()) {
        // Remember that user wanted to go to checkout after profile completion
        setIntendedDestination('checkout');
        alert('Please complete your profile before placing an order');
        setCurrentPage('profile');
        return;
      }
    }
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <HomePage 
            onShopSelect={handleShopSelect}
            onNavigateToProfile={() => setCurrentPage('profile')}
          />
        );
      case 'shop':
        return selectedShopId ? (
          <ShopDetailPage
            shopId={selectedShopId}
            onBack={() => setCurrentPage('home')}
            onNavigateToCart={() => setCurrentPage('cart')}
          />
        ) : (
          <HomePage onShopSelect={handleShopSelect} />
        );
      case 'cart':
        return (
          <CartPage
            onCheckout={() => handleNavigation('checkout')}
            showReviewMessage={showCartReviewMessage}
            onReviewMessageDismiss={() => setShowCartReviewMessage(false)}
          />
        );
      case 'checkout':
        return (
          <CheckoutPage
            onSuccess={() => setCurrentPage('orders')}
            onBack={() => setCurrentPage('cart')}
          />
        );
      case 'orders':
        return <OrdersPage />;
      case 'profile':
        return (
          <ProfilePage 
            onSignOut={() => setCurrentPage('auth')}
            onProfileComplete={() => {
              // If user was redirected to profile during checkout flow, go back to cart for review
              if (intendedDestination === 'checkout') {
                setShowCartReviewMessage(true);
                setCurrentPage('cart');
                setIntendedDestination(null);
              } else {
                setCurrentPage('home');
              }
            }}
          />
        );
      case 'auth':
        return (
          <AuthPage
            onSignUpSuccess={() => setCurrentPage('profile')}
            onSignInSuccess={() => {
              // The useEffect will handle navigation based on profile completion
              // This callback can be used for immediate actions if needed
            }}
          />
        );
      default:
        return (
          <HomePage 
            onShopSelect={handleShopSelect}
            onNavigateToProfile={() => setCurrentPage('profile')}
          />
        );
    }
  };

  const cartItemCount = getTotalItems();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentPage('home')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <img 
                src={logoSvg} 
                alt="Logo" 
                className="w-8 h-8 rounded-lg" 
              />
              <h1 className="text-2xl font-bold text-gray-900">Quick</h1>
            </button>
            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <UserIcon className="w-4 h-4" />
                  {userProfile && isProfileComplete() ? (
                    <span className="hidden sm:inline">{userProfile.fullName}</span>
                  ) : null}
                </div>
              ) : (
                <button
                  onClick={() => setCurrentPage('auth')}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="pb-6">{renderPage()}</main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            <button
              onClick={() => setCurrentPage('home')}
              className={`flex flex-col items-center gap-1 px-6 py-2 rounded-lg transition-colors ${
                currentPage === 'home'
                  ? 'text-emerald-600 bg-emerald-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Home className="w-6 h-6" />
              <span className="text-xs font-medium">Home</span>
            </button>

            <button
              onClick={() => setCurrentPage('cart')}
              className={`flex flex-col items-center gap-1 px-6 py-2 rounded-lg transition-colors relative ${
                currentPage === 'cart'
                  ? 'text-emerald-600 bg-emerald-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ShoppingCart className="w-6 h-6" />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
              <span className="text-xs font-medium">Cart</span>
            </button>

            <button
              onClick={() => handleNavigation('orders')}
              className={`flex flex-col items-center gap-1 px-6 py-2 rounded-lg transition-colors ${
                currentPage === 'orders'
                  ? 'text-emerald-600 bg-emerald-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Package className="w-6 h-6" />
              <span className="text-xs font-medium">Orders</span>
            </button>

            <button
              onClick={() => handleNavigation('profile')}
              className={`flex flex-col items-center gap-1 px-6 py-2 rounded-lg transition-colors ${
                currentPage === 'profile'
                  ? 'text-emerald-600 bg-emerald-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserIcon className="w-6 h-6" />
              <span className="text-xs font-medium">Profile</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
