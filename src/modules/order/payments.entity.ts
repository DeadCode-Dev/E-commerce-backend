export default interface Payments {
  id: number;
  order_id: number;
  user_id: string;
  stripe_payment_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_status: string;
  created_at: Date;
  updated_at: Date;
}
