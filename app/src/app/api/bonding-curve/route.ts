import { NextRequest, NextResponse } from 'next/server';
import {
  getBondingCurveData,
  getUserData,
  buyTokens,
  sellTokens,
  getTransactions
} from '@/services/bondingCurveService';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const walletAddress = url.searchParams.get('walletAddress') || undefined;
    
    switch (action) {
      case 'getState':
        const state = getBondingCurveData();
        const userData = walletAddress ? getUserData(walletAddress) : getUserData();
        return NextResponse.json({ ...state, ...userData });
      
      case 'getTransactions':
        const transactions = walletAddress ? getTransactions(walletAddress) : getTransactions();
        return NextResponse.json({ transactions });
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error('API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, walletAddress } = body;
    
    switch (action) {
      case 'buy':
        const { ethAmount } = body;
        if (typeof ethAmount !== 'number' || ethAmount <= 0) {
          return NextResponse.json({ error: 'Invalid ETH amount' }, { status: 400 });
        }
        const buyResult = walletAddress ? buyTokens(ethAmount, walletAddress) : buyTokens(ethAmount);
        return NextResponse.json(buyResult);
      
      case 'sell':
        const { tokenAmount } = body;
        if (typeof tokenAmount !== 'number' || tokenAmount <= 0) {
          return NextResponse.json({ error: 'Invalid token amount' }, { status: 400 });
        }
        const sellResult = walletAddress ? sellTokens(tokenAmount, walletAddress) : sellTokens(tokenAmount);
        return NextResponse.json(sellResult);
      
      // Removed ability to update exponent - it is now fixed
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error('API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 