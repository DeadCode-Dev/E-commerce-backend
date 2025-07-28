import pg from "pg";

const initializePool = () =>
  new pg.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: +process.env.DB_PORT,
    application_name: "ecommerce-backend",
  });

export default initializePool;
