export default interface Orders {
  id: number;
  userId: string;
  total: number;
  status: string;
  created_at: Date;
  updated_at: Date;
}
