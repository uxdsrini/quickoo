import { MapPin, Star } from 'lucide-react';

interface ShopCardProps {
  shop: {
    id: string;
    name: string;
    address: string;
    rating: number | null;
    image_url: string | null;
  };
  onClick: () => void;
}

export function ShopCard({ shop, onClick }: ShopCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden border border-gray-100"
    >
      {/* Responsive image container - smaller on mobile */}
      <div className="aspect-[4/3] sm:aspect-video w-full overflow-hidden bg-gray-100">
        <img
          src={shop.image_url || 'https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=800'}
          alt={shop.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
      {/* Reduced padding on mobile */}
      <div className="p-3 sm:p-4">
        <h3 className="font-semibold text-sm sm:text-lg text-gray-900 mb-1 sm:mb-2 line-clamp-1">{shop.name}</h3>
        <div className="flex items-start gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
          <p className="line-clamp-1 sm:line-clamp-2">{shop.address}</p>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-amber-400 text-amber-400" />
            <span className="font-medium text-xs sm:text-sm text-gray-900">{shop.rating?.toFixed(1) || '4.5'}</span>
          </div>
          <button className="px-2 py-1 sm:px-4 sm:py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-emerald-100 transition-colors">
            View Store
          </button>
        </div>
      </div>
    </div>
  );
}
