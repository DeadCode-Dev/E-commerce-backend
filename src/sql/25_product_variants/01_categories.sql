-- Categories table for product organization
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);

-- Insert default categories
INSERT INTO categories (name, slug, description) VALUES 
    ('Electronics', 'electronics', 'Electronic devices and gadgets'),
    ('Clothing', 'clothing', 'Apparel and fashion items'),
    ('Books', 'books', 'Books and educational materials'),
    ('Home & Garden', 'home-garden', 'Home improvement and garden items'),
    ('Sports', 'sports', 'Sports and fitness equipment')
ON CONFLICT (slug) DO NOTHING;
