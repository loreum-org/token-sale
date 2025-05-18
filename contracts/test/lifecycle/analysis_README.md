# Bonding Curve Sale Analysis

This directory contains tools to analyze different scenarios for the bonding curve token sale contract.

## Setup

1. Install Python dependencies:

```bash
pip install -r requirements.txt
```

2. Make sure you have Foundry installed and set up.

## Running the Analysis

Run the analysis script from the contracts directory:

```bash
cd /path/to/token-sale/contracts
./test/lifecycle/analyze_sale_scenarios.py
```

The script will:

1. Run multiple test scenarios with different parameters
2. Parse the test output to extract key metrics
3. Generate comparative graphs showing how different parameters affect the token sale
4. Create a summary report with tables and visualizations

## Output

Results are saved to the `test/lifecycle/analysis_output` directory:

- `summary_report.md`: A comprehensive report with tables and embedded graphs
- `scenario_summary.csv`: Raw data from all scenarios in CSV format
- `purchase_details.csv`: Details of individual purchases in each scenario
- Various PNG files with visualizations

## Customizing Scenarios

To add or modify scenarios, edit the `scenarios` list in the `analyze_sale_scenarios.py` script. Each scenario can have the following parameters:

- `reserve_ratio`: The reserve ratio for the bonding curve (in parts per million)
- `initial_tokens`: The initial token supply for the bonding curve
- `initial_eth`: The initial ETH to seed the bonding curve
- `exponent`: The exponent for the bonding curve formula

## Interpreting Results

The analysis helps understand how different parameters affect:

1. Price progression during the sale
2. Total ETH raised
3. Number of tokens sold
4. Price impact of purchases
5. Overall efficiency of the token sale mechanism 