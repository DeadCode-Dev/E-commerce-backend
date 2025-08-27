CREATE TABLE IF NOT EXISTS image (
    id SERIAL PRIMARY KEY,
    url VARCHAR(255) NOT NULL,
    product_id INT REFERENCES products(id)
);