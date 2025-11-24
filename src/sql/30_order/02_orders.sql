CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    shipping_id INT NOT NULL REFERENCES shipping(id), -- link to shipping
    total DECIMAL(10, 2) NOT NULL,
    status order_status DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
