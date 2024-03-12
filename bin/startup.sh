#! /bin/bash

sudo source /etc/profile.d/a_vars.sh

echo "Starting ARIA Thermostat..."
sleep 5
cd "$ARIA_THERMOSTAT_ROOT"
epoch=$(date +%s)
npm start >> "$ARIA_LOGS/$epoch.log" 2>&1
