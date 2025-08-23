-- Product images table
CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id INTEGER REFERENCES product_variants(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    image_type VARCHAR(20) DEFAULT 'product' CHECK (image_type IN ('product', 'gallery', 'thumbnail', 'zoom')),
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    file_size INTEGER, -- in bytes
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Either product_id or variant_id should be set, but not both for variant-specific images
    CONSTRAINT image_association_check CHECK (
        (product_id IS NOT NULL) OR 
        (product_id IS NOT NULL AND variant_id IS NOT NULL)
    )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_images_variant_id ON product_images(variant_id);
CREATE INDEX IF NOT EXISTS idx_images_type ON product_images(image_type);
CREATE INDEX IF NOT EXISTS idx_images_primary ON product_images(is_primary);
CREATE INDEX IF NOT EXISTS idx_images_sort ON product_images(sort_order);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_images_product_variant ON product_images(product_id, variant_id);

-- Ensure only one primary image per product/variant combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_primary_product_image 
ON product_images(product_id) 
WHERE is_primary = true AND variant_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_primary_variant_image 
ON product_images(variant_id) 
WHERE is_primary = true AND variant_id IS NOT NULL;
