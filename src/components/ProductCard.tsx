import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useState } from 'react';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string | null;
    price?: number;
    selling_price: number;
    discount: number | null;
    image_url: string | null;
    unit: string | null;
    in_stock: boolean;
    shop_id: string;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const { items, addToCart, updateQuantity } = useCart();
  const [showAdded, setShowAdded] = useState(false);
  const cartItem = items.find(item => item.id === product.id);
  const quantity = cartItem?.quantity || 0;

  const handleAddToCart = () => {
    addToCart(product);
    setShowAdded(true);
    setTimeout(() => setShowAdded(false), 1000);
  };

  const handleIncrement = () => {
    updateQuantity(product.id, quantity + 1);
  };

  const handleDecrement = () => {
    updateQuantity(product.id, quantity - 1);
  };

  const mrp = product.price || product.selling_price;
  const discountPercent = product.discount || (mrp > product.selling_price ? Math.round(((mrp - product.selling_price) / mrp) * 100) : 0);

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-gray-100">
      <div className="aspect-square w-full overflow-hidden bg-gray-50 relative">
        <img
          src={product.image_url || 'https://images.pexels.com/photos/1435904/pexels-photo-1435904.jpeg?auto=compress&cs=tinysrgb&w=400'}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        {discountPercent > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-semibold">
            {discountPercent}% OFF
          </div>
        )}
        {!product.in_stock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-white text-red-600 px-4 py-2 rounded-lg font-semibold">Out of Stock</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
        {product.description && (
          <p className="text-sm text-gray-500 mb-2 line-clamp-1">{product.description}</p>
        )}
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-lg font-bold text-gray-900">₹{product.selling_price}</span>
          {mrp > product.selling_price && (
            <span className="text-sm text-gray-400 line-through">₹{mrp}</span>
          )}
          <span className="text-xs text-gray-500">/ {product.unit || 'piece'}</span>
        </div>

        {!product.in_stock ? (
          <button
            disabled
            className="w-full py-2.5 bg-gray-100 text-gray-400 rounded-lg font-medium cursor-not-allowed"
          >
            Out of Stock
          </button>
        ) : quantity > 0 ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDecrement}
              className="flex-1 py-2.5 bg-emerald-50 text-emerald-700 rounded-lg font-medium hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="px-4 py-2.5 bg-gray-50 rounded-lg font-semibold min-w-[60px] text-center">
              {quantity}
            </span>
            <button
              onClick={handleIncrement}
              className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleAddToCart}
            className={`w-full py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              showAdded
                ? 'bg-green-500 text-white'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            {showAdded ? 'Added!' : 'Add to Cart'}
          </button>
        )}
      </div>
    </div>
  );
}
