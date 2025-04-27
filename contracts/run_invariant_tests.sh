#!/bin/bash

# Run Foundry tests with the invariant configuration
forge test --config-path foundry.invariant.toml "$@" 