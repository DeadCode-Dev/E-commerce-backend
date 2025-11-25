DO $$ BEGIN CREATE TYPE user_role AS ENUM ('admin', 'user');
EXCEPTION
WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN CREATE TYPE order_status AS ENUM ('pending', 'completed', 'cancelled');
EXCEPTION
WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN CREATE TYPE payment_status AS ENUM ('unpaid', 'paid');
EXCEPTION
WHEN duplicate_object THEN null;
END $$;
DO $$ BEGIN CREATE TYPE shipping_status AS ENUM ('pending', 'shipped', 'delivered', 'returned');
EXCEPTION
WHEN duplicate_object THEN null;
END $$;