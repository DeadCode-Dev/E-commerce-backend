-- Main products table (updated structure)
DROP TABLE IF EXISTS products CASCADE;

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    base_price DECIMAL(10,2) NOT NULL CHECK (base_price >= 0),
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    brand VARCHAR(100),
    sku_prefix VARCHAR(50) NOT NULL,
    weight DECIMAL(8,2) CHECK (weight >= 0),
    dimensions JSONB, -- {width: 10, height: 5, length: 15, unit: "cm"}
    meta_title VARCHAR(255),
    meta_description VARCHAR(500),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft', 'archived')),
    is_featured BOOLEAN DEFAULT false,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);

-- Create GIN index for tags array
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags);

-- Trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
