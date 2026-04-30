import fs from 'fs';
import path from 'path';
import db from './db.js';

/**
 * Database Initialization Script
 * ---------------------------------------------------------
 * Since the mysql command line might not be available, 
 * this script reads the setup.sql file and executes it 
 * directly through our Node connection.
 */
const init = async () => {
  try {
    console.log('🚀 Starting Database Initialization...');
    
    const sqlPath = path.resolve('setup.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split by semicolon to execute one by one
    // Note: This is a simple split, won't work for complex SQL with semicolons in strings
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      console.log('📜 Executing:', statement.substring(0, 50) + '...');
      await db.query(statement);
    }

    console.log('✅ Database tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Initialization failed:', error.message);
    process.exit(1);
  }
};

init();
