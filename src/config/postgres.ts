import pg from "pg";

const initializePool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  application_name: "ecommerce-backend",
  ssl: {
    rejectUnauthorized: false,
  },
});

export default initializePool;
