#!/bin/bash
set -e

# Setup GitHub secrets for the ads project
# Usage: ./scripts/setup-github-secrets.sh

REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
ENV_NAME="production"

# Defaults
DEFAULT_DOCKER_USERNAME="thegobc"
DEFAULT_SERVER_HOST="92.113.25.5"
DEFAULT_SSH_USER="root"

echo "Setting up GitHub secrets for $REPO..."

# Create the production environment if it doesn't exist
gh api "repos/$REPO/environments/$ENV_NAME" -X PUT --silent

prompt_secret() {
  local NAME="$1"
  local DEFAULT="$2"

  if [ -n "$DEFAULT" ]; then
    echo "Enter value for $NAME [${DEFAULT}]:"
  else
    echo "Enter value for $NAME:"
  fi

  read -rs VALUE
  VALUE="${VALUE:-$DEFAULT}"

  if [ -n "$VALUE" ]; then
    echo "$VALUE" | gh secret set "$NAME" --env "$ENV_NAME"
    echo "  ✓ $NAME set"
  else
    echo "  ⏭ $NAME skipped"
  fi
}

echo ""
prompt_secret "DOCKER_USERNAME" "$DEFAULT_DOCKER_USERNAME"
echo ""
prompt_secret "DOCKER_PASSWORD" ""
echo ""
prompt_secret "SSH_PRIVATE_KEY_NOPW" ""
echo ""
prompt_secret "SERVER_HOST" "$DEFAULT_SERVER_HOST"
echo ""
prompt_secret "SSH_USER" "$DEFAULT_SSH_USER"

echo ""
echo "Done! Secrets are linked to the '$ENV_NAME' environment."
echo "Go to: https://github.com/$REPO/settings/environments"
