#!/bin/bash

# Create new directory structure
mkdir -p src/{infrastructure,domain,application,api,bootstrap,shared}
mkdir -p src/domain/{models,errors,repositories,events}
mkdir -p src/application/{services,use-cases,interfaces}
mkdir -p src/infrastructure/{cache,database,external,queue}
mkdir -p src/api/{routes,controllers,middleware,validators}
mkdir -p src/shared/{utils,constants,types}

# Move files to their new locations
# Domain layer
mv src/models/* src/domain/models/ 2>/dev/null || true
mv src/types/errors.ts src/domain/errors/index.ts 2>/dev/null || true

# Application layer
mv src/services/* src/application/services/ 2>/dev/null || true
mv src/controllers/* src/api/controllers/ 2>/dev/null || true

# Infrastructure layer
mv src/infrastructure/cache/* src/infrastructure/cache/ 2>/dev/null || true
mv src/config/database.ts src/infrastructure/database/config.ts 2>/dev/null || true

# API layer
mv src/routes/* src/api/routes/ 2>/dev/null || true
mv src/middleware/* src/api/middleware/ 2>/dev/null || true

# Shared layer
mv src/utils/* src/shared/utils/ 2>/dev/null || true
mv src/types/* src/shared/types/ 2>/dev/null || true
mv src/constants/* src/shared/constants/ 2>/dev/null || true

# Clean up empty directories
find src -type d -empty -delete

echo "Directory restructuring complete!" 