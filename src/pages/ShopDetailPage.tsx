import { useEffect, useState } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ProductCard } from '../components/ProductCard';
import { ArrowLeft, Store, MapPin, Star, Loader2 } from 'lucide-react';

interface Shop {
  id: string;
  name: string;
  address: string;
  rating: number | null;
  image_url: string | null;
  phone: string | null;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  selling_price: number;
  discount: number | null;
  image_url: string | null;
  unit: string | null;
  in_stock: boolean;
  shop_id: string;
  category: string | null;
}

interface ShopDetailPageProps {
  shopId: string;
  onBack: () => void;
}

export function ShopDetailPage({ shopId, onBack }: ShopDetailPageProps) {
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadShopAndProducts = async () => {
      try {
        const storeDocRef = doc(db, 'stores', shopId);
        const storeDoc = await getDoc(storeDocRef);

        if (cancelled) return;

        if (storeDoc.exists()) {
          const storeData = storeDoc.data();
          setShop({
            id: storeDoc.id,
            name: storeData.name || 'Store',
            address: storeData.address || '',
            rating: storeData.rating || 4.5,
            image_url: storeData.image || storeData.imageUrl || null,
            phone: storeData.phone || null,
          });
        }

        const productsRef = collection(db, 'products');
        const q = query(productsRef, where('storeId', '==', shopId));
        const querySnapshot = await getDocs(q);

        if (cancelled) return;

        const productsData: Product[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          productsData.push({
            id: doc.id,
            name: data.name || '',
            description: data.description || null,
            price: data.price || 0,
            selling_price: data.price || 0,
            discount: 0,
            image_url: data.image || null,
            unit: data.unit || 'kg',
            in_stock: data.inStock !== false,
            shop_id: shopId,
            category: data.category || null,
          });
        });

        setProducts(productsData);
      } catch (error) {
        console.error('Error loading shop details:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadShopAndProducts();

    // Cleanup function to prevent state updates after unmount
    return () => {
      cancelled = true;
    };
  }, [shopId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Stores
        </button>
        <div className="text-center py-12">
          <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Store not found</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Stores
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div>
          {/* {shop.image_url && (
            // <img
            //   src={shop.image_url}
            //   alt={shop.name}
            //   className="w-full h-full object-cover opacity-40"
            // />
          )} */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
        <div className="p-6 -mt-16 relative">
          <div className="flex items-start gap-4">
            <div className="bg-white rounded-xl p-4 shadow-lg">
              <Store className="w-12 h-12 text-emerald-600" />
            </div>
            <div className="flex-1 mt-4">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{shop.name}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{shop.address}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-gray-900">{shop.rating?.toFixed(1) || '4.5'}</span>
                <span className="text-gray-500 text-sm ml-1">rating</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Available Products</h2>
        <p className="text-gray-600">Fresh groceries delivered to your doorstep</p>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <p className="text-gray-500">No products available at this store</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
