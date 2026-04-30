import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Hey there! Setting up the DB connection pool here. 
 * Using a pool is much better than a single connection for a web app
 * because it handles multiple requests without choking.
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nacos_lasustech',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Just a quick check to see if we can actually talk to the database
pool.getConnection()
  .then(connection => {
    console.log('🚀 Database connected successfully! We are good to go.');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Oops, database connection failed. Did you create the DB?', err.message);
  });

export default pool;
