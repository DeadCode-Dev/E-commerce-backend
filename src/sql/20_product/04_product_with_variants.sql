CREATE OR REPLACE VIEW productwithvariants AS
SELECT p.id AS product_id,
    p.name AS product_name,
    p.description AS description,
    v.id AS variant_id,
    v.size AS size,
    v.color AS color,
    v.hex AS hex,
    v.stock AS stock,
    v.price AS variant_price,
    v.created_at AS variant_created_at,
    v.updated_at AS variant_updated_at,
    c.id AS category_id,
    c.name AS category_name,
    i.id AS image_id,
    i.image_url,
    i.alt_text,
    i.display_order
FROM products p
    LEFT JOIN product_variants v ON p.id = v.product_id
    LEFT JOIN category c ON p.id = c.product_id
    LEFT JOIN image i ON i.product_id = p.id;