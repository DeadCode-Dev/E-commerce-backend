export default interface Shipping {
  id: number;
  user_id: number;
  tracking_number: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  shipping_status: 'pending' | 'shipped' | 'delivered' | 'returned';
  created_at: Date;
  updated_at: Date;
}
