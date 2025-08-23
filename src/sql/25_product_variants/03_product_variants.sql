-- Product variants table for color/size combinations
CREATE TABLE product_variants (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) UNIQUE NOT NULL,
    color VARCHAR(50),
    size VARCHAR(50),
    material VARCHAR(100),
    price DECIMAL(10,2) CHECK (price >= 0), -- If NULL, uses base_price from product
    cost_price DECIMAL(10,2) CHECK (cost_price >= 0), -- For profit calculation
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    reserved_stock INTEGER DEFAULT 0 CHECK (reserved_stock >= 0), -- For pending orders
    min_stock_alert INTEGER DEFAULT 5, -- Low stock warning threshold
    weight DECIMAL(8,2) CHECK (weight >= 0),
    barcode VARCHAR(100),
    supplier_sku VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false, -- Mark default variant for product
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Ensure unique combinations per product
    CONSTRAINT unique_product_variant UNIQUE(product_id, color, size, material)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_variants_color ON product_variants(color);
CREATE INDEX IF NOT EXISTS idx_variants_size ON product_variants(size);
CREATE INDEX IF NOT EXISTS idx_variants_stock ON product_variants(stock);
CREATE INDEX IF NOT EXISTS idx_variants_active ON product_variants(is_active);
CREATE INDEX IF NOT EXISTS idx_variants_barcode ON product_variants(barcode);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_variants_product_color ON product_variants(product_id, color);
CREATE INDEX IF NOT EXISTS idx_variants_product_size ON product_variants(product_id, size);
CREATE INDEX IF NOT EXISTS idx_variants_active_stock ON product_variants(is_active, stock) WHERE stock > 0;

-- Trigger to update updated_at column
CREATE TRIGGER update_variants_updated_at 
    BEFORE UPDATE ON product_variants 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to check if variant has sufficient stock
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

-- Function to reserve stock for orders
CREATE OR REPLACE FUNCTION reserve_variant_stock(variant_id INTEGER, quantity INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    available_stock INTEGER;
BEGIN
    -- Check available stock
    SELECT (stock - reserved_stock) INTO available_stock 
    FROM product_variants 
    WHERE id = variant_id AND is_active = true;
    
    IF COALESCE(available_stock, 0) < quantity THEN
        RETURN false;
    END IF;
    
    -- Reserve the stock
    UPDATE product_variants 
    SET reserved_stock = reserved_stock + quantity,
        updated_at = NOW()
    WHERE id = variant_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to release reserved stock
CREATE OR REPLACE FUNCTION release_variant_stock(variant_id INTEGER, quantity INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE product_variants 
    SET reserved_stock = GREATEST(0, reserved_stock - quantity),
        updated_at = NOW()
    WHERE id = variant_id;
END;
$$ LANGUAGE plpgsql;

-- Function to fulfill order (convert reserved to sold)
CREATE OR REPLACE FUNCTION fulfill_variant_stock(variant_id INTEGER, quantity INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    current_reserved INTEGER;
    current_stock INTEGER;
BEGIN
    SELECT stock, reserved_stock INTO current_stock, current_reserved
    FROM product_variants 
    WHERE id = variant_id AND is_active = true;
    
    -- Check if we have enough reserved stock
    IF COALESCE(current_reserved, 0) < quantity THEN
        RETURN false;
    END IF;
    
    -- Reduce both stock and reserved stock
    UPDATE product_variants 
    SET stock = stock - quantity,
        reserved_stock = reserved_stock - quantity,
        updated_at = NOW()
    WHERE id = variant_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;
