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
  const [showDeliveryCard, setShowDeliveryCard] = useState(true);

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
    }
  }, [user, authLoading]);

  // Request location permission on component mount
  useEffect(() => {
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
          setLocationName('Location unavailable');
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
        }
      } catch {
        // Fallback for browsers that don't support permissions API
        getCurrentLocation();
      }
    };

    requestLocation();
  }, []);

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

  // Filter shops based on search query
  const filteredShops = shops.filter(shop => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    
    const matchesName = shop.name.toLowerCase().includes(query);
    const matchesCategory = shop.category?.toLowerCase().includes(query);
    
    return matchesName || matchesCategory;
  });

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
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
            <span className="text-sm font-medium text-gray-700">{locationName}</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    </div>
  );
}
