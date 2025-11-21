export default interface Orders {
  id: number;
  user_id: number;
  shipping_id: number;
  total: number;
  status: "pending" | "shipped" | "delivered" | "returned";
  created_at: Date;
  updated_at: Date;
}
