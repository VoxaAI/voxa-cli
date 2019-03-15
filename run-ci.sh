#!/usr/bin/env bash
set -euo pipefail
set -o xtrace

rm -rf test/out

yarn install --frozen-lockfile
yarn test-ci
yarn lint
yarn report
