// pages/index.tsx
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { ethers } from 'ethers';
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useTheme
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Custom hooks
import useWeb3 from '../hooks/useWeb3';
import useTokenData from '../hooks/useTokenData';
import useBondingCurve from '../hooks/useBondingCurve';

// Components
import TokenMetricsCard from '../components/dashboard/TokenMetricsCard';
import ConnectWalletButton from '../components/wallet/ConnectWalletButton';
import TransactionList from '../components/dashboard/TransactionList';
import LoadingOverlay from '../components/common/LoadingOverlay';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const theme = useTheme();
  const { account, provider, chainId, connectWallet } = useWeb3();
  const {
    currentPrice,
    totalSupply,
    maxSupply,
    marketCap,
    fullyDilutedValuation,
    loading: tokenDataLoading
  } = useTokenData();
  const {
    bondingCurveData,
    recentTransactions,
    buyTokens,
    sellTokens,
    loading: curveDataLoading
  } = useBondingCurve();

  const [chartData, setChartData] = useState(null);

  // Prepare chart data when bonding curve data is available
  useEffect(() => {
    if (bondingCurveData && bondingCurveData.length > 0) {
      const labels = bondingCurveData.map(point => point.supply);

      setChartData({
        labels,
        datasets: [
          {
            label: 'Token Price',
            data: bondingCurveData.map(point => point.price),
            borderColor: theme.palette.primary.main,
            backgroundColor: `${theme.palette.primary.main}33`, // Semi-transparent primary color
            fill: true,
            tension: 0.4
          },
          {
            label: 'Current Position',
            data: bondingCurveData.map(point =>
              point.supply === totalSupply ? point.price : null
            ),
            pointBackgroundColor: theme.palette.secondary.main,
            pointBorderColor: theme.palette.secondary.dark,
            pointRadius: 8,
            pointHoverRadius: 10,
            showLine: false
          }
        ]
      });
    }
  }, [bondingCurveData, totalSupply, theme]);

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Price: ${context.parsed.y.toFixed(6)} ETH`;
          },
          title: function(context) {
            return `Supply: ${context[0].label} LORE`;
          }
        }
      },
      title: {
        display: true,
        text: 'LORE Token Bonding Curve',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Token Supply'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Token Price (ETH)'
        }
      }
    }
  };

  const isLoading = tokenDataLoading || curveDataLoading;

  const handleQuickBuy = async () => {
    // Redirect to buy page or open a modal
    // For quick actions, we can implement a small purchase directly here
    try {
      await buyTokens(ethers.utils.parseEther("0.1")); // Buy with 0.1 ETH as example
    } catch (error) {
      console.error("Quick buy failed:", error);
    }
  };

  const handleQuickSell = async () => {
    // Similar to quick buy, either redirect or handle small sale
    try {
      await sellTokens(ethers.utils.parseEther("10")); // Sell 10 LORE tokens as example
    } catch (error) {
      console.error("Quick sell failed:", error);
    }
  };

  return (
    <>
      <Head>
        <title>LORE Token Sale | Dashboard</title>
        <meta name="description" content="Buy and sell LORE tokens using our bonding curve protocol" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {isLoading ? (
          <LoadingOverlay message="Loading dashboard data..." />
        ) : (
          <>
            {/* Header with wallet connection */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Typography variant="h4" component="h1" gutterBottom>
                LORE Token Dashboard
              </Typography>
              {!account ? (
                <ConnectWalletButton onConnect={connectWallet} />
              ) : (
                <Typography variant="body2">
                  Connected: {account.substring(0, 6)}...{account.substring(account.length - 4)}
                </Typography>
              )}
            </Box>

            {/* Token Metrics Panel */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6} lg={3}>
                <TokenMetricsCard
                  title="Current Price"
                  value={`${currentPrice} ETH`}
                  description="Price per LORE token"
                />
              </Grid>
              <Grid item xs={12} md={6} lg={3}>
                <TokenMetricsCard
                  title="Total Supply"
                  value={`${totalSupply} LORE`}
                  description={`${((totalSupply / maxSupply) * 100).toFixed(2)}% of max supply`}
                />
              </Grid>
              <Grid item xs={12} md={6} lg={3}>
                <TokenMetricsCard
                  title="Market Cap"
                  value={`${marketCap} ETH`}
                  description="Current value of circulating tokens"
                />
              </Grid>
              <Grid item xs={12} md={6} lg={3}>
                <TokenMetricsCard
                  title="Fully Diluted Valuation"
                  value={`${fullyDilutedValuation} ETH`}
                  description="Value at max supply"
                />
              </Grid>
            </Grid>

            {/* Bonding Curve Chart */}
            <Card sx={{ mb: 4, p: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Bonding Curve
                </Typography>
                <Box sx={{ height: 400 }}>
                  {chartData ? (
                    <Line options={chartOptions} data={chartData} />
                  ) : (
                    <Box sx={{
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Typography>No chart data available</Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Two-column layout for transactions and actions */}
            <Grid container spacing={3}>
              {/* Recent Transactions */}
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Recent Transactions
                    </Typography>
                    <TableContainer component={Paper} sx={{ maxHeight: 340 }}>
                      <Table stickyHeader size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Type</TableCell>
                            <TableCell>Address</TableCell>
                            <TableCell align="right">Amount</TableCell>
                            <TableCell align="right">Price</TableCell>
                            <TableCell align="right">Time</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {recentTransactions.length > 0 ? (
                            recentTransactions.map((tx, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <Box
                                    sx={{
                                      color: tx.type === 'buy' ? 'success.main' : 'error.main',
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    {tx.type.toUpperCase()}
                                  </Box>
                                </TableCell>
                                <TableCell>{`${tx.address.substring(0, 6)}...${tx.address.substring(tx.address.length - 4)}`}</TableCell>
                                <TableCell align="right">{tx.amount} LORE</TableCell>
                                <TableCell align="right">{tx.price} ETH</TableCell>
                                <TableCell align="right">{tx.time}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} align="center">No transactions yet</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Quick Actions */}
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Quick Actions
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                      <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        fullWidth
                        onClick={handleQuickBuy}
                        disabled={!account}
                      >
                        Buy LORE Tokens
                      </Button>
                      <Button
                        variant="outlined"
                        color="secondary"
                        size="large"
                        fullWidth
                        onClick={handleQuickSell}
                        disabled={!account}
                      >
                        Sell LORE Tokens
                      </Button>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        Current Price Impact:
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Buy 100 LORE:</Typography>
                        <Typography variant="body2" color="primary">+2.3% impact</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Sell 100 LORE:</Typography>
                        <Typography variant="body2" color="error">-2.1% impact</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </Container>
    </>
  );
};

export default Dashboard;
