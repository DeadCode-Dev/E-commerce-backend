export default interface Orders {
  id: number;
  user_id: string;
  shipping_id: string;
  total: number;
  status: string;
  created_at: Date;
  updated_at: Date;
}
