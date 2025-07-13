export default interface Review {
  id: number;
  user_id: string;
  product_id: number;
  rating: number;
  comment: string;
  created_at: Date;
  updated_at: Date;
}
