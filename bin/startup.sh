#! /bin/bash

source /etc/profile.d/a_vars.sh

echo "Starting ARIA Thermostat..."
sleep 5
cd "$ARIA_THERMOSTAT_ROOT"
npm start
