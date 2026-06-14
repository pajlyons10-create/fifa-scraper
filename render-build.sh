#!/usr/bin/env bash
# exit on error
set -o errexit

# Install standard dependencies
npm install

# Define and create the absolute cache location
export PUPPETEER_CACHE_DIR=/opt/render/.cache/puppeteer
mkdir -p $PUPPETEER_CACHE_DIR

# Force download Chrome to that target folder
npx puppeteer browsers install chrome
