export default interface Payments {
  id: number;
  order_id: number;
  amount: string; // DECIMAL(10,2) is best represented as string
  currency: string; // default 'egp'
  is_paid: boolean;
  paid_at: Date | null;
  created_at: Date;
  updated_at: Date;
}
