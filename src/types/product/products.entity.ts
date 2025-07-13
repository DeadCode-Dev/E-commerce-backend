export default interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  created_at: Date;
  updated_at: Date;
  size: string[];
  color: string[];
  category: string[];
  images: string[];
}
