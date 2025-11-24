export default interface Orders {
  id: number;
  shipping_id: number;
  total: number;
  status: "pending" | "processing" | "completed" | "cancelled";
  created_at: Date;
  updated_at: Date;
}
