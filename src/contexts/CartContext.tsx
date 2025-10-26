import { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
  shop_id: string;
  unit: string;
}

interface Product {
  id: string;
  name: string;
  selling_price: number;
  image_url: string;
  shop_id: string;
  unit: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  currentShopId: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentShopId, setCurrentShopId] = useState<string | null>(null);
  const previousUserRef = useRef(user);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
    if (items.length > 0) {
      setCurrentShopId(items[0].shop_id);
    } else {
      setCurrentShopId(null);
    }
  }, [items]);

  // Monitor user state changes to clear cart on logout
  useEffect(() => {
    // Skip the initial load to avoid false positive logout detection
    if (loading || isInitialLoad) {
      if (!loading && isInitialLoad) {
        setIsInitialLoad(false);
        previousUserRef.current = user;
      }
      return;
    }

    const previousUser = previousUserRef.current;
    
    // If user was logged in before and now is null (logged out)
    if (previousUser && !user && items.length > 0) {
      setItems([]);
      localStorage.removeItem('cart');
      alert('🛒 Your cart has been cleared because you signed out. Please sign in again to continue shopping.');
    }
    
    // Update the ref with current user state
    previousUserRef.current = user;
  }, [user, loading, items.length, isInitialLoad]);

  const addToCart = (product: Product) => {
    if (currentShopId && currentShopId !== product.shop_id) {
      if (!confirm('Adding items from a different shop will clear your current cart. Continue?')) {
        return;
      }
      setItems([{
        id: product.id,
        name: product.name,
        price: product.selling_price,
        quantity: 1,
        image_url: product.image_url,
        shop_id: product.shop_id,
        unit: product.unit,
      }]);
      return;
    }

    setItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        price: product.selling_price,
        quantity: 1,
        image_url: product.image_url,
        shop_id: product.shop_id,
        unit: product.unit,
      }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
        currentShopId,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
