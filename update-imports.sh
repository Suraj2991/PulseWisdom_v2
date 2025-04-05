#!/bin/bash

# Find all TypeScript files in the backend directory
find apps/backend/src -name "*.ts" -type f -exec sed -i '' 's/@pulsewisdom\/ephemeris/@pulsewisdom\/astro/g' {} +

# Remove specific imports from ephemeris that are no longer available
find apps/backend/src -name "*.ts" -type f -exec sed -i '' 's/import.*from.*@pulsewisdom\/ephemeris\/src\/validators.*//g' {} +
find apps/backend/src -name "*.ts" -type f -exec sed -i '' 's/import.*EphemerisCalculator.*from.*@pulsewisdom\/astro.*//g' {} + 