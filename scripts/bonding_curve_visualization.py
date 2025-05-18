import numpy as np
import matplotlib.pyplot as plt

def calculate_price(supply, exponent, max_supply, max_price):
    """Calculate token price based on supply using the convex bonding curve formula"""
    normalized_supply = supply / max_supply
    return (normalized_supply ** exponent) * max_price

def main():
    # Parameters
    max_supply = 100000000  # Maximum supply to show on the chart
    max_price = 0.1  # Maximum price in ETH (capped at 0.1 ETH)
    exponents = [1, 1.5, 2, 2.5, 3]  # Different exponents to compare
    supply = np.linspace(0, max_supply, 1000)  # Generate supply points

    # Create the plot
    plt.figure(figsize=(12, 8))
    
    # Define colors for better visibility
    colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd']
    
    # Plot curves for different exponents
    for i, n in enumerate(exponents):
        price = calculate_price(supply, n, max_supply, max_price)
        plt.plot(supply, price, label=f'n = {n}', color=colors[i], linewidth=2)

    # Customize the plot
    plt.title('LORE Token Bonding Curve', fontsize=16, pad=20)
    plt.xlabel('Token Supply', fontsize=12)
    plt.ylabel('Token Price (ETH)', fontsize=12)
    plt.grid(True, linestyle='--', alpha=0.7)
    
    # Improve legend
    plt.legend(fontsize=12, loc='upper left', framealpha=0.9)
    
    # Add annotations
    plt.annotate('Price increases at increasing rate',
                xy=(max_supply * 0.7, calculate_price(max_supply * 0.7, 2, max_supply, max_price)),
                xytext=(max_supply * 0.3, calculate_price(max_supply * 0.7, 2, max_supply, max_price) * 0.5),
                arrowprops=dict(facecolor='black', shrink=0.05),
                fontsize=10)

    # Set axis limits
    plt.xlim(0, max_supply)
    plt.ylim(0, max_price)
    
    # Format y-axis to show values between 0 and 0.1 ETH
    plt.yticks(np.linspace(0, max_price, 6))
    
    # Format y-axis to show ETH values
    plt.gca().yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'{x:.2f} ETH'))

    # Add some padding around the plot
    plt.tight_layout()

    # Save the plot with high DPI
    plt.savefig('bonding_curve.png', dpi=300, bbox_inches='tight')
    plt.close()

if __name__ == "__main__":
    main() 