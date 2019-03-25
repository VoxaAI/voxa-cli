#!/usr/bin/env bash
set -euo pipefail
set -o xtrace

rm -rf test/out

yarn install --frozen-lockfile
yarn lint
yarn test

if [ "${TRAVIS_SECURE_ENV_VARS:-}" = "true" ]; then
  yarn test-ci
  yarn report
fi
