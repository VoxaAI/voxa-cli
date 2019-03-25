#!/usr/bin/env bash
set -euo pipefail
set -o xtrace

rm -rf test/out

yarn install --frozen-lockfile
yarn lint

yarn test-ci
yarn report
