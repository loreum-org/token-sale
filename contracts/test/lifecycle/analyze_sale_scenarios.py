#!/usr/bin/env python3
import subprocess
import re
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os
import json
from decimal import Decimal

# Set up nice styling for plots
plt.style.use('ggplot')
sns.set_palette("Set2")
sns.set_context("talk")

class BondingCurveSaleAnalyzer:
    def __init__(self, output_dir="./analysis_output"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        
    def run_forge_test(self, test_name, params=None):
        """Run a specific forge test with optional parameters"""
        cmd = ["forge", "test", "--match-test", test_name, "-vvv"]
        
        env = os.environ.copy()
        env["FOUNDRY_PROFILE"] = "lifecycle"
        
        if params:
            # Encode parameters as JSON and pass via env var
            env["TEST_PARAMS"] = json.dumps(params)
            
        print(f"Running command with FOUNDRY_PROFILE=lifecycle: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True, env=env)
        
        # Print some debug info
        print(f"Exit code: {result.returncode}")
        if result.returncode != 0:
            print(f"Error output: {result.stderr}")
            
        return result.stdout
    
    def parse_test_output(self, output):
        """Parse the forge test output to extract sale metrics"""
        # Print some debug info about the output
        print(f"Output length: {len(output)}")
        print("Output excerpt:")
        excerpt = output[-500:] if len(output) > 500 else output
        print(excerpt)
        
        # Extract token sale summary section
        summary_match = re.search(r'------- TOKEN SALE SUMMARY -------\s*(.*?)------- BONDING CURVE INTEGRITY', 
                                 output, re.DOTALL)
        
        if not summary_match:
            print("Could not find sale summary in output")
            return None
            
        summary_text = summary_match.group(1)
        print(f"Found summary: {summary_text}")
        
        # Create a dictionary of metrics
        metrics = {}
        
        # Regular expression to match key-value pairs: "Key: Value"
        pattern = r'([^:]+):\s*(\d+)'
        
        for match in re.finditer(pattern, summary_text):
            key = match.group(1).strip()
            value = int(match.group(2))
            metrics[key] = value
        
        # Extract purchase data - look for these patterns in the output
        purchases = []
        
        # Look for Purchase entries - this needs to be more flexible
        purchase_data = re.findall(r'Purchase #:\s*(\d+)[\r\n\s]*ETH spent:\s*(\d+)[\r\n\s]*Tokens received:\s*(\d+)[\r\n\s]*Current price:\s*(\d+)', 
                                  output, re.DOTALL)
        
        for purchase in purchase_data:
            purchase_num = int(purchase[0])
            eth_spent = int(purchase[1])
            tokens_received = int(purchase[2])
            current_price = int(purchase[3])
            
            purchases.append({
                'purchase_num': purchase_num,
                'eth_spent': eth_spent,
                'tokens_received': tokens_received,
                'current_price': current_price
            })
        
        print(f"Found {len(purchases)} purchase entries")
        if len(purchases) > 0:
            print(f"First purchase: {purchases[0]}")
            
        return {
            'summary': metrics,
            'purchases': purchases
        }
        
    def run_scenario_tests(self, scenarios):
        """Run multiple test scenarios and collect results"""
        results = []
        
        for scenario in scenarios:
            name = scenario.get('name', 'Unnamed Scenario')
            test_name = scenario.get('test_name', 'test_Scenario_EndToEndTokenSale')
            params = scenario.get('params', {})
            
            print(f"Running scenario: {name}")
            output = self.run_forge_test(test_name, params)
            
            data = self.parse_test_output(output)
            if data:
                data['scenario_name'] = name
                data['full_output'] = output
                results.append(data)
            else:
                print(f"Failed to parse output for scenario: {name}")
        
        return results
    
    def create_summary_table(self, results):
        """Create a summary pandas DataFrame from test results"""
        records = []
        
        for result in results:
            record = {
                'Scenario': result['scenario_name'],
                'Initial Price (wei)': result['summary'].get('Starting price', 0),
                'Final Price (wei)': result['summary'].get('Final price', 0),
                'Price Increase (%)': result['summary'].get('Price increase (%)', 0),
                'Tokens Sold': result['summary'].get('Tokens sold in sale', 0),
                'ETH Raised': result['summary'].get('Total ETH raised', 0),
                'Avg Price Per Token (wei)': result['summary'].get('Effective avg price per token', 0)
            }
            records.append(record)
            
        df = pd.DataFrame(records)
        
        # Convert to more readable units (safely handling missing data)
        df['Initial Price (ETH)'] = df['Initial Price (wei)'].apply(lambda x: x / 1e18 if x else 0)
        df['Final Price (ETH)'] = df['Final Price (wei)'].apply(lambda x: x / 1e18 if x else 0)
        df['ETH Raised'] = df['ETH Raised'].apply(lambda x: x / 1e18 if x else 0)
        df['Tokens Sold (millions)'] = df['Tokens Sold'].apply(lambda x: x / 1e6 if x else 0)
        
        return df
    
    def create_purchase_dataframe(self, results):
        """Create a DataFrame with purchase data from all scenarios"""
        all_purchases = []
        
        for result in results:
            for purchase in result['purchases']:
                purchase_data = purchase.copy()
                purchase_data['scenario'] = result['scenario_name']
                all_purchases.append(purchase_data)
                
        df = pd.DataFrame(all_purchases)
        
        # Convert to more readable units
        df['eth_spent_in_eth'] = df['eth_spent'].apply(lambda x: x / 1e18)
        df['tokens_in_millions'] = df['tokens_received'].apply(lambda x: x / 1e6)
        df['price_in_eth'] = df['current_price'].apply(lambda x: x / 1e18)
        
        return df
    
    def plot_price_progression(self, purchase_df):
        """Plot how price progresses with each purchase across scenarios"""
        plt.figure(figsize=(12, 8))
        
        for scenario in purchase_df['scenario'].unique():
            scenario_data = purchase_df[purchase_df['scenario'] == scenario]
            plt.plot(scenario_data['purchase_num'], scenario_data['price_in_eth'], 
                     marker='o', label=scenario, linewidth=2)
            
        plt.xlabel('Purchase Number')
        plt.ylabel('Token Price (ETH)')
        plt.title('Token Price Progression During Sale')
        plt.legend()
        plt.grid(True)
        plt.tight_layout()
        
        plt.savefig(f"{self.output_dir}/price_progression.png", dpi=300)
        
    def plot_tokens_per_eth(self, purchase_df):
        """Plot tokens received per ETH for each purchase"""
        purchase_df['tokens_per_eth'] = purchase_df['tokens_received'] / purchase_df['eth_spent']
        
        plt.figure(figsize=(12, 8))
        
        for scenario in purchase_df['scenario'].unique():
            scenario_data = purchase_df[purchase_df['scenario'] == scenario]
            plt.plot(scenario_data['purchase_num'], scenario_data['tokens_per_eth'], 
                     marker='o', label=scenario, linewidth=2)
            
        plt.xlabel('Purchase Number')
        plt.ylabel('Tokens Received per ETH')
        plt.title('Token Purchase Efficiency (Tokens/ETH)')
        plt.legend()
        plt.grid(True)
        plt.tight_layout()
        
        plt.savefig(f"{self.output_dir}/tokens_per_eth.png", dpi=300)
        
    def plot_summary_comparisons(self, summary_df):
        """Create bar charts comparing key metrics across scenarios"""
        metrics = [
            ('ETH Raised', 'ETH Raised (ETH)'),
            ('Tokens Sold (millions)', 'Tokens Sold (millions)'),
            ('Price Increase (%)', 'Price Increase (%)')
        ]
        
        for col, title in metrics:
            plt.figure(figsize=(10, 6))
            ax = sns.barplot(x='Scenario', y=col, data=summary_df)
            
            plt.title(title)
            plt.xticks(rotation=45, ha='right')
            plt.tight_layout()
            
            # Add value labels on top of bars
            for p in ax.patches:
                ax.annotate(f"{p.get_height():.4f}", 
                            (p.get_x() + p.get_width() / 2., p.get_height()),
                            ha = 'center', va = 'bottom',
                            xytext = (0, 5), textcoords = 'offset points')
            
            plt.savefig(f"{self.output_dir}/{col.replace(' ', '_').lower()}.png", dpi=300)
            
    def save_results(self, summary_df, purchase_df):
        """Save results to CSV files"""
        try:
            # Create output directory if it doesn't exist
            os.makedirs(self.output_dir, exist_ok=True)
            
            # Save DataFrames to CSV
            summary_df.to_csv(f"{self.output_dir}/scenario_summary.csv", index=False)
            purchase_df.to_csv(f"{self.output_dir}/purchase_details.csv", index=False)
            
            # Create markdown summary
            with open(f"{self.output_dir}/summary_report.md", 'w') as f:
                f.write("# Bonding Curve Sale Scenario Analysis\n\n")
                
                f.write("## Scenario Summary\n\n")
                try:
                    f.write(summary_df.to_markdown(index=False))
                except ImportError:
                    f.write(summary_df.to_string(index=False))
                    f.write("\n\n*Table displayed as plain text because tabulate is not installed*")
                
                f.write("\n\n## Key Metrics\n\n")
                
                # Write textual findings
                f.write("### Price Comparison\n\n")
                f.write(f"- Starting price range: {summary_df['Initial Price (ETH)'].min():.6f} ETH to {summary_df['Initial Price (ETH)'].max():.6f} ETH\n")
                f.write(f"- Final price range: {summary_df['Final Price (ETH)'].min():.6f} ETH to {summary_df['Final Price (ETH)'].max():.6f} ETH\n")
                f.write(f"- Average price increase: {summary_df['Price Increase (%)'].mean():.2f}%\n\n")
                
                f.write("### Sale Performance\n\n")
                f.write(f"- Total ETH raised (average): {summary_df['ETH Raised'].mean():.4f} ETH\n")
                f.write(f"- Tokens sold (average): {summary_df['Tokens Sold (millions)'].mean():.6f} million\n")
                
                # List of generated files for reference
                graph_files = [f for f in os.listdir(self.output_dir) if f.endswith('.png')]
                if graph_files:
                    f.write("\n\n## Graphs\n\n")
                    for graph_file in graph_files:
                        title = graph_file.replace('_', ' ').replace('.png', '').title()
                        f.write(f"### {title}\n\n")
                        f.write(f"![{title}]({graph_file})\n\n")
            
            print(f"Created summary report at {self.output_dir}/summary_report.md")
            
        except Exception as e:
            print(f"Error saving results: {e}")
            import traceback
            traceback.print_exc()

def main():
    analyzer = BondingCurveSaleAnalyzer()
    
    # Define test scenarios with varied parameters
    scenarios = [
        {
            'name': 'Standard Sale (0.01% Reserve)',
            'test_name': 'test_Scenario_EndToEndTokenSale'
        },
        {
            'name': 'Higher Reserve Ratio (0.1%)',
            'test_name': 'test_Scenario_EndToEndTokenSale',
            'params': {
                'reserve_ratio': 1000  # 0.1% reserve ratio (up from 0.01%)
            }
        },
        {
            'name': 'Lower Reserve Ratio (0.005%)',
            'test_name': 'test_Scenario_EndToEndTokenSale',
            'params': {
                'reserve_ratio': 50  # 0.005% reserve ratio
            }
        },
        {
            'name': 'Higher Initial Supply',
            'test_name': 'test_Scenario_EndToEndTokenSale',
            'params': {
                'initial_tokens': 2000 * 10**18  # 2000 tokens (up from 1000)
            }
        },
        {
            'name': 'Lower Initial Supply',
            'test_name': 'test_Scenario_EndToEndTokenSale',
            'params': {
                'initial_tokens': 500 * 10**18  # 500 tokens
            }
        },
        {
            'name': 'Higher Exponent (Quadratic)',
            'test_name': 'test_Scenario_EndToEndTokenSale',
            'params': {
                'exponent': 2 * 10**18  # Exponent of 2 for a quadratic curve
            }
        }
    ]
    
    # Run tests and get results
    results = analyzer.run_scenario_tests(scenarios)
    
    # Check if we have any results to process
    if not results:
        print("No valid results to analyze. Exiting.")
        return
        
    print(f"Successfully parsed {len(results)} scenarios")
    
    # Create dataframes
    summary_df = analyzer.create_summary_table(results)
    
    # Check if we have purchase data
    all_purchases = []
    for result in results:
        if result.get('purchases'):
            for purchase in result['purchases']:
                purchase_data = purchase.copy()
                purchase_data['scenario'] = result['scenario_name']
                all_purchases.append(purchase_data)
    
    if not all_purchases:
        print("No purchase data found in results. Cannot generate purchase graphs.")
        return
        
    purchase_df = pd.DataFrame(all_purchases)
    
    # Convert to more readable units
    purchase_df['eth_spent_in_eth'] = purchase_df['eth_spent'].apply(lambda x: x / 1e18)
    purchase_df['tokens_in_millions'] = purchase_df['tokens_received'].apply(lambda x: x / 1e6)
    purchase_df['price_in_eth'] = purchase_df['current_price'].apply(lambda x: x / 1e18)
    
    # Generate visualizations if we have enough data
    if len(results) > 1:
        analyzer.plot_price_progression(purchase_df)
        analyzer.plot_tokens_per_eth(purchase_df)
        analyzer.plot_summary_comparisons(summary_df)
    
    # Save results
    analyzer.save_results(summary_df, purchase_df)
    
    print(f"Analysis complete! Results saved to {analyzer.output_dir}/")
    print("\nSummary table:")
    print(summary_df.to_string())

if __name__ == "__main__":
    main() 