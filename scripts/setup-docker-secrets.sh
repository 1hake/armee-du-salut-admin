#!/bin/bash
set -e

# Create Docker Swarm secrets on the server
# Run this ON the server (via SSH), not locally
# Usage: ssh root@<server> 'bash -s' < scripts/setup-docker-secrets.sh

echo "No runtime secrets needed for this project."
echo "The app uses SQLite with a persistent volume — no DB credentials required."
echo ""
echo "If you add secrets later, create them like this:"
echo '  echo "my_secret_value" | docker secret create ADS_SECRET_NAME -'
echo ""
echo "Then reference them in docker-compose.swarm.yml under the secrets: key."
