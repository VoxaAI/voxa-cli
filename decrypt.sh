#!/usr/bin/env bash
set -euo pipefail
set -o xtrace

if [ "${TRAVIS_SECURE_ENV_VARS:-}" = "true" ]; then
  openssl aes-256-cbc -K $encrypted_25878a959762_key -iv $encrypted_25878a959762_iv \
    -in client_secret.json.enc -out test/client_secret.json -d
  openssl aes-256-cbc -K $encrypted_25878a959762_key -iv $encrypted_25878a959762_iv \
    -in azure_secret.json.enc -out test/azure_secret.json -d
fi
