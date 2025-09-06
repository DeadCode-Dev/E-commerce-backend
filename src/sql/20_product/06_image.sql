CREATE TABLE IF NOT EXISTS image (
  id SERIAL PRIMARY KEY,
  product_id INT REFERENCES products(id),
  image_url TEXT NOT NULL,
  alt_text TEXT,
  display_order INT NOT NULL
);