"use client";

import { useState, useEffect, useMemo } from "react";
import { Line } from "react-chartjs-2";
import { CurveState } from "@/types";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";

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
  state: CurveState | null;
  calculatePrice: (supply: number, exponent: number, maxSupply: number, maxPrice: number) => number;
}

export function BondingCurveChart({ state, calculatePrice }: BondingCurveChartProps) {
  const [chartData, setChartData] = useState<any>(null);

  // Calculate chart data when state changes
  useEffect(() => {
    if (!state) return;

    const { exponent, maxSupply, maxPrice } = state;
    
    // Generate data points for the chart
    const points = 100;
    const step = maxSupply / points;
    const labels: string[] = [];
    const data: number[] = [];
    const borderColor: string[] = [];
    const pointBackgroundColor: string[] = [];
    const pointRadius: number[] = [];

    // Calculate the supply index for the current position marker
    const supplyIndex = Math.round((state.currentSupply / maxSupply) * points);
    
    for (let i = 0; i <= points; i++) {
      const supply = i * step;
      // Format labels for better readability
      labels.push(supply >= 1000 ? Math.round(supply / 1000) + 'K' : supply.toString());
      data.push(calculatePrice(supply, exponent, maxSupply, maxPrice));
      
      // Set the current position marker
      if (i === supplyIndex) {
        borderColor.push('rgba(52, 211, 153, 1)'); // Green color for marker
        pointBackgroundColor.push('rgba(52, 211, 153, 1)');
        pointRadius.push(6);
      } else {
        borderColor.push('rgba(59, 130, 246, 0.5)'); // Blue color for line
        pointBackgroundColor.push('rgba(59, 130, 246, 0)');
        pointRadius.push(0);
      }
    }

    setChartData({
      labels,
      datasets: [
        {
          label: 'Token Price',
          data,
          borderColor,
          pointBackgroundColor,
          pointRadius,
          tension: 0.4,
          borderWidth: 2,
        },
      ],
    });
  }, [state, calculatePrice]);

  // Chart options with proper styling
  const options = useMemo<ChartOptions<'line'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000
    },
    elements: {
      line: {
        borderJoinStyle: 'round' as const,
      },
      point: {
        hoverRadius: 8,
        hoverBorderWidth: 4
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: '#e5e7eb',
        bodyColor: '#e5e7eb',
        borderColor: '#4b5563',
        borderWidth: 1,
        padding: 16,
        displayColors: false,
        callbacks: {
          label: function(context: any) {
            return `Price: ${context.raw.toFixed(4)} ETH`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(75, 85, 99, 0.2)',
          borderColor: '#4b5563'
        },
        ticks: {
          color: '#9ca3af',
          font: {
            family: 'monospace'
          },
          callback: function(value: any, index: number, values: any[]) {
            // Format large numbers with K instead of 000,000
            return value >= 1000 ? (value / 1000) + 'K' : value;
          }
        },
        title: {
          display: true,
          text: 'Token Supply',
          color: '#9ca3af',
          font: {
            family: 'system-ui',
            weight: 'normal' as const
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(75, 85, 99, 0.2)',
          borderColor: '#4b5563'
        },
        ticks: {
          color: '#9ca3af',
          font: {
            family: 'monospace'
          },
          callback: function(value: any) {
            return value.toFixed(4) + ' ETH';
          }
        },
        title: {
          display: true,
          text: 'Token Price (ETH)',
          color: '#9ca3af',
          font: {
            family: 'system-ui',
            weight: 'normal' as const
          }
        },
      }
    }
  }), []);

  if (!chartData) {
    return (
      <div className="w-full h-80 bg-gray-900/40 border border-gray-800 rounded-lg flex justify-center items-center">
        <div className="text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-400 border-r-transparent mb-2"></div>
          <p className="text-gray-400 text-sm">Rendering chart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-80 bg-gray-900/40 border border-gray-800 rounded-lg p-4 shadow-xl shadow-blue-900/5">
      <Line data={chartData} options={options} />
    </div>
  );
} 