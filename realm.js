import Realm from "realm";

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

// Check if we need to delete the existing Realm file to force a new schema
const deletePreviousRealm = false; // Set to false when you're ready to go to production

if (deletePreviousRealm) {
  try {
    // Get path to Realm file
    const path = Realm.defaultPath;
    console.log("Trying to delete Realm file at:", path);

    // Delete Realm file
    Realm.deleteFile({ path });
    console.log("Successfully deleted Realm file, will create fresh database");
  } catch (error) {
    console.error("Error deleting Realm file:", error);
  }
}

// Define the migration function
const migrationFunction = (oldRealm, newRealm) => {
  console.log("Running migration...");

  // Only migrate if there are PuzzleItem objects
  if (oldRealm.schema.length > 0) {
    const oldObjects = oldRealm.objects("PuzzleItem");
    const newObjects = newRealm.objects("PuzzleItem");

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
        newObject.createdAt = new Date(); // Set to current date for existing puzzles
      }

      // Initialize lastCompletedAt based on if there are time records
      if (!newObject.lastCompletedAt) {
        // We'll set this to null for now, and update it when looking at TimeRecords
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

// TimeRecord schema for storing puzzle completion times
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

// Create the realm with migration
const realm = new Realm({
  schema: [PuzzleItem, TimeRecord],
  schemaVersion: 4, // Increment this when you change your schema
  migration: migrationFunction,
});

export default realm;
