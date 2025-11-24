export default interface Shipping {
  id: number;
  tracking_number?: string;
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
  status: "pending" | "shipped" | "delivered" | "returned";
  created_at: Date;
  updated_at: Date;
}
