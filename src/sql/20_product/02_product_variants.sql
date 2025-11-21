-- Variants table (each combination of size/color is stored here)
CREATE TABLE IF NOT EXISTS product_variants (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size VARCHAR(20),
    color VARCHAR(30),
    hex VARCHAR(7),
    stock INT DEFAULT 0,
    price DECIMAL(10, 2) -- optional: override product price
);