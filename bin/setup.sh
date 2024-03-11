#!/bin/bash

# Update system
sudo apt update
sudo apt upgrade -y

# Install Deps
sudo apt install git -y
sudo apt install nodejs npm -y

# Setup aria thermostat
cd $HOME
mkdir aria && cd aria
git clone https://github.com/bcarr610/aria-thermostat.git
cd aria-thermostat
sudo chmod +x bin/*.sh
