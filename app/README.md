# LORE Token Bonding Curve Simulator

An interactive bonding curve simulator for the LORE token with real-time price discovery and wallet connection support.

## Features

- Interactive bonding curve visualization
- Buy and sell LORE tokens with simulated ETH
- Connect your Ethereum wallet
- View transaction history
- Performance tracking with PnL calculations
- Rank comparison system

## Setup Instructions

1. Clone the repository
2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following variables:
   ```
   # WalletConnect ProjectID - Get one at https://cloud.walletconnect.com/
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="YOUR_WALLETCONNECT_PROJECT_ID"

   # Alchemy API Key - Get one at https://www.alchemy.com/
   NEXT_PUBLIC_ALCHEMY_ID="YOUR_ALCHEMY_API_KEY"
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Wallet Connection

The application uses ConnectKit and wagmi to provide wallet connection functionality. Users can connect their Ethereum wallets (MetaMask, WalletConnect, Coinbase Wallet, etc.) to interact with the bonding curve simulator.

To fully implement wallet-specific transactions, follow the instructions in `/src/app/api/bonding-curve/wallet-integration.md` to update the backend API.

## Technologies Used

- Next.js 15
- React
- TailwindCSS
- Chart.js
- SQLite (for persistent storage)
- ConnectKit & wagmi (for wallet connection)
- TypeScript

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
