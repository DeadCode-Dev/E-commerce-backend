export default interface Shipping {
  id: number;
  order_id: number;
  user_id: string;
  tracking_number: string;
  adress: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  shipping_status: string;
  created_at: Date;
  updated_at: Date;
}
