-- Sample data for testing
-- Insert sample categories
INSERT INTO categories (name, slug, description) VALUES 
    ('Men Clothing', 'men-clothing', 'Clothing for men'),
    ('Women Clothing', 'women-clothing', 'Clothing for women'),
    ('Shoes', 'shoes', 'Footwear for all'),
    ('Accessories', 'accessories', 'Fashion accessories')
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

-- Insert product variants for T-Shirt
INSERT INTO product_variants (
    product_id, sku, color, size, stock, is_active, is_default, sort_order
) VALUES 
    -- Classic Cotton T-Shirt variants
    ((SELECT id FROM products WHERE slug = 'classic-cotton-tshirt'), 'CCT-RED-S', 'Red', 'S', 25, true, false, 1),
    ((SELECT id FROM products WHERE slug = 'classic-cotton-tshirt'), 'CCT-RED-M', 'Red', 'M', 30, true, true, 2),
    ((SELECT id FROM products WHERE slug = 'classic-cotton-tshirt'), 'CCT-RED-L', 'Red', 'L', 20, true, false, 3),
    ((SELECT id FROM products WHERE slug = 'classic-cotton-tshirt'), 'CCT-RED-XL', 'Red', 'XL', 15, true, false, 4),
    ((SELECT id FROM products WHERE slug = 'classic-cotton-tshirt'), 'CCT-BLUE-S', 'Blue', 'S', 20, true, false, 5),
    ((SELECT id FROM products WHERE slug = 'classic-cotton-tshirt'), 'CCT-BLUE-M', 'Blue', 'M', 25, true, false, 6),
    ((SELECT id FROM products WHERE slug = 'classic-cotton-tshirt'), 'CCT-BLUE-L', 'Blue', 'L', 18, true, false, 7),
    ((SELECT id FROM products WHERE slug = 'classic-cotton-tshirt'), 'CCT-BLUE-XL', 'Blue', 'XL', 12, true, false, 8),
    ((SELECT id FROM products WHERE slug = 'classic-cotton-tshirt'), 'CCT-BLACK-S', 'Black', 'S', 30, true, false, 9),
    ((SELECT id FROM products WHERE slug = 'classic-cotton-tshirt'), 'CCT-BLACK-M', 'Black', 'M', 35, true, false, 10),
    ((SELECT id FROM products WHERE slug = 'classic-cotton-tshirt'), 'CCT-BLACK-L', 'Black', 'L', 28, true, false, 11),
    ((SELECT id FROM products WHERE slug = 'classic-cotton-tshirt'), 'CCT-BLACK-XL', 'Black', 'XL', 20, true, false, 12),
    
    -- Denim Jeans variants
    ((SELECT id FROM products WHERE slug = 'denim-jeans'), 'DJ-BLUE-30', 'Blue', '30', 15, true, false, 1),
    ((SELECT id FROM products WHERE slug = 'denim-jeans'), 'DJ-BLUE-32', 'Blue', '32', 20, true, true, 2),
    ((SELECT id FROM products WHERE slug = 'denim-jeans'), 'DJ-BLUE-34', 'Blue', '34', 18, true, false, 3),
    ((SELECT id FROM products WHERE slug = 'denim-jeans'), 'DJ-BLUE-36', 'Blue', '36', 12, true, false, 4),
    ((SELECT id FROM products WHERE slug = 'denim-jeans'), 'DJ-BLACK-30', 'Black', '30', 10, true, false, 5),
    ((SELECT id FROM products WHERE slug = 'denim-jeans'), 'DJ-BLACK-32', 'Black', '32', 15, true, false, 6),
    ((SELECT id FROM products WHERE slug = 'denim-jeans'), 'DJ-BLACK-34', 'Black', '34', 12, true, false, 7),
    ((SELECT id FROM products WHERE slug = 'denim-jeans'), 'DJ-BLACK-36', 'Black', '36', 8, true, false, 8),
    
    -- Running Shoes variants
    ((SELECT id FROM products WHERE slug = 'running-shoes'), 'RS-WHITE-8', 'White', '8', 12, true, false, 1),
    ((SELECT id FROM products WHERE slug = 'running-shoes'), 'RS-WHITE-9', 'White', '9', 15, true, true, 2),
    ((SELECT id FROM products WHERE slug = 'running-shoes'), 'RS-WHITE-10', 'White', '10', 18, true, false, 3),
    ((SELECT id FROM products WHERE slug = 'running-shoes'), 'RS-WHITE-11', 'White', '11', 10, true, false, 4),
    ((SELECT id FROM products WHERE slug = 'running-shoes'), 'RS-BLACK-8', 'Black', '8', 8, true, false, 5),
    ((SELECT id FROM products WHERE slug = 'running-shoes'), 'RS-BLACK-9', 'Black', '9', 12, true, false, 6),
    ((SELECT id FROM products WHERE slug = 'running-shoes'), 'RS-BLACK-10', 'Black', '10', 15, true, false, 7),
    ((SELECT id FROM products WHERE slug = 'running-shoes'), 'RS-BLACK-11', 'Black', '11', 6, true, false, 8)
ON CONFLICT (sku) DO NOTHING;

-- Insert sample product images
INSERT INTO product_images (product_id, variant_id, image_url, alt_text, image_type, sort_order, is_primary) VALUES 
    -- T-Shirt images
    ((SELECT id FROM products WHERE slug = 'classic-cotton-tshirt'), NULL, '/images/tshirt-main.jpg', 'Classic Cotton T-Shirt', 'product', 0, true),
    ((SELECT id FROM products WHERE slug = 'classic-cotton-tshirt'), NULL, '/images/tshirt-side.jpg', 'T-Shirt Side View', 'gallery', 1, false),
    
    -- T-Shirt variant-specific images
    ((SELECT id FROM products WHERE slug = 'classic-cotton-tshirt'), (SELECT id FROM product_variants WHERE sku = 'CCT-RED-M'), '/images/tshirt-red.jpg', 'Red T-Shirt', 'product', 0, true),
    ((SELECT id FROM products WHERE slug = 'classic-cotton-tshirt'), (SELECT id FROM product_variants WHERE sku = 'CCT-BLUE-M'), '/images/tshirt-blue.jpg', 'Blue T-Shirt', 'product', 0, true),
    ((SELECT id FROM products WHERE slug = 'classic-cotton-tshirt'), (SELECT id FROM product_variants WHERE sku = 'CCT-BLACK-M'), '/images/tshirt-black.jpg', 'Black T-Shirt', 'product', 0, true),
    
    -- Jeans images
    ((SELECT id FROM products WHERE slug = 'denim-jeans'), NULL, '/images/jeans-main.jpg', 'Denim Jeans', 'product', 0, true),
    ((SELECT id FROM products WHERE slug = 'denim-jeans'), NULL, '/images/jeans-back.jpg', 'Jeans Back View', 'gallery', 1, false),
    
    -- Shoes images
    ((SELECT id FROM products WHERE slug = 'running-shoes'), NULL, '/images/shoes-main.jpg', 'Running Shoes', 'product', 0, true),
    ((SELECT id FROM products WHERE slug = 'running-shoes'), NULL, '/images/shoes-side.jpg', 'Shoes Side View', 'gallery', 1, false);
