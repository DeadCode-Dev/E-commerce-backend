import pg from "pg";

const pool = new pg.Pool({
  user: "postgres",
  host: "localhost",
  password: "Youssef010#",
  database: "myapp",
  port: 5432,
  application_name: "postgres",
});

export default pool;
