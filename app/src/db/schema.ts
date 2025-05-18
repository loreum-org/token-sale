import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Table to store the current state of the bonding curve
export const bondingCurveState = sqliteTable('bonding_curve_state', {
  id: integer('id').primaryKey(),
  currentSupply: real('current_supply').notNull(),
  reserveBalance: real('reserve_balance').notNull(),
  exponent: real('exponent').notNull(),
  maxSupply: real('max_supply').notNull(),
  maxPrice: real('max_price').notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Table to store user wallets
export const userWallets = sqliteTable('user_wallets', {
  id: integer('id').primaryKey(),
  address: text('address').notNull().unique(),
  ethBalance: real('eth_balance').notNull(),
  tokenBalance: real('token_balance').notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Table to store transaction history
export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey(),
  userAddress: text('user_address').notNull(),
  isBuy: integer('is_buy', { mode: 'boolean' }).notNull(),
  ethAmount: real('eth_amount').notNull(),
  tokenAmount: real('token_amount').notNull(),
  pricePerToken: real('price_per_token').notNull(),
  timestamp: text('timestamp').default(sql`CURRENT_TIMESTAMP`),
});

// Create type definitions for our tables
export type BondingCurveState = typeof bondingCurveState.$inferSelect;
export type UserWallet = typeof userWallets.$inferSelect;
export type Transaction = typeof transactions.$inferSelect; 