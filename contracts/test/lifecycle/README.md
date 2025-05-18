# Bonding Curve Lifecycle Tests

This directory contains end-to-end lifecycle tests for the bonding curve token sale contract. These tests simulate comprehensive token sale scenarios including multiple actors, market conditions, and contract state transitions over time.

## Running Lifecycle Tests

You can run these tests using the lifecycle profile:

```bash
FOUNDRY_PROFILE=lifecycle forge test
```

## Test Scenarios

The lifecycle tests cover various scenarios:

- Basic Buy/Sell Flow
- Multiple Users Trading
- Reserve Ratio Changes and Impact
- Extreme Market Conditions
- Long-Term Market Simulation
- Frontrunning Simulation
- End-to-End Token Sale

These tests are separated from unit tests as they typically take longer to run and simulate more complex interactions.

## Sale Scenario Analysis

This directory also includes tools to analyze how different bonding curve parameters affect token sales. The analysis runs multiple end-to-end token sale tests with varied parameters and generates visualizations.

### Running the Analysis

For a one-step execution, run the provided script:

```bash
./test/lifecycle/run_analysis.sh
```

This will:
1. Set up a Python virtual environment
2. Install required dependencies
3. Run the analysis across multiple scenarios
4. Generate a comprehensive report with charts and tables

### Analysis Output

Results are saved to the `analysis_output` directory and include:

- `summary_report.md`: A detailed report with tables and charts
- Various visualizations of price progression, token efficiency, etc.
- Raw data files for further analysis

### Customizing Scenarios

To add or modify scenarios, edit the `scenarios` list in `analyze_sale_scenarios.py`. Key parameters include:

- `reserve_ratio`: The reserve ratio in parts per million (e.g., 100 = 0.01%)
- `initial_tokens`: The initial token supply for the bonding curve
- `initial_eth`: The initial ETH to seed the bonding curve
- `exponent`: The exponent for the curve formula (e.g., 1 = linear, 2 = quadratic)

### Requirements

- Python 3.6+
- Foundry
- Required Python packages (installed automatically by the script): 