export default interface User {
  id: number;
  username: string;
  email: string;
  password: string; // hashed password
  created_at: Date;
  updated_at: Date;
  banned: boolean;
  role: "user" | "admin";
  phone: string; // optional field
}
