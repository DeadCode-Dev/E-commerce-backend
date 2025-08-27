CREATE TABLE IF NOT EXISTS image (
  id SERIAL PRIMARY KEY,
  product_id INT REFERENCES products(id),
  image_url TEXT NOT NULL,
  alt_text TEXT,
  display_order INT NOT NULL
);

ALTER TABLE image RENAME COLUMN url TO image_url;
ALTER TABLE image ADD COLUMN alt_text TEXT;
ALTER TABLE image ADD COLUMN display_order SERIAL NOT NULL;