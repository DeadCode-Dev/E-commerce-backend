export default interface Notification {
  id: number;
  user_id: string;
  message: string;
  read: boolean;
  created_at: Date;
  updated_at: Date;
}
