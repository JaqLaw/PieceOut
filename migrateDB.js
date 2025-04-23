// filepath: /Users/jaq/PieceOut/migrateDB.js
const Realm = require("realm");

// Define the schemas (duplicate them here for this script only)
class PuzzleItem extends Realm.Object {}
PuzzleItem.schema = {
  name: "PuzzleItem",
  properties: {
    id: "int",
    name: "string",
    brand: "string?",
    pieces: "int?",
    notes: "string?",
    imageUri: "string?",
    bestTimeHours: "int?",
    bestTimeMinutes: "int?",
    bestTimeSeconds: "int?",
    createdAt: "date?",
    lastCompletedAt: "date?",
  },
  primaryKey: "id",
};

class TimeRecord extends Realm.Object {}
TimeRecord.schema = {
  name: "TimeRecord",
  properties: {
    id: "int",
    puzzleId: "int",
    date: "date",
    timeInSeconds: "int",
    ppm: "float",
  },
  primaryKey: "id",
};

// Migration function
const migrationFunction = (oldRealm, newRealm) => {
  console.log("Running migration...");

  // Only migrate if there are PuzzleItem objects
  if (oldRealm.schema.length > 0) {
    const oldObjects = oldRealm.objects("PuzzleItem");
    const newObjects = newRealm.objects("PuzzleItem");

    console.log(`Found ${oldObjects.length} puzzles to migrate`);

    // For each old object, make sure time fields are properly initialized
    for (let i = 0; i < oldObjects.length; i++) {
      const oldObject = oldObjects[i];
      const newObject = newObjects[i];

      // Initialize time fields with default values if they were null
      newObject.bestTimeHours = oldObject.bestTimeHours || 0;
      newObject.bestTimeMinutes = oldObject.bestTimeMinutes || 0;
      newObject.bestTimeSeconds = oldObject.bestTimeSeconds || 0;

      // Initialize new date fields
      if (!newObject.createdAt) {
        newObject.createdAt = new Date();
        console.log(`Set createdAt for puzzle "${newObject.name}"`);
      }

      // Initialize lastCompletedAt based on if there are time records
      if (!newObject.lastCompletedAt) {
        newObject.lastCompletedAt = null;
      }
    }

    // After initializing createdAt for all puzzles, try to set lastCompletedAt
    // by looking at related TimeRecords (if available)
    try {
      if (newRealm.schema.some((s) => s.name === "TimeRecord")) {
        for (let i = 0; i < newObjects.length; i++) {
          const puzzleId = newObjects[i].id;
          // Find all time records for this puzzle
          const timeRecords = newRealm
            .objects("TimeRecord")
            .filtered("puzzleId == $0", puzzleId);

          if (timeRecords.length > 0) {
            // Sort by date descending to get the most recent first
            const latestRecord = Array.from(timeRecords).sort(
              (a, b) => b.date.getTime() - a.date.getTime()
            )[0];

            if (latestRecord) {
              newObjects[i].lastCompletedAt = latestRecord.date;
              console.log(
                `Set lastCompletedAt for puzzle "${newObjects[i].name}" to ${latestRecord.date}`
              );
            }
          }
        }
      }
    } catch (error) {
      console.error("Error setting lastCompletedAt:", error);
    }
  }

  console.log("Migration completed");
};

// Main function
async function runMigration() {
  try {
    console.log("Starting manual database migration process...");

    // Get current schema version
    const path = Realm.defaultPath;
    const currentVersion = Realm.schemaVersion(path);
    console.log(`Database path: ${path}`);
    console.log(`Current schema version: ${currentVersion}`);
    console.log(`Target schema version: 4`);

    // Open realm with migration
    const realm = new Realm({
      schema: [PuzzleItem, TimeRecord],
      schemaVersion: 4,
      path: path,
      migration: migrationFunction,
    });

    // Print some information about the migrated database
    const puzzles = realm.objects("PuzzleItem");
    console.log(`Total puzzles after migration: ${puzzles.length}`);

    // Check if new fields were populated
    let puzzlesWithCreatedAt = 0;
    let puzzlesWithLastCompleted = 0;

    for (let i = 0; i < puzzles.length; i++) {
      const puzzle = puzzles[i];
      if (puzzle.createdAt) puzzlesWithCreatedAt++;
      if (puzzle.lastCompletedAt) puzzlesWithLastCompleted++;
    }

    console.log(
      `Puzzles with createdAt date: ${puzzlesWithCreatedAt}/${puzzles.length}`
    );
    console.log(
      `Puzzles with lastCompletedAt date: ${puzzlesWithLastCompleted}/${puzzles.length}`
    );

    // Close the realm
    realm.close();

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  }
}

// Run the migration
runMigration();
