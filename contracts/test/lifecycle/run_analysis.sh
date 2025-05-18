#!/bin/bash

# Script to run the bonding curve sale scenario analysis

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse command-line arguments
TEST_MODE=false
for arg in "$@"; do
    case $arg in
        --test)
            TEST_MODE=true
            shift
            ;;
    esac
done

echo -e "${BLUE}===== Bonding Curve Sale Scenario Analysis =====${NC}"
if $TEST_MODE; then
    echo -e "${BLUE}Running in TEST mode with fewer scenarios${NC}"
else
    echo -e "${BLUE}This script will run multiple sale scenarios and generate a report${NC}"
fi

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is required but not found. Please install Python 3."
    exit 1
fi

# Check if venv module is available
python3 -c "import venv" &> /dev/null
if [ $? -ne 0 ]; then
    echo "Python venv module is required but not found. Please install it."
    exit 1
fi

# Check if Foundry is available
if ! command -v forge &> /dev/null; then
    echo "Foundry is required but not found. Please install Foundry."
    exit 1
fi

echo -e "${GREEN}Setting up Python virtual environment...${NC}"

# Create and activate virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install required packages
echo -e "${GREEN}Installing required Python packages...${NC}"
pip install -r requirements.txt

# Create output directory if it doesn't exist
mkdir -p analysis_output

# Run analysis
echo -e "${GREEN}Running analysis script...${NC}"
if $TEST_MODE; then
    # In test mode, run with fewer scenarios
    python3 -c "
import sys

from analyze_sale_scenarios import BondingCurveSaleAnalyzer, pd, main

def test_main():
    analyzer = BondingCurveSaleAnalyzer()
    # Define only 2 test scenarios for quick testing
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
        }
    ]
    
    results = analyzer.run_scenario_tests(scenarios)
    if not results:
        print('No valid results to analyze. Exiting.')
        return
        
    print(f'Successfully parsed {len(results)} scenarios')
    summary_df = analyzer.create_summary_table(results)
    print('\\nSummary table:')
    print(summary_df.to_string())
    print('\\nTest complete!')

test_main()
"
else
    # In normal mode, run the full analysis
    python3 analyze_sale_scenarios.py
fi

# Open the report if on macOS and not in test mode
if [[ "$OSTYPE" == "darwin"* ]] && ! $TEST_MODE; then
    echo -e "${GREEN}Opening the analysis report...${NC}"
    open analysis_output/summary_report.md
elif ! $TEST_MODE; then
    echo -e "${GREEN}Analysis complete! Results are in analysis_output/summary_report.md${NC}"
fi

# Deactivate the virtual environment
deactivate

echo -e "${BLUE}===== Analysis Complete =====${NC}"     