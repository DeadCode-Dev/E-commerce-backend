export default interface Image {
  id: number;
  product_id: number;
  image_url: string;
  alt_text?: string;
  display_order: number;
}
