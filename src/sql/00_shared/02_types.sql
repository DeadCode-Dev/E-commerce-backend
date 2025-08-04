CREATE TYPE IF NOT EXISTS user_role AS ENUM ('admin', 'user');
CREATE TYPE IF NOT EXISTS order_status AS ENUM ('pending', 'completed', 'cancelled');
CREATE TYPE IF NOT EXISTS payment_status AS ENUM ('pending', 'completed', 'failed');
CREATE TYPE IF NOT EXISTS payment_method_type AS ENUM ('credit_card', 'paypal', 'cash');
CREATE TYPE IF NOT EXISTS shipping_status AS ENUM ('pending', 'shipped', 'delivered', 'returned');
