import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      shops: {
        Row: {
          id: string;
          place_id: string | null;
          name: string;
          address: string;
          latitude: number | null;
          longitude: number | null;
          phone: string | null;
          image_url: string | null;
          rating: number | null;
          is_active: boolean | null;
          created_at: string | null;
        };
      };
      products: {
        Row: {
          id: string;
          shop_id: string | null;
          firebase_id: string | null;
          name: string;
          description: string | null;
          category: string | null;
          image_url: string | null;
          mrp: number;
          discount: number | null;
          selling_price: number;
          unit: string | null;
          in_stock: boolean | null;
          created_at: string | null;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string | null;
          shop_id: string | null;
          order_number: string;
          status: string | null;
          payment_method: string;
          payment_status: string | null;
          subtotal: number;
          discount_amount: number | null;
          delivery_fee: number | null;
          total_amount: number;
          delivery_address: string;
          customer_phone: string;
          customer_name: string;
          notes: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string | null;
          product_id: string | null;
          product_name: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          created_at: string | null;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          phone: string | null;
          full_name: string | null;
          address: string | null;
          city: string | null;
          pincode: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
      };
    };
  };
};
