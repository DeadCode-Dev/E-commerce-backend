export default interface Notification {
  id: number;
  userId: string;
  message: string;
  read: boolean;
  created_at: Date;
  updated_at: Date;
}
