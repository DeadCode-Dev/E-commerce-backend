export type PaymentStatus = "pending" | "completed" | "failed" | "refunded"; // Extend as needed
export type PaymentMethodType = "cash" | "paymob"; // Extend as needed

export default interface Payments {
  id: number;
  order_id: number;
  user_id: number;
  stripe_payment_id: string | null;
  amount: string; // DECIMAL(10,2) is best represented as string
  currency: string; // default 'egp'
  status: PaymentStatus; // renamed from payment_status
  created_at: Date;
  updated_at: Date;
  payment_method: PaymentMethodType;
}
