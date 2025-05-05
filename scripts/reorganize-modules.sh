#!/bin/bash

# Function to create standard module structure
create_module_structure() {
    local module=$1
    echo "Creating standard structure for $module..."
    
    # Create standard directories
    mkdir -p "apps/backend/src/core/$module/controllers"
    mkdir -p "apps/backend/src/core/$module/services"
    mkdir -p "apps/backend/src/core/$module/models"
    mkdir -p "apps/backend/src/core/$module/types"
    mkdir -p "apps/backend/src/core/$module/dtos"
    mkdir -p "apps/backend/src/core/$module/validators"
    mkdir -p "apps/backend/src/core/$module/transformers"
    mkdir -p "apps/backend/src/core/$module/ports"
    mkdir -p "apps/backend/src/core/$module/utils"
}

# Function to reorganize life-theme module
reorganize_life_theme() {
    echo "Reorganizing life-theme module..."
    
    # Move files to appropriate directories
    if [ -f "apps/backend/src/core/life-theme/LifeThemeService.ts" ]; then
        mv "apps/backend/src/core/life-theme/LifeThemeService.ts" "apps/backend/src/core/life-theme/services/"
    fi
    
    if [ -f "apps/backend/src/core/life-theme/LifeThemeController.ts" ]; then
        mv "apps/backend/src/core/life-theme/LifeThemeController.ts" "apps/backend/src/core/life-theme/controllers/"
    fi
    
    if [ -f "apps/backend/src/core/life-theme/lifeTheme.routes.ts" ]; then
        mv "apps/backend/src/core/life-theme/lifeTheme.routes.ts" "apps/backend/src/core/life-theme/routes/"
    fi
    
    if [ -f "apps/backend/src/core/life-theme/lifeTheme_model.ts" ]; then
        mv "apps/backend/src/core/life-theme/lifeTheme_model.ts" "apps/backend/src/core/life-theme/models/"
    fi
    
    if [ -f "apps/backend/src/core/life-theme/lifeTheme.types.ts" ]; then
        mv "apps/backend/src/core/life-theme/lifeTheme.types.ts" "apps/backend/src/core/life-theme/types/"
    fi
    
    if [ -f "apps/backend/src/core/life-theme/lifeThemeAnalysis.types.ts" ]; then
        mv "apps/backend/src/core/life-theme/lifeThemeAnalysis.types.ts" "apps/backend/src/core/life-theme/types/"
    fi
    
    if [ -f "apps/backend/src/core/life-theme/lifetheme.validator.ts" ]; then
        mv "apps/backend/src/core/life-theme/lifetheme.validator.ts" "apps/backend/src/core/life-theme/validators/"
    fi
}

# Function to reorganize transit module
reorganize_transit() {
    echo "Reorganizing transit module..."
    
    # Move files to appropriate directories
    if [ -f "apps/backend/src/core/transit/TransitService.ts" ]; then
        mv "apps/backend/src/core/transit/TransitService.ts" "apps/backend/src/core/transit/services/"
    fi
    
    if [ -f "apps/backend/src/core/transit/TransitController.ts" ]; then
        mv "apps/backend/src/core/transit/TransitController.ts" "apps/backend/src/core/transit/controllers/"
    fi
    
    if [ -f "apps/backend/src/core/transit/transit.routes.ts" ]; then
        mv "apps/backend/src/core/transit/transit.routes.ts" "apps/backend/src/core/transit/routes/"
    fi
    
    if [ -f "apps/backend/src/core/transit/transit.types.ts" ]; then
        mv "apps/backend/src/core/transit/transit.types.ts" "apps/backend/src/core/transit/types/"
    fi
    
    if [ -f "apps/backend/src/core/transit/TransitClassifier.ts" ]; then
        mv "apps/backend/src/core/transit/TransitClassifier.ts" "apps/backend/src/core/transit/services/"
    fi
}

# Function to reorganize feedback module
reorganize_feedback() {
    echo "Reorganizing feedback module..."
    
    # Move files to appropriate directories
    if [ -f "apps/backend/src/core/feedback/FeedbackService.ts" ]; then
        mv "apps/backend/src/core/feedback/FeedbackService.ts" "apps/backend/src/core/feedback/services/"
    fi
}

# Function to reorganize auth module
reorganize_auth() {
    echo "Reorganizing auth module..."
    
    # Move files to appropriate directories
    if [ -f "apps/backend/src/core/auth/AuthService.ts" ]; then
        mv "apps/backend/src/core/auth/AuthService.ts" "apps/backend/src/core/auth/services/"
    fi
}

# Main execution
echo "Starting module reorganization..."

# Create standard structure for each module
for module in "life-theme" "transit" "feedback" "auth"; do
    create_module_structure "$module"
done

# Reorganize each module
reorganize_life_theme
reorganize_transit
reorganize_feedback
reorganize_auth

echo "Done!" 