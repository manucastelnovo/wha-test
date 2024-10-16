import pg from "pg";
import { dbConfig } from "../config";

const { Pool } = pg;
const pool = new Pool({
  user: dbConfig.user,
  password: dbConfig.password,
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
});
export default pool;
