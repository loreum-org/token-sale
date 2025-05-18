/**
 * Reset database script
 * This script deletes the bonding curve database so that it will be recreated
 * with the new DEFAULT_EXPONENT value when the app next runs.
 */

const fs = require('fs');
const path = require('path');

// Database file path
const dbPath = path.join(__dirname, '..', 'bonding-curve.db');

// Check if the file exists
if (fs.existsSync(dbPath)) {
  console.log(`Found database at ${dbPath}`);
  
  try {
    // Delete the database file
    fs.unlinkSync(dbPath);
    console.log('✅ Database has been reset successfully!');
    console.log('The app will use the new exponent value (2.5) when restarted.');
  } catch (err) {
    console.error('❌ Error deleting database:', err);
    process.exit(1);
  }
} else {
  console.log('Database file not found. No action needed.');
} 