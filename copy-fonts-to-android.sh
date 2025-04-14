#!/bin/bash

# Create directory if it doesn't exist
mkdir -p android/app/src/main/assets/fonts

# Copy font from main assets to Android assets
cp assets/fonts/Jura-VariableFont_wght.ttf android/app/src/main/assets/fonts/

echo "Fonts copied to Android assets folder successfully!"
