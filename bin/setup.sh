#!/bin/bash
vars_path="/etc/profile.d/a_vars.sh"
repo_owner="bcarr610"
repo_name="aria-thermostat"
service_name="aria-thermostat.service"
user_home="$HOME"
service_path="/etc/systemd/system/$service_name"
aria_root="$user_home/aria"
thermostat_root="$aria_root/aria-thermostat"
bin_path="$thermostat_root/bin"
scripts_path="$thermostat_root/scripts"

# Update system
sudo apt update
sudo apt upgrade -y

# Install Deps
sudo apt install git -y
sudo apt install nodejs npm -y

# Setup aria thermostat
cd "$user_home"
mkdir "$aria_root" && cd "$aria_root"
git clone "https://github.com/$repo_owner/$repo_name.git"
cd "$thermostat_root"
git fetch --all
git checkout master
git pull

# Set Permissions
sudo chmod +x "$bin_path/*.sh"
sudo chmod +x "$scripts_path/*.sh"

# Setup service
sudo bash -c "echo -e '[Unit]\nDescription=ARIA Thermostat\nAfter=network.target\n\n[Service]\nType=simple\nExecStart=/bin/bash \$ARIA_BIN/startup.sh\nUser=root\nGroup=root\n\n[Install]\nWantedBy=multi-user.target' > '$service_path'"

# Set VARS and aliases
sudo touch "$vars_path"
echo "export ARIA_REPO_NAME=$repo_name" | sudo tee -a "$vars_path"
echo "export ARIA_SERVICE_NAME=$service_name" | sudo tee -a "$vars_path"
echo "export ARIA_SERVICE_PATH=$service_path" | sudo tee -a "$vars_path"
echo "export ARIA_ROOT=$aria_root" | sudo tee -a "$vars_path"
echo "export ARIA_THERMOSTAT_ROOT=$thermostat_root" | sudo tee -a "$vars_path"
echo "export ARIA_BIN=$bin_path" | sudo tee -a "$vars_path"
echo "export ARIA_SCRIPTS=$scripts_path" | sudo tee -a "$vars_path"
echo "alias aria:start=\"\$ARIA_SCRIPTS/service.start.sh\"" | sudo tee -a "$vars_path"
echo "alias aria:stop=\"\$ARIA_SCRIPTS/service.stop.sh\"" | sudo tee -a "$vars_path"
echo "alias aria:restart=\"\$ARIA_SCRIPTS/service.restart.sh\"" | sudo tee -a "$vars_path"
echo "alias aria:monitor=\"\$ARIA_SCRIPTS/service.monitor.sh\"" | sudo tee -a "$vars_path"
echo "alias aria:status=\"\$ARIA_SCRIPTS/service.status.sh\"" | sudo tee -a "$vars_path"
sudo chmod +x "$vars_path"

# Initialize Service
sudo systemctl daemon-reload
sudo systemctl enable "$service_name"

# Reboot
sudo reboot
