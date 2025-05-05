#!/bin/bash

# Function to rename directories
rename_directories() {
    # List of directories to rename
    local dirs=(
        "model" "models"
        "dto" "dtos"
        "transformer" "transformers"
        "validator" "validators"
        "controller" "controllers"
        "service" "services"
        "route" "routes"
        "type" "types"
        "repository" "repositories"
        "client" "clients"
    )

    # Loop through each module
    for module in "ai" "insight" "life-theme" "transit" "birthchart" "auth" "user" "feedback" "ephemeris"; do
        echo "Processing module: $module"
        
        # Rename directories
        for ((i=0; i<${#dirs[@]}; i+=2)); do
            old_name="${dirs[$i]}"
            new_name="${dirs[$i+1]}"
            
            if [ -d "apps/backend/src/core/$module/$old_name" ]; then
                echo "Renaming $old_name to $new_name in $module"
                mv "apps/backend/src/core/$module/$old_name" "apps/backend/src/core/$module/$new_name"
            fi
        done
    done
}

# Function to move service files to services directory
move_service_files() {
    # Move feedback service
    if [ -f "apps/backend/src/core/feedback/FeedbackService.ts" ]; then
        echo "Moving FeedbackService.ts to services/ in feedback"
        mkdir -p "apps/backend/src/core/feedback/services"
        mv "apps/backend/src/core/feedback/FeedbackService.ts" "apps/backend/src/core/feedback/services/"
    fi
}

# Main execution
echo "Starting directory renaming..."
rename_directories

echo "Starting service file reorganization..."
move_service_files

echo "Done!" 