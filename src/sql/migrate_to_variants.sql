-- Complete Database Migration Script for Product Variants System
-- Run this script to sync your database with the new product variants structure

-- Start transaction
BEGIN;

-- Backup existing products table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products') THEN
    -- Create backup table
    CREATE TABLE products_backup AS SELECT * FROM products;
    RAISE NOTICE 'Existing products table backed up as products_backup';
  END IF;
END $$;

-- Drop existing tables in correct order (respect foreign keys)
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- Create categories table
CREATE TABLE categories (
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

-- Create indexes for categories
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_active ON categories(is_active);

-- Create products table with new structure
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
    dimensions JSONB,
    meta_title VARCHAR(255),
    meta_description VARCHAR(500),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft', 'archived')),
    is_featured BOOLEAN DEFAULT false,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for products
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_brand ON products(brand);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_products_created_at ON products(created_at);
CREATE INDEX idx_products_tags ON products USING GIN(tags);

-- Create product variants table
CREATE TABLE product_variants (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) UNIQUE NOT NULL,
    color VARCHAR(50),
    size VARCHAR(50),
    material VARCHAR(100),
    price DECIMAL(10,2) CHECK (price >= 0),
    cost_price DECIMAL(10,2) CHECK (cost_price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    reserved_stock INTEGER DEFAULT 0 CHECK (reserved_stock >= 0),
    min_stock_alert INTEGER DEFAULT 5,
    weight DECIMAL(8,2) CHECK (weight >= 0),
    barcode VARCHAR(100),
    supplier_sku VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT unique_product_variant UNIQUE(product_id, color, size, material)
);

-- Create indexes for product variants
CREATE INDEX idx_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_variants_sku ON product_variants(sku);
CREATE INDEX idx_variants_color ON product_variants(color);
CREATE INDEX idx_variants_size ON product_variants(size);
CREATE INDEX idx_variants_stock ON product_variants(stock);
CREATE INDEX idx_variants_active ON product_variants(is_active);
CREATE INDEX idx_variants_barcode ON product_variants(barcode);
CREATE INDEX idx_variants_product_color ON product_variants(product_id, color);
CREATE INDEX idx_variants_product_size ON product_variants(product_id, size);
CREATE INDEX idx_variants_active_stock ON product_variants(is_active, stock) WHERE stock > 0;

-- Create product images table
CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id INTEGER REFERENCES product_variants(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    image_type VARCHAR(20) DEFAULT 'product' CHECK (image_type IN ('product', 'gallery', 'thumbnail', 'zoom')),
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    file_size INTEGER,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT image_association_check CHECK (
        (product_id IS NOT NULL) OR 
        (product_id IS NOT NULL AND variant_id IS NOT NULL)
    )
);

-- Create indexes for product images
CREATE INDEX idx_images_product_id ON product_images(product_id);
CREATE INDEX idx_images_variant_id ON product_images(variant_id);
CREATE INDEX idx_images_type ON product_images(image_type);
CREATE INDEX idx_images_primary ON product_images(is_primary);
CREATE INDEX idx_images_sort ON product_images(sort_order);
CREATE INDEX idx_images_product_variant ON product_images(product_id, variant_id);

-- Create unique indexes for primary images
CREATE UNIQUE INDEX idx_unique_primary_product_image 
ON product_images(product_id) 
WHERE is_primary = true AND variant_id IS NULL;

CREATE UNIQUE INDEX idx_unique_primary_variant_image 
ON product_images(variant_id) 
WHERE is_primary = true AND variant_id IS NOT NULL;

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_variants_updated_at 
    BEFORE UPDATE ON product_variants 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create stock management functions
CREATE OR REPLACE FUNCTION check_variant_stock(variant_id INTEGER, required_quantity INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    available_stock INTEGER;
BEGIN
    SELECT (stock - reserved_stock) INTO available_stock 
    FROM product_variants 
    WHERE id = variant_id AND is_active = true;
    
    RETURN COALESCE(available_stock, 0) >= required_quantity;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION reserve_variant_stock(variant_id INTEGER, quantity INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    available_stock INTEGER;
BEGIN
    SELECT (stock - reserved_stock) INTO available_stock 
    FROM product_variants 
    WHERE id = variant_id AND is_active = true;
    
    IF COALESCE(available_stock, 0) < quantity THEN
        RETURN false;
    END IF;
    
    UPDATE product_variants 
    SET reserved_stock = reserved_stock + quantity,
        updated_at = NOW()
    WHERE id = variant_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION release_variant_stock(variant_id INTEGER, quantity INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE product_variants 
    SET reserved_stock = GREATEST(0, reserved_stock - quantity),
        updated_at = NOW()
    WHERE id = variant_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fulfill_variant_stock(variant_id INTEGER, quantity INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    current_reserved INTEGER;
    current_stock INTEGER;
BEGIN
    SELECT stock, reserved_stock INTO current_stock, current_reserved
    FROM product_variants 
    WHERE id = variant_id AND is_active = true;
    
    IF COALESCE(current_reserved, 0) < quantity THEN
        RETURN false;
    END IF;
    
    UPDATE product_variants 
    SET stock = stock - quantity,
        reserved_stock = reserved_stock - quantity,
        updated_at = NOW()
    WHERE id = variant_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Insert default categories
INSERT INTO categories (name, slug, description) VALUES 
    ('Electronics', 'electronics', 'Electronic devices and gadgets'),
    ('Clothing', 'clothing', 'Apparel and fashion items'),
    ('Men Clothing', 'men-clothing', 'Clothing for men'),
    ('Women Clothing', 'women-clothing', 'Clothing for women'),
    ('Shoes', 'shoes', 'Footwear for all'),
    ('Accessories', 'accessories', 'Fashion accessories'),
    ('Books', 'books', 'Books and educational materials'),
    ('Home & Garden', 'home-garden', 'Home improvement and garden items'),
    ('Sports', 'sports', 'Sports and fitness equipment')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample products
INSERT INTO products (
    name, slug, description, short_description, base_price, category_id, 
    brand, sku_prefix, weight, status, is_featured, tags
) VALUES 
    (
        'Classic Cotton T-Shirt',
        'classic-cotton-tshirt',
        'A comfortable and versatile cotton t-shirt perfect for everyday wear. Made from 100% organic cotton with a relaxed fit.',
        'Comfortable cotton t-shirt for everyday wear',
        19.99,
        (SELECT id FROM categories WHERE slug = 'men-clothing' LIMIT 1),
        'ComfortWear',
        'CCT',
        0.2,
        'active',
        true,
        ARRAY['cotton', 'casual', 'organic', 'comfortable']
    ),
    (
        'Denim Jeans',
        'denim-jeans',
        'Premium quality denim jeans with a modern slim fit. Durable construction with reinforced stitching.',
        'Premium slim-fit denim jeans',
        59.99,
        (SELECT id FROM categories WHERE slug = 'men-clothing' LIMIT 1),
        'DenimCo',
        'DJ',
        0.8,
        'active',
        false,
        ARRAY['denim', 'jeans', 'casual', 'slim-fit']
    ),
    (
        'Running Shoes',
        'running-shoes',
        'Lightweight running shoes with advanced cushioning technology. Perfect for daily runs and workouts.',
        'Lightweight running shoes with cushioning',
        89.99,
        (SELECT id FROM categories WHERE slug = 'shoes' LIMIT 1),
        'SportTech',
        'RS',
        0.6,
        'active',
        true,
        ARRAY['running', 'shoes', 'sports', 'lightweight']
    )
ON CONFLICT (slug) DO NOTHING;

-- Insert product variants
INSERT INTO product_variants (
    product_id, sku, color, size, stock, is_active, is_default, sort_order
) VALUES 
    -- Classic Cotton T-Shirt variants
    ((SELECT id FROM products WHERE slug = 'classic-cotton-tshirt'), 'CCT-RED-S', 'Red', 'S', 25, true, false, 1),
    ((SELECT id FROM products WHERE slug = 'classic-cotton-tshirt'), 'CCT-RED-M', 'Red', 'M', 30, true, true, 2),
    ((SELECT id FROM products WHERE slug = 'classic-cotton-tshirt'), 'CCT-RED-L', 'Red', 'L', 20, true, false, 3),
    ((SELECT id FROM products WHERE slug = 'classic-cotton-tshirt'), 'CCT-BLUE-S', 'Blue', 'S', 20, true, false, 5),
    ((SELECT id FROM products WHERE slug = 'classic-cotton-tshirt'), 'CCT-BLUE-M', 'Blue', 'M', 25, true, false, 6),
    ((SELECT id FROM products WHERE slug = 'classic-cotton-tshirt'), 'CCT-BLACK-M', 'Black', 'M', 35, true, false, 10),
    ((SELECT id FROM products WHERE slug = 'classic-cotton-tshirt'), 'CCT-BLACK-L', 'Black', 'L', 28, true, false, 11),
    
    -- Denim Jeans variants
    ((SELECT id FROM products WHERE slug = 'denim-jeans'), 'DJ-BLUE-32', 'Blue', '32', 20, true, true, 2),
    ((SELECT id FROM products WHERE slug = 'denim-jeans'), 'DJ-BLUE-34', 'Blue', '34', 18, true, false, 3),
    ((SELECT id FROM products WHERE slug = 'denim-jeans'), 'DJ-BLACK-32', 'Black', '32', 15, true, false, 6),
    
    -- Running Shoes variants
    ((SELECT id FROM products WHERE slug = 'running-shoes'), 'RS-WHITE-9', 'White', '9', 15, true, true, 2),
    ((SELECT id FROM products WHERE slug = 'running-shoes'), 'RS-WHITE-10', 'White', '10', 18, true, false, 3),
    ((SELECT id FROM products WHERE slug = 'running-shoes'), 'RS-BLACK-9', 'Black', '9', 12, true, false, 6),
    ((SELECT id FROM products WHERE slug = 'running-shoes'), 'RS-BLACK-10', 'Black', '10', 15, true, false, 7)
ON CONFLICT (sku) DO NOTHING;

-- Insert sample product images
INSERT INTO product_images (product_id, variant_id, image_url, alt_text, image_type, sort_order, is_primary) VALUES 
    -- T-Shirt images
    ((SELECT id FROM products WHERE slug = 'classic-cotton-tshirt'), NULL, '/images/products/tshirt-main.jpg', 'Classic Cotton T-Shirt', 'product', 0, true),
    ((SELECT id FROM products WHERE slug = 'classic-cotton-tshirt'), NULL, '/images/products/tshirt-side.jpg', 'T-Shirt Side View', 'gallery', 1, false),
    
    -- Jeans images
    ((SELECT id FROM products WHERE slug = 'denim-jeans'), NULL, '/images/products/jeans-main.jpg', 'Denim Jeans', 'product', 0, true),
    ((SELECT id FROM products WHERE slug = 'denim-jeans'), NULL, '/images/products/jeans-back.jpg', 'Jeans Back View', 'gallery', 1, false),
    
    -- Shoes images
    ((SELECT id FROM products WHERE slug = 'running-shoes'), NULL, '/images/products/shoes-main.jpg', 'Running Shoes', 'product', 0, true),
    ((SELECT id FROM products WHERE slug = 'running-shoes'), NULL, '/images/products/shoes-side.jpg', 'Shoes Side View', 'gallery', 1, false);

-- Migration complete message
DO $$
BEGIN
    RAISE NOTICE '✅ Database migration completed successfully!';
    RAISE NOTICE 'Created tables: categories, products, product_variants, product_images';
    RAISE NOTICE 'Added sample data: % categories, % products, % variants', 
        (SELECT COUNT(*) FROM categories),
        (SELECT COUNT(*) FROM products),
        (SELECT COUNT(*) FROM product_variants);
END $$;

-- Commit transaction
COMMIT;

-- Verify the migration
SELECT 
    'Migration Summary:' as status,
    (SELECT COUNT(*) FROM categories) as categories_count,
    (SELECT COUNT(*) FROM products) as products_count,
    (SELECT COUNT(*) FROM product_variants) as variants_count,
    (SELECT COUNT(*) FROM product_images) as images_count;
