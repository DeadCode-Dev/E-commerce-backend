-- Wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id),
    product_id INT NOT NULL REFERENCES products(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);