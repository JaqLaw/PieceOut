#!/bin/bash
# This script creates a link to your Realm database file for easy access with Realm Studio

# Create output directory if it doesn't exist
mkdir -p ~/Desktop/PieceOutRealm

# Display starting message
echo "🔍 Searching for PieceOut Realm database in simulators..."

# Find all Realm files in the simulator directories (excluding cache files)
REALM_PATHS=$(find ~/Library/Developer/CoreSimulator/Devices -name "default.realm" -not -path "*Cache*" 2>/dev/null)

# Check if we found any Realm files
if [ -z "$REALM_PATHS" ]; then
  echo "❌ No Realm database found. Make sure your app has run at least once in the simulator."
  exit 1
fi

# Find the most recently modified Realm file
LATEST_REALM=""
LATEST_TIME=0

for path in $REALM_PATHS; do
  # Check if the file path contains "PieceOut" to filter only our app
  if [[ "$path" == *"PieceOut"* ]] || [[ "$path" == *"/Documents/default.realm" ]]; then
    # Get last modified time
    MODIFIED_TIME=$(stat -f "%m" "$path" 2>/dev/null)
    if [ $? -eq 0 ] && [ $MODIFIED_TIME -gt $LATEST_TIME ]; then
      LATEST_TIME=$MODIFIED_TIME
      LATEST_REALM=$path
    fi
  fi
done

# If we didn't find a PieceOut specific realm, just take the most recent one
if [ -z "$LATEST_REALM" ]; then
  LATEST_REALM=$(ls -t $REALM_PATHS | head -1)
fi

# Check if we found a Realm file
if [ -z "$LATEST_REALM" ]; then
  echo "❌ Could not determine the most recent Realm database. Please run your app first."
  exit 1
fi

# Create symbolic links
ln -sf "$LATEST_REALM" ~/Desktop/PieceOutRealm/default.realm
echo "✅ Linked Realm database: $LATEST_REALM"

# Link management folder if it exists
if [ -d "${LATEST_REALM}.management" ]; then
  ln -sf "${LATEST_REALM}.management" ~/Desktop/PieceOutRealm/default.realm.management
  echo "✅ Linked management folder"
fi

# Link lock file if it exists
if [ -f "${LATEST_REALM}.lock" ]; then
  ln -sf "${LATEST_REALM}.lock" ~/Desktop/PieceOutRealm/default.realm.lock
  echo "✅ Linked lock file"
fi

echo ""
echo "🎉 Success! Your Realm database is now accessible at:"
echo "~/Desktop/PieceOutRealm/default.realm"
echo ""
echo "👉 Open this location with Realm Studio to view and edit your database"
echo "👉 The link will point to the current database as long as the simulator is running"
