export default interface Session {
  id: number;
  user_id: string;
  session_token: string;
  created_at: Date;
  expires_at: Date;
}
