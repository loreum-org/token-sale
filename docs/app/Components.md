# UI Components Reference

This document provides a reference for the main UI components used in the LORE Token Sale application.

## Layout Components

### Layout (`components/layout/Layout.tsx`)

The main layout wrapper that provides:
- Navigation header
- Footer
- Content container with standard padding
- Wallet connection status

### Navigation (`components/layout/Navigation.tsx`)

The application's main navigation bar:
- Logo and brand
- Page links (Dashboard, Buy, Sell, Portfolio)
- Wallet connection button
- Network status indicator

## Chart Components

### TokenMetrics (`components/charts/TokenMetrics.tsx`)

Displays key token metrics in card format:
- Current price
- Market cap
- Total supply
- Reserve balance
- 24h price change

```jsx
<TokenMetrics tokenData={tokenData} loading={loading} />
```

### BondingCurveChart (`components/charts/BondingCurveChart.tsx`)

Interactive visualization of the bonding curve:
- Price vs. Supply curve
- Current position indicator
- Zoom and pan functionality
- Tooltips with price/supply information

```jsx
<BondingCurveChart 
  tokenData={tokenData} 
  loading={loading} 
  highlightPrice={currentPrice} 
/>
```

### PriceHistoryChart (`components/charts/PriceHistoryChart.tsx`)

Line chart showing token price history:
- Time-series data for token price
- Configurable time ranges (24h, 7d, 30d, All)
- Tooltips with detailed information
- Optional volume indicators

```jsx
<PriceHistoryChart 
  data={priceHistory} 
  loading={loading} 
  timeRange={selectedRange} 
/>
```

## Form Components

### BuyForm (`components/forms/BuyForm.tsx`)

Form for purchasing tokens:
- ETH input with balance display
- Estimated token return calculation
- Slippage tolerance selection
- Transaction status feedback
- Submit button with loading state

```jsx
<BuyForm
  currentPrice={tokenData?.currentPrice || '0'}
  onTransactionComplete={handleTransactionComplete}
/>
```

### SellForm (`components/forms/SellForm.tsx`)

Form for selling tokens:
- Token input with balance display
- Estimated ETH return calculation
- Slippage tolerance selection
- Transaction status feedback
- Submit button with loading state

```jsx
<SellForm
  tokenData={tokenData}
  currentPrice={tokenData?.currentPrice || '0'}
  onTransactionComplete={handleTransactionComplete}
/>
```

## Wallet Components

### WalletConnect (`components/wallet/WalletConnect.tsx`)

Wallet connection button and modal:
- Connection status indicator
- Supported wallet options
- Connection error handling
- Network switching support

```jsx
<WalletConnect />
```

### AccountInfo (`components/wallet/AccountInfo.tsx`)

Display of connected account information:
- Account address (truncated)
- ETH balance
- Copy address functionality
- View on explorer link
- Disconnect option

```jsx
<AccountInfo
  address={account}
  balance={balance}
  isConnected={isConnected}
/>
```

## Utility Components

### LoadingSkeleton (`components/ui/LoadingSkeleton.tsx`)

Placeholder loading state for content:
- Adjustable size and shape
- Pulsing animation
- Customizable appearance

```jsx
<LoadingSkeleton width="100%" height="24px" />
```

### TransactionStatus (`components/ui/TransactionStatus.tsx`)

Transaction status notifications:
- Pending, success, and error states
- Transaction hash with explorer link
- Animated indicators

```jsx
<TransactionStatus
  status={txStatus}
  hash={txHash}
  errorMessage={errorMessage}
/>
```

### PriceChange (`components/ui/PriceChange.tsx`)

Visual indicator for price changes:
- Colored arrows (green/red)
- Percentage display
- Configurable time period

```jsx
<PriceChange
  value={priceDifference}
  percentage={pricePercentage}
  timeframe="24h"
/>
```

## Feedback Components

### Notification (`components/ui/Notification.tsx`)

Toast-style notification system:
- Success, warning, error, and info variants
- Auto-dismiss option
- Action buttons
- Stacked notifications

```jsx
<Notification
  type="success"
  title="Transaction Complete"
  message="Your tokens have been purchased successfully."
  onDismiss={() => dismissNotification(id)}
/>
```

### ErrorMessage (`components/ui/ErrorMessage.tsx`)

Standardized error display:
- Icon with message
- Optional details section
- Retry action button when applicable

```jsx
<ErrorMessage
  message="Failed to fetch token data"
  details={error.message}
  onRetry={refreshData}
/>
```

## Responsive Design

All components are designed with responsiveness in mind:

- **Mobile-first**: Base styles target mobile devices
- **Breakpoint-based**: Layout adjusts at sm, md, lg, and xl breakpoints
- **Stacking**: Components stack vertically on small screens
- **Grid-based**: Multi-column layouts on larger screens

Example responsive pattern:

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Content cards */}
</div>
```

## Theming and Styling

Components use a consistent styling approach:

- **Tailwind CSS**: Utility-first CSS framework
- **Component variants**: Consistent variants for common elements
- **CSS Variables**: Theme colors and dimensions defined as CSS variables
- **Dark mode support**: Components adapt to user's theme preference

## Accessibility

Accessibility features include:

- **Keyboard navigation**: All interactive elements are keyboard accessible
- **ARIA attributes**: Proper labeling for screen readers
- **Focus management**: Visible focus indicators and proper tab order
- **Color contrast**: WCAG-compliant color contrast ratios
- **Responsive text**: Font sizes adjust based on screen size 