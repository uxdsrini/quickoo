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
      <div className="aspect-video w-full overflow-hidden bg-gray-100">
        <img
          src={shop.image_url || 'https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=800'}
          alt={shop.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-900 mb-2">{shop.name}</h3>
        <div className="flex items-start gap-2 text-sm text-gray-600 mb-3">
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p className="line-clamp-2">{shop.address}</p>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="font-medium text-gray-900">{shop.rating?.toFixed(1) || '4.5'}</span>
          </div>
          <button className="px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors">
            View Store
          </button>
        </div>
      </div>
    </div>
  );
}
