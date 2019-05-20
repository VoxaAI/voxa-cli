#!/usr/bin/env bash
set -euo pipefail
set -o xtrace

if [ "${TRAVIS_SECURE_ENV_VARS:-}" = "true" ]; then
  openssl aes-256-cbc -K $encrypted_25878a959762_key -iv $encrypted_25878a959762_iv -in secrets.tar.enc -out secrets.tar -d
  tar xvf secrets.tar
fi
