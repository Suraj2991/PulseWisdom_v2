# Validators Overview

This folder contains input validation logic for all domain services.
Each file throws `ValidationError` on invalid input.
Sanitization and normalization are handled at the boundary layer (e.g. API or Service). 