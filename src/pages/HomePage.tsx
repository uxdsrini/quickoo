import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ShopCard } from '../components/ShopCard';
import { useAuth } from '../hooks/useAuth';
import { Store, Loader2, Search, Clock, MapPin, AlertCircle, X } from 'lucide-react';
import * as React from "react"

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={`flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }

interface Shop {
  id: string;
  name: string;
  address: string;
  rating: number | null;
  image_url: string | null;
  category?: string | null;
}

interface HomePageProps {
  onShopSelect: (shopId: string) => void;
  onNavigateToProfile?: () => void;
}

export function HomePage({ onShopSelect, onNavigateToProfile }: HomePageProps) {
  const { user, isProfileComplete, loading: authLoading } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [locationName, setLocationName] = useState('Your Location');
  const [locationLoading, setLocationLoading] = useState(false);
  const [showLocationPermissionAlert, setShowLocationPermissionAlert] = useState(false);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [serviceAvailable, setServiceAvailable] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [, setCurrentBannerIndex] = useState(0);
  const [showDeliveryCard, setShowDeliveryCard] = useState(true);

  // Banner data
  const banners = [
    {
      id: 1,
      title: "Fresh Vegetables Daily",
      subtitle: "Get 20% off on all fresh vegetables",
      backgroundColor: "bg-gradient-to-r from-green-400 to-green-600",
      textColor: "text-white",
      image: "🥬"
    },
    {
      id: 2,
      title: "Premium Groceries",
      subtitle: "Quality products at the best prices",
      backgroundColor: "bg-gradient-to-r from-blue-400 to-blue-600",
      textColor: "text-white",
      image: "🛒"
    },
    {
      id: 3,
      title: "Fast Delivery",
      subtitle: "Same day delivery within 2 hours",
      backgroundColor: "bg-gradient-to-r from-orange-400 to-orange-600",
      textColor: "text-white",
      image: "⚡"
    }
  ];

  useEffect(() => {
    loadShops();
  }, []);

  // Show welcome popup for new users
  useEffect(() => {
    if (user && !authLoading) {
      const hasSeenWelcome = localStorage.getItem(`welcome-seen-${user.uid}`);
      if (!hasSeenWelcome) {
        setShowWelcomePopup(true);
      }
      
      // Check if location was previously denied and show alert for newly logged-in users
      if (locationName === 'Location access denied' || locationName === 'Location unavailable') {
        setShowLocationPermissionAlert(true);
      }
    }
  }, [user, authLoading, locationName]);

  // Auto-advance banner carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000); // Change banner every 5 seconds

    return () => clearInterval(timer);
  }, [banners.length]);

  // Request location permission on component mount
  useEffect(() => {
    const checkServiceAvailability = (city: string) => {
      // Check if service is available in the user's location
      const availableCities = ['Ramagiri', 'ramagiri', 'RAMAGIRI'];
      const isAvailable = availableCities.some(availableCity => 
        city.toLowerCase().includes(availableCity.toLowerCase()) ||
        availableCity.toLowerCase().includes(city.toLowerCase())
      );
      
      setServiceAvailable(isAvailable);
      
      return isAvailable;
    };

    const getCurrentLocation = () => {
      setLocationLoading(true);
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          await getLocationName(latitude, longitude);
          setLocationLoading(false);
        },
        (error) => {
          console.error('Location error:', error);
          
          // Handle different error types
          if (error.code === error.PERMISSION_DENIED) {
            setLocationName('Location access denied');
            if (user) {
              setShowLocationPermissionAlert(true);
            }
          } else {
            setLocationName('Location unavailable');
          }
          
          setLocationLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    };

    const getLocationName = async (lat: number, lng: number) => {
      try {
        // Try multiple geocoding services as fallbacks
        
        // Method 1: Try BigDataCloud (free, no API key, CORS-friendly)
        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
          );
          
          if (response.ok) {
            const data = await response.json();
            const city = data.city || data.locality || data.principalSubdivision || 'Your Location';
            if (city && city !== 'Your Location') {
              setLocationName(city);
              checkServiceAvailability(city);
              return;
            }
          }
        } catch {
          console.log('BigDataCloud failed, trying fallback...');
        }

        // Method 2: Try Nominatim with proper headers
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'GroceryMart/1.0',
              },
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            const city = data.address?.city || 
                        data.address?.town || 
                        data.address?.village || 
                        data.address?.county || 
                        'Your Location';
            if (city && city !== 'Your Location') {
              setLocationName(city);
              checkServiceAvailability(city);
              return;
            }
          }
        } catch {
          console.log('Nominatim failed, trying final fallback...');
        }

        // Method 3: Use a simple coordinate-based city approximation for India
        const indianCities = [
          { name: 'Mumbai', lat: 19.0760, lng: 72.8777, radius: 0.5 },
          { name: 'Delhi', lat: 28.6139, lng: 77.2090, radius: 0.5 },
          { name: 'Bangalore', lat: 12.9716, lng: 77.5946, radius: 0.5 },
          { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, radius: 0.5 },
          { name: 'Chennai', lat: 13.0827, lng: 80.2707, radius: 0.5 },
          { name: 'Kolkata', lat: 22.5726, lng: 88.3639, radius: 0.5 },
          { name: 'Pune', lat: 18.5204, lng: 73.8567, radius: 0.5 },
          { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714, radius: 0.5 },
        ];

        for (const city of indianCities) {
          const distance = Math.sqrt(
            Math.pow(lat - city.lat, 2) + Math.pow(lng - city.lng, 2)
          );
          if (distance < city.radius) {
            setLocationName(city.name);
            checkServiceAvailability(city.name);
            return;
          }
        }

        // Fallback: set generic location
        setLocationName('Your Location');
      } catch (error) {
        console.error('Geocoding error:', error);
        setLocationName('Your Location');
      }
    };

    const requestLocation = async () => {
      if (!navigator.geolocation) {
        setLocationName('Location unavailable');
        return;
      }

      // Check if we already have permission
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (permission.state === 'granted') {
          getCurrentLocation();
        } else if (permission.state === 'prompt') {
          getCurrentLocation();
        } else {
          setLocationName('Location access denied');
          if (user) {
            setShowLocationPermissionAlert(true);
          }
        }
      } catch {
        // Fallback for browsers that don't support permissions API
        getCurrentLocation();
      }
    };

    requestLocation();
  }, [user]);

  const handleWelcomeClose = () => {
    if (user) {
      localStorage.setItem(`welcome-seen-${user.uid}`, 'true');
    }
    setShowWelcomePopup(false);
  };



  // No automatic redirect - let users browse even with incomplete profiles

  const loadShops = async () => {
    try {
      const storesRef = collection(db, 'stores');
      const querySnapshot = await getDocs(storesRef);

      const shopsData: Shop[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        shopsData.push({
          id: doc.id,
          name: data.name || 'Store',
          address: data.address || '',
          rating: data.rating || 4.5,
          image_url: data.image || data.imageUrl || null,
          category: data.category || null,
        });
      });

      setShops(shopsData);
    } catch (error) {
      console.error('Error loading shops:', error);
    } finally {
      setLoading(false);
    }
  };

  // Category mappings
  const categories = [
    {
      id: 'food-delivery',
      name: 'Food Delivery',
      icon: '🍕',
      color: 'bg-orange-100 text-orange-600',
      stores: ['Tiffin Centers', 'Restaurants', 'Fast Food']
    },
    {
      id: 'quickmart',
      name: 'QuickMart',
      icon: '🛒',
      color: 'bg-emerald-100 text-emerald-600',
      stores: ['Grocery Stores', 'Supermarket', 'General Store']
    },
    {
      id: 'meat-delivery',
      name: 'Meat Delivery',
      icon: '🥩',
      color: 'bg-red-100 text-red-600',
      stores: ['Meat Shop', 'Butcher', 'Non-Veg']
    },
    {
      id: 'pooja-store',
      name: 'Pooja Store',
      icon: '🪔',
      color: 'bg-amber-100 text-amber-600',
      stores: ['Pooja Items', 'Religious Store', 'Temple Store']
    },
    {
      id: 'snack-delivery',
      name: 'Snack Delivery',
      icon: '🧁',
      color: 'bg-pink-100 text-pink-600',
      stores: ['Bakery', 'Sweet Shop', 'Snacks']
    },
    {
      id: 'vegetable-delivery',
      name: 'Vegetable Delivery',
      icon: '🥬',
      color: 'bg-green-100 text-green-600',
      stores: ['Vegetable Market', 'Fresh Vegetables', 'Organic Store']
    }
  ];

  // Filter shops based on search query and selected category
  const filteredShops = shops.filter(shop => {
    // First apply search filter
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      shop.name.toLowerCase().includes(query) || 
      shop.category?.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    // Then apply category filter
    if (!selectedCategory) return true;

    const category = categories.find(cat => cat.id === selectedCategory);
    if (!category) return true;

    // Check if shop's category matches any of the category's store types
    return category.stores.some(storeType => 
      shop.category?.toLowerCase().includes(storeType.toLowerCase()) ||
      storeType.toLowerCase().includes(shop.category?.toLowerCase() || '')
    );
  });

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  // If location access is denied, show permission request page
  if (locationName === 'Location access denied') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <MapPin className="w-12 h-12 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Location Permission Required 📍
          </h2>
          <p className="text-gray-600 mb-6">
            We need your location to check service availability and provide you with the best shopping experience.
          </p>
          
          <div className="bg-green-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-green-900 mb-3">Why we need your location:</h3>
            <ul className="text-sm text-green-800 text-left space-y-2">
              <li>• Check if delivery is available in your area</li>
              <li>• Show nearby grocery stores</li>
              <li>• Provide accurate delivery estimates</li>
              <li>• Ensure seamless order placement</li>
            </ul>
            
            <div className="mt-4 pt-4 border-t border-green-200">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-1">
                  💡 Alternative method:
                </h4>
                <p className="text-sm text-yellow-800 leading-relaxed font-medium">
                  You can also click the <strong className="bg-yellow-200 px-1 rounded">info icon (🛡️ or ℹ️)</strong> beside the URL in your browser's address bar, 
                  then find <strong className="bg-yellow-200 px-1 rounded">"Location"</strong> settings and change it to <strong className="bg-yellow-200 px-1 rounded">"Allow"</strong> to enable location access.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => {
                // First request location permission explicitly
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    () => {
                      // Success - reload page to update location
                      window.location.reload();
                    },
                    (error) => {
                      console.log('Location request result:', error);
                      // Even if denied, reload to update the state
                      setTimeout(() => {
                        window.location.reload();
                      }, 1000);
                    },
                    {
                      enableHighAccuracy: true,
                      timeout: 10000,
                      maximumAge: 0 // Force fresh request
                    }
                  );
                } else {
                  // No geolocation support, just reload
                  window.location.reload();
                }
              }}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
            >
              Enable Location & Reload Page
            </button>
            <p className="text-xs text-gray-500">
              Click "Allow" when your browser asks for location permission
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If user is in a location other than Ramagiri, show service unavailable page
  if (locationName !== 'Your Location' && locationName !== 'Location unavailable' && locationName !== 'Getting location...' && locationName !== 'Location access denied' && !serviceAvailable) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header with detected location */}
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <button
                onClick={() => setShowLocationSelector(true)}
                className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors flex items-center gap-1"
              >
                {locationName}
                <Search className="w-3 h-3 opacity-60" />
              </button>
            </div>
          </div>
        </div>

        {/* Service unavailable content */}
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-12 h-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              We're not available in your area
            </h2>
            <p className="text-gray-600 mb-6">
              We currently don't deliver to <strong>{locationName}</strong>, but we're expanding soon!
            </p>
            
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">Available locations</h3>
              <p className="text-sm text-blue-800">
                We currently serve <strong>Ramagiri</strong> and surrounding areas
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setShowLocationSelector(true)}
                className="w-full bg-emerald-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-emerald-700 transition-colors"
              >
                Change Location
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Retry Location Detection
              </button>
            </div>
          </div>
        </div>

        {/* Location Selector Modal */}
        {showLocationSelector && (
          <div className="fixed inset-0 bg-white z-50">
            <div className="max-w-2xl mx-auto h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center gap-4 p-4 border-b border-gray-100">
                <button
                  onClick={() => setShowLocationSelector(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
                <h1 className="text-lg font-semibold text-gray-900">
                  Enter your area or apartment name
                </h1>
              </div>

              <div className="flex-1 p-4">
                {/* Search Input */}
                <div className="relative mb-6">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Try J P Nagar, Andheri West etc..."
                    value={locationSearchQuery}
                    onChange={(e) => setLocationSearchQuery(e.target.value)}
                    className="pl-12 pr-4 py-4 text-base border-2 border-gray-200 rounded-2xl focus:border-emerald-500 focus:ring-0"
                  />
                </div>

                {/* Use Current Location Button */}
                <button
                  onClick={() => {
                    setShowLocationSelector(false);
                    window.location.reload();
                  }}
                  className="flex items-center gap-3 w-full p-4 text-left hover:bg-gray-50 rounded-xl transition-colors mb-8"
                >
                  <div className="w-6 h-6 text-orange-500">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <span className="text-orange-500 font-medium">Use my current location</span>
                </button>

                {/* Available Locations */}
                <div className="mb-8">
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-4">
                    AVAILABLE LOCATIONS
                  </h3>
                  
                  <button
                    onClick={() => {
                      setLocationName('Ramagiri');
                      setServiceAvailable(true);
                      setShowLocationSelector(false);
                    }}
                    className="flex items-start gap-3 w-full p-4 text-left hover:bg-emerald-50 rounded-xl transition-colors border border-emerald-200"
                  >
                    <MapPin className="w-5 h-5 text-emerald-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Ramagiri</div>
                      <div className="text-sm text-emerald-600">Service Available • Full Menu</div>
                    </div>
                    <div className="text-sm text-emerald-600 font-medium">
                      Select
                    </div>
                  </button>
                </div>

                {/* Current Location (Not Available) */}
                <div className="mb-8">
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-4">
                    DETECTED LOCATION
                  </h3>
                  
                  <div className="flex items-start gap-3 w-full p-4 rounded-xl bg-gray-50 opacity-60">
                    <MapPin className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{locationName}</div>
                      <div className="text-sm text-red-600">Service not available</div>
                    </div>
                    <div className="text-sm text-red-500 font-medium">
                      Not Available
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      {/* Location Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-600" />
          {locationLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-3 h-3 text-emerald-600 animate-spin" />
              <span className="text-sm font-medium text-gray-500">Getting location...</span>
            </div>
          ) : (
            <button
              onClick={() => setShowLocationSelector(true)}
              className="text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors"
            >
              {locationName}
            </button>
          )}
        </div>
      </div>

      {/* Compact Title Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Store className="w-6 h-6 text-emerald-600" />
          <h1 className="text-xl font-bold text-gray-900">Grocery Stores Near You</h1>
        </div>
        <p className="text-sm text-gray-600">Browse local stores and order fresh products</p>
      </div>

      {/* Delivery Timing Info Card */}
      {showDeliveryCard && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 relative">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">Delivery Timings</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p>
                  <span className="font-medium">Regular Hours:</span> 7:00 AM to 7:00 PM
                </p>
                <p>
                  <span className="font-medium">Emergency Service:</span> 7:00 PM to 10:00 PM (Extra charges apply)
                </p>
                <p className="text-xs">
                  For emergency orders after 7 PM, after placing your order call to  {' '}
                  <a 
                    href="tel:9963650466" 
                    className="font-medium text-blue-700 hover:text-blue-800 underline"
                  >
                    99636 50466
                  </a>{' '}
                 *
                </p>
              </div>
            </div>
            {/* Close Button */}
            <button
              onClick={() => setShowDeliveryCard(false)}
              className="absolute top-3 right-3 p-1 hover:bg-red-100 rounded-full transition-colors group"
              aria-label="Close delivery timings card"
            >
              <X className="w-4 h-4 text-red-500 group-hover:text-red-600" />
            </button>
          </div>
        </div>
      )}

      {/* Profile Completion Banner */}
      {user && !isProfileComplete() && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <Store className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-900">Complete Your Profile</h3>
                <p className="text-sm text-amber-800">
                  Add your delivery details to enjoy seamless checkout experience
                </p>
              </div>
            </div>
            <button
              onClick={onNavigateToProfile}
              className="bg-amber-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-700 transition-colors"
            >
              Complete Now
            </button>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by store name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full"
          />
        </div>
        {searchQuery && (
          <p className="text-sm text-gray-600 mt-2">
            Found {filteredShops.length} {filteredShops.length === 1 ? 'store' : 'stores'}
          </p>
        )}
      </div>

      {/* Category Cards Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">What are you looking for?</h2>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              View All
            </button>
          )}
        </div>
        
        {/* Mobile: Horizontal scroll, Desktop: Grid */}
        <div className="md:hidden">
          <div className="flex overflow-x-auto scrollbar-hide gap-4 pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                className={`group relative bg-white border-2 rounded-xl p-4 transition-all duration-200 hover:shadow-md flex-shrink-0 w-32 ${
                  selectedCategory === category.id 
                    ? 'border-emerald-500 bg-emerald-50 shadow-md' 
                    : 'border-gray-100 hover:border-emerald-200'
                }`}
              >
                <div className="text-center">
                  <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center text-2xl ${
                    selectedCategory === category.id ? 'bg-emerald-100' : category.color
                  }`}>
                    {category.icon}
                  </div>
                  <h3 className={`text-sm font-semibold ${
                    selectedCategory === category.id ? 'text-emerald-700' : 'text-gray-900'
                  }`}>
                    {category.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {category.stores.slice(0, 2).join(', ')}{category.stores.length > 2 ? '...' : ''}
                  </p>
                </div>
                
                {/* Selection indicator */}
                {selectedCategory === category.id && (
                  <div className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop: Grid layout */}
        <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
              className={`group relative bg-white border-2 rounded-xl p-4 transition-all duration-200 hover:shadow-md ${
                selectedCategory === category.id 
                  ? 'border-emerald-500 bg-emerald-50 shadow-md' 
                  : 'border-gray-100 hover:border-emerald-200'
              }`}
            >
              <div className="text-center">
                <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center text-2xl ${
                  selectedCategory === category.id ? 'bg-emerald-100' : category.color
                }`}>
                  {category.icon}
                </div>
                <h3 className={`text-sm font-semibold ${
                  selectedCategory === category.id ? 'text-emerald-700' : 'text-gray-900'
                }`}>
                  {category.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {category.stores.join(', ')}
                </p>
              </div>
              
              {/* Selection indicator */}
              {selectedCategory === category.id && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
            </button>
          ))}
        </div>
        
        {selectedCategory && (
          <div className="mt-4 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <p className="text-sm text-emerald-800">
              <span className="font-semibold">Showing stores for:</span> {categories.find(cat => cat.id === selectedCategory)?.name}
              <span className="ml-2 text-emerald-600">({filteredShops.length} {filteredShops.length === 1 ? 'store' : 'stores'} found)</span>
            </p>
          </div>
        )}
      </div>

      {filteredShops.length === 0 ? (
        <div className="text-center py-12">
          <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'No stores found' : 'No stores available'}
          </h3>
          <p className="text-gray-500">
            {searchQuery 
              ? 'Try a different search term or category' 
              : 'Check back later for new stores in your area'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
          {filteredShops.map(shop => (
            <ShopCard
              key={shop.id}
              shop={shop}
              onClick={() => onShopSelect(shop.id)}
            />
          ))}
        </div>
      )}

      {/* Welcome Popup for New Users */}
      {showWelcomePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Store className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Welcome to GroceryMart! 🎉
                </h3>
                <p className="text-gray-600">
                  We're excited to serve you with fresh groceries from local shops
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900">Local Shop Delivery</p>
                    <p className="text-xs text-blue-800">
                      We deliver fresh products from trusted local grocery stores in your area
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <Clock className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-900">Delivery Hours</p>
                    <p className="text-xs text-green-800">
                      Our delivery service operates between <strong>7:00 AM to 7:00 PM</strong> daily
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900">Delivery Notice</p>
                    <p className="text-xs text-amber-800">
                      Delivery may be delayed due to high order volume or weather conditions. We appreciate your patience!
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleWelcomeClose}
                className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
              >
                Got it! Let's Shop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Selector Modal */}
      {showLocationSelector && (
        <div className="fixed inset-0 bg-white z-50">
          <div className="max-w-2xl mx-auto h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-4 p-4 border-b border-gray-100">
              <button
                onClick={() => setShowLocationSelector(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">
                Enter your area or apartment name
              </h1>
            </div>

            <div className="flex-1 p-4">
              {/* Search Input */}
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Try J P Nagar, Andheri West etc..."
                  value={locationSearchQuery}
                  onChange={(e) => setLocationSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-4 text-base border-2 border-gray-200 rounded-2xl focus:border-emerald-500 focus:ring-0"
                />
              </div>

              {/* Use Current Location Button */}
              <button
                onClick={() => {
                  setShowLocationSelector(false);
                  // Trigger location request again
                  window.location.reload();
                }}
                className="flex items-center gap-3 w-full p-4 text-left hover:bg-gray-50 rounded-xl transition-colors mb-8"
              >
                <div className="w-6 h-6 text-orange-500">
                  <MapPin className="w-6 h-6" />
                </div>
                <span className="text-orange-500 font-medium">Use my current location</span>
                <div className="ml-auto">
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                </div>
              </button>

              {/* Recent Searches Section */}
              <div className="mb-8">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-4">
                  RECENT SEARCHES
                </h3>
                
                {/* Service Location Option */}
                <button
                  onClick={() => {
                    setLocationName('Ramagiri');
                    setServiceAvailable(true);
                    setShowLocationSelector(false);
                  }}
                  className="flex items-start gap-3 w-full p-4 text-left hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <MapPin className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-900">Ramagiri</div>
                    <div className="text-sm text-gray-500">Service Available</div>
                  </div>
                  <div className="ml-auto text-sm text-gray-400">
                    Available
                  </div>
                </button>

                {/* Show current location if different */}
                {locationName !== 'Your Location' && locationName !== 'Ramagiri' && (
                  <button
                    onClick={() => {
                      setShowLocationSelector(false);
                    }}
                    className="flex items-start gap-3 w-full p-4 text-left hover:bg-gray-50 rounded-xl transition-colors opacity-60"
                  >
                    <MapPin className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-gray-900">{locationName}</div>
                      <div className="text-sm text-gray-500">Service not available</div>
                    </div>
                    <div className="ml-auto text-sm text-red-400">
                      Not Available
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Permission Alert */}
      {showLocationPermissionAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Location Permission Needed 📍
                </h3>
                <p className="text-gray-600 mb-4">
                  Please allow location access to ensure seamless ordering experience.
                </p>
                <div className="bg-green-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-green-800 mb-2">
                    <strong>Why we need location:</strong>
                  </p>
                  <ul className="text-xs text-green-700 text-left space-y-1">
                    <li>• Check service availability in your area</li>
                    <li>• Show nearby grocery stores</li>
                    <li>• Provide accurate delivery estimates</li>
                    <li>• Ensure seamless order placement</li>
                  </ul>
                </div>
                <p className="text-xs text-gray-500">
                  You can enable location in your browser settings or by clicking the location icon in the address bar.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowLocationPermissionAlert(false);
                    // Reload the page to trigger location request again
                    window.location.reload();
                  }}
                  className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
                >
                  Allow Location Access
                </button>
                <button
                  onClick={() => setShowLocationPermissionAlert(false)}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
