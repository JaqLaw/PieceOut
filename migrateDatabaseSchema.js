// filepath: /Users/jaq/PieceOut/migrateDatabaseSchema.js
import Realm from "realm";

// Define the schemas
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

console.log("Starting manual database migration process...");

// Get current schema version
try {
  const currentVersion = Realm.schemaVersion(Realm.defaultPath);
  console.log(`Current schema version: ${currentVersion}`);
  console.log("Target schema version: 4");

  // Open realm with migration
  const realm = new Realm({
    schema: [PuzzleItem, TimeRecord],
    schemaVersion: 4,
    migration: (oldRealm, newRealm) => {
      console.log(
        "Running migration from version",
        oldRealm.schemaVersion,
        "to version 4"
      );

      // Only migrate if there are PuzzleItem objects
      if (oldRealm.schema.length > 0) {
        const oldObjects = oldRealm.objects("PuzzleItem");
        const newObjects = newRealm.objects("PuzzleItem");

        console.log(`Migrating ${oldObjects.length} puzzle items...`);

        // For each old object, initialize new fields
        for (let i = 0; i < oldObjects.length; i++) {
          const newObject = newObjects[i];

          // Initialize new date fields
          if (!newObject.createdAt) {
            newObject.createdAt = new Date();
            console.log(`Set createdAt for puzzle "${newObject.name}"`);
          }

          if (!newObject.lastCompletedAt) {
            newObject.lastCompletedAt = null;
          }
        }

        // Set lastCompletedAt based on TimeRecords
        try {
          if (newRealm.schema.some((s) => s.name === "TimeRecord")) {
            for (let i = 0; i < newObjects.length; i++) {
              const puzzleId = newObjects[i].id;
              const timeRecords = newRealm
                .objects("TimeRecord")
                .filtered("puzzleId == $0", puzzleId);

              if (timeRecords.length > 0) {
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
          console.error("Error updating lastCompletedAt:", error);
        }
      }

      console.log("Migration completed successfully!");
    },
  });

  // Print some information about the migrated database
  const puzzles = realm.objects("PuzzleItem");
  console.log(`Total puzzles after migration: ${puzzles.length}`);

  // Close the realm
  realm.close();

  console.log(
    "Database migration process finished. You may now restart your app."
  );
  process.exit(0);
} catch (error) {
  console.error("Migration failed:", error);
  process.exit(1);
}
