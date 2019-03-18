#!/usr/bin/env bash
set -euo pipefail
set -o xtrace

if [ "${TRAVIS_SECURE_ENV_VARS:-}" = "true" ]; then
  npm install codecov -g
  codecov
fi
