/**
 * Fix supply exceeding max script
 * This script corrects the token supply if it exceeds the maximum allowed value
 */

const Database = require('better-sqlite3');
const path = require('path');

// Constants
const MAX_SUPPLY = 100000000; // 100 million

// Database file path
const dbPath = path.join(__dirname, '..', 'bonding-curve.db');

try {
  console.log(`Opening database at ${dbPath}`);
  const db = new Database(dbPath);
  
  // Get current supply value
  const state = db.prepare('SELECT current_supply FROM bonding_curve_state WHERE id = 1').get();
  
  if (!state) {
    console.log('⚠️ No bonding curve state found. No action needed.');
    process.exit(0);
  }
  
  const currentSupply = state.current_supply;
  console.log(`Current supply: ${currentSupply.toLocaleString()}`);
  console.log(`Maximum supply: ${MAX_SUPPLY.toLocaleString()}`);
  
  if (currentSupply > MAX_SUPPLY) {
    // Update the supply to the maximum value
    console.log('❌ Current supply exceeds maximum! Correcting...');
    
    db.prepare('UPDATE bonding_curve_state SET current_supply = ? WHERE id = 1')
      .run(MAX_SUPPLY);
      
    console.log(`✅ Supply corrected to ${MAX_SUPPLY.toLocaleString()}`);
  } else {
    console.log('✅ Current supply is within limits. No correction needed.');
  }
  
  db.close();
} catch (err) {
  console.error('❌ Error fixing database:', err);
  process.exit(1);
} 