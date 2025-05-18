import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { bondingCurveState, userWallets, transactions } from './schema';
import { eq, sql } from 'drizzle-orm';

// Create a database connection
let db: ReturnType<typeof initDb>;

// Default initial state values
const DEFAULT_CURRENT_SUPPLY = 10_000_000;
const DEFAULT_RESERVE_BALANCE = 1; // ETH
const DEFAULT_EXPONENT = 1.5;
const DEFAULT_MAX_SUPPLY = 100_000_000;
const DEFAULT_MAX_PRICE = 0.001 // ETH - maximum price range capped at 0.1 ETH
const DEFAULT_MOCK_ADDRESS = '0xMock0000000000000000000000000000000001';
const DEFAULT_USER_ETH_BALANCE = 1000;
const DEFAULT_USER_TOKEN_BALANCE = 0;

function initDb() {
  // Open database connection (create if it doesn't exist)
  const sqlite = new Database('bonding-curve.db');
  
  // Create Drizzle instance
  const db = drizzle(sqlite);
  
  // Initialize database tables if they don't exist
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS bonding_curve_state (
      id INTEGER PRIMARY KEY,
      current_supply REAL NOT NULL,
      reserve_balance REAL NOT NULL,
      exponent REAL NOT NULL,
      max_supply REAL NOT NULL,
      max_price REAL NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS user_wallets (
      id INTEGER PRIMARY KEY,
      address TEXT NOT NULL UNIQUE,
      eth_balance REAL NOT NULL,
      token_balance REAL NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY,
      user_address TEXT NOT NULL,
      is_buy INTEGER NOT NULL,
      eth_amount REAL NOT NULL,
      token_amount REAL NOT NULL,
      price_per_token REAL NOT NULL,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // Initialize bonding curve state if it doesn't exist
  const state = db.select().from(bondingCurveState).all();
  if (state.length === 0) {
    db.insert(bondingCurveState).values({
      id: 1,
      currentSupply: DEFAULT_CURRENT_SUPPLY,
      reserveBalance: DEFAULT_RESERVE_BALANCE,
      exponent: DEFAULT_EXPONENT,
      maxSupply: DEFAULT_MAX_SUPPLY,
      maxPrice: DEFAULT_MAX_PRICE,
    }).run();
  }
  
  // Initialize mock user if it doesn't exist
  const user = db.select().from(userWallets).where(eq(userWallets.address, DEFAULT_MOCK_ADDRESS)).all();
  if (user.length === 0) {
    db.insert(userWallets).values({
      address: DEFAULT_MOCK_ADDRESS,
      ethBalance: DEFAULT_USER_ETH_BALANCE,
      tokenBalance: DEFAULT_USER_TOKEN_BALANCE,
    }).run();
  }
  
  return db;
}

// Get database instance (initialize if needed)
export function getDb() {
  if (!db) {
    db = initDb();
  }
  return db;
}

// Function to get current bonding curve state
export function getBondingCurveState() {
  const db = getDb();
  return db.select().from(bondingCurveState).where(eq(bondingCurveState.id, 1)).get();
}

// Function to update bonding curve state
export function updateBondingCurveState(state: Partial<Omit<typeof bondingCurveState.$inferInsert, 'id' | 'updatedAt'>>) {
  const db = getDb();
  return db.update(bondingCurveState)
    .set({
      ...state,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(bondingCurveState.id, 1))
    .run();
}

// Function to get user wallet
export function getUserWallet(address: string) {
  const db = getDb();
  const wallet = db.select().from(userWallets).where(eq(userWallets.address, address)).get();
  
  // If wallet does not exist, create it with default values
  if (!wallet) {
    db.insert(userWallets).values({
      address,
      ethBalance: DEFAULT_USER_ETH_BALANCE,
      tokenBalance: DEFAULT_USER_TOKEN_BALANCE,
    }).run();
    
    return db.select().from(userWallets).where(eq(userWallets.address, address)).get();
  }
  
  return wallet;
}

// Function to update user wallet
export function updateUserWallet(address: string, updates: Partial<Omit<typeof userWallets.$inferInsert, 'id' | 'address' | 'updatedAt'>>) {
  const db = getDb();
  return db.update(userWallets)
    .set({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(userWallets.address, address))
    .run();
}

// Function to record a transaction
export function recordTransaction(transaction: Omit<typeof transactions.$inferInsert, 'id' | 'timestamp'>) {
  const db = getDb();
  return db.insert(transactions)
    .values({
      ...transaction,
      timestamp: new Date().toISOString(),
    })
    .run();
}

// Function to get transaction history for a user
export function getTransactionHistory(address: string) {
  const db = getDb();
  return db.select().from(transactions)
    .where(eq(transactions.userAddress, address))
    .orderBy(sql`timestamp DESC`)
    .all();
}

// Export default mock address for simulation mode
export const MOCK_ADDRESS = DEFAULT_MOCK_ADDRESS; 