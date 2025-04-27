'use client';

import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  ChartData,
  ChartOptions,
  TooltipItem,
  Scale
} from 'chart.js';
import { TokenData } from '../../services/tokenService';
import { generateCurveData, generateSupplyRange, formatPrice } from '../../utils/calculations';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface BondingCurveChartProps {
  tokenData: TokenData | null;
  loading: boolean;
}

const BondingCurveChart = ({ tokenData, loading }: BondingCurveChartProps) => {
  const [chartData, setChartData] = useState<ChartData<'line'>>({
    labels: [],
    datasets: []
  });
  
  const [chartOptions, setChartOptions] = useState<ChartOptions<'line'>>({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context: TooltipItem<'line'>) {
            return `Price: ${formatPrice(context.parsed.y)}`;
          }
        }
      },
    },
    scales: {
      y: {
        title: {
          display: true,
          text: 'Price (ETH)'
        },
        ticks: {
          callback: function(tickValue: string | number) {
            return formatPrice(tickValue.toString());
          }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Token Supply'
        }
      }
    }
  });

  useEffect(() => {
    if (!tokenData) return;

    // Convert string values to numbers
    const totalSupply = parseFloat(tokenData.totalSupply);
    const maxSupply = parseFloat(tokenData.maxSupply);
    const currentPrice = parseFloat(tokenData.currentPrice);
    
    // Generate data points for the bonding curve
    const supplyRange = generateSupplyRange(totalSupply, maxSupply);
    const curveData = generateCurveData(supplyRange);
    
    // Format labels (supply points)
    const labels = supplyRange.map(supply => supply.toLocaleString());
    
    // Create points for the current position marker
    const currentPositionData = Array(supplyRange.length).fill(null);
    const currentIndex = supplyRange.findIndex(supply => supply >= totalSupply);
    if (currentIndex !== -1) {
      currentPositionData[currentIndex] = currentPrice;
    }
    
    // Set chart data
    setChartData({
      labels,
      datasets: [
        {
          label: 'Bonding Curve',
          data: curveData.map(point => point.price),
          borderColor: 'rgba(99, 102, 241, 1)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Current Position',
          data: currentPositionData,
          borderColor: 'rgba(239, 68, 68, 1)',
          backgroundColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 0,
          pointRadius: 6,
          pointHoverRadius: 8,
        }
      ]
    });
  }, [tokenData]);

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="h-80 w-full bg-gray-100 animate-pulse rounded"></div>
      </div>
    );
  }

  if (!tokenData) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center text-gray-500 py-12">
          Connect your wallet to view the bonding curve.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Bonding Curve</h2>
      <div className="h-80">
        <Line data={chartData} options={chartOptions} />
      </div>
      <div className="mt-4 text-sm text-gray-500">
        <p>
          The bonding curve determines token price based on supply. As more tokens are bought, 
          the price increases according to the curve.
        </p>
        <p className="mt-2">
          Current price: {formatPrice(tokenData.currentPrice)} at {parseFloat(tokenData.totalSupply).toLocaleString()} tokens.
        </p>
      </div>
    </div>
  );
};

export default BondingCurveChart; 