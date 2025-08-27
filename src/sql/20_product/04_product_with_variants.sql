CREATE VIEW IF NOT EXISTS productwithvariants AS
SELECT products.id AS p_id,
    products.name AS p_name,
    products.description AS p_description,
    product_variants.id AS v_id,
    product_variants.size AS v_size,
    product_variants.color AS v_color,
    product_variants.stock AS v_stock,
    product_variants.price AS v_price,
    product_variants.created_at AS v_created_at,
    product_variants.updated_at AS v_updated_at,
    category.name AS category_name,
    image.image_url,
    image.alt_text,
    image.display_order AS image_display_order,
FROM products
    LEFT JOIN product_variants ON products.id = product_variants.product_id
    LEFT JOIN category ON products.id = category.product_id
    LEFT JOIN image ON image.product_id = products.id;